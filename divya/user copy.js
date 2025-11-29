// User Dashboard JavaScript
const API_URL = 'https://sheetdb.io/api/v1/ipiwtojb2g89s';
let currentUser = null;
let userLoans = [];
let currentFilter = 'all';
let selectedLoanIndex = -1;
let selectedLoanForAcceptance = null;

// Check authentication
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  initializeUserDashboard();
  setupEventListeners();
});

function checkAuth() {
  const userType = sessionStorage.getItem('userType');
  const username = sessionStorage.getItem('username');

  if (!userType || userType !== 'user' || !username) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = username;
  document.getElementById('userName').textContent = username;
}

function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Apply for loan
  document.getElementById('applyLoanBtn').addEventListener('click', openApplyLoanModal);
  document.getElementById('closeApplyModal').addEventListener('click', closeApplyLoanModal);
  document.getElementById('cancelApplyBtn').addEventListener('click', closeApplyLoanModal);
  document.getElementById('applyLoanForm').addEventListener('submit', handleLoanApplication);

  // Payment modal
  document.getElementById('closePaymentModal').addEventListener('click', closePaymentModal);
  document.getElementById('cancelPaymentBtn').addEventListener('click', closePaymentModal);
  document.getElementById('paymentForm').addEventListener('submit', handlePayment);

  // Loan acceptance modal
  document.getElementById('closeLoanAcceptanceModal').addEventListener('click', closeLoanAcceptanceModal);
  document.getElementById('acceptLoanBtn').addEventListener('click', handleLoanAcceptance);
  document.getElementById('rejectLoanBtn').addEventListener('click', handleLoanRejection);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.tab;
      renderUserLoans();
    });
  });

  // Close modals on outside click
  window.addEventListener('click', function(e) {
    const applyModal = document.getElementById('applyLoanModal');
    const paymentModal = document.getElementById('paymentModal');
    const acceptanceModal = document.getElementById('loanAcceptanceModal');
    
    if (e.target === applyModal) {
      closeApplyLoanModal();
    }
    if (e.target === paymentModal) {
      closePaymentModal();
    }
    if (e.target === acceptanceModal) {
      closeLoanAcceptanceModal();
    }
  });
}

function logout() {
  sessionStorage.clear();
  showToast('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

async function initializeUserDashboard() {
  await loadUserLoans();
  updateUserStats();
  renderUserLoans();
}

async function loadUserLoans() {
  try {
    // Fetch all data from API
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Filter only this user's loan records
    userLoans = Array.isArray(data) ? data
      .filter(item => item.type === 'loan' && item.username === currentUser)
      .map(loan => ({
        ...loan,
        payments: loan.payments ? (typeof loan.payments === 'string' ? JSON.parse(loan.payments) : loan.payments) : []
      })) : [];
    
    console.log('Loaded loans:', userLoans);
  } catch (error) {
    console.error('Error loading loans:', error);
    showToast('Error loading loans', 'error');
    userLoans = [];
  }
}

function updateUserStats() {
  const totalApplications = userLoans.length;
  const approvedLoans = userLoans.filter(l => l.status === 'approved').length;
  
  let totalBorrowed = 0;
  let totalOutstanding = 0;

  userLoans.forEach(loan => {
    if (loan.status === 'approved') {
      totalBorrowed += parseFloat(loan.amount) || 0;
      const outstanding = calculateRemaining(loan);
      totalOutstanding += outstanding;
    }
  });

  document.getElementById('totalApplications').textContent = totalApplications;
  document.getElementById('approvedLoans').textContent = approvedLoans;
  document.getElementById('totalBorrowed').textContent = '₹' + totalBorrowed.toLocaleString('en-IN');
  document.getElementById('userOutstanding').textContent = '₹' + totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function renderUserLoans() {
  const tableBody = document.getElementById('userLoanTableBody');
  tableBody.innerHTML = '';

  // Filter loans based on current tab
  let filteredLoans = userLoans;
  if (currentFilter !== 'all') {
    filteredLoans = userLoans.filter(loan => loan.status === currentFilter);
  }

  if (filteredLoans.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3em; color: #999;">
          <p style="font-size: 1.1em;">No loans found</p>
          <p style="font-size: 0.9em; margin-top: 0.5em;">Click "Apply for Loan" to get started</p>
        </td>
      </tr>
    `;
    return;
  }

  filteredLoans.forEach((loan, index) => {
    const emi = loan.status === 'approved' ? calculateEMI(loan.amount, loan.interestRate, loan.duration) : 'N/A';
    const outstanding = loan.status === 'approved' ? calculateRemaining(loan) : 'N/A';
    const statusBadge = getStatusBadge(loan.status);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${loan.loanId || loan.id}</strong></td>
      <td><strong>₹${parseFloat(loan.amount).toLocaleString('en-IN')}</strong></td>
      <td>${loan.interestRate || 'Pending'}%</td>
      <td>${loan.duration} months</td>
      <td>${typeof emi === 'number' ? '₹' + emi.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : emi}</td>
      <td>${statusBadge}</td>
      <td>${new Date(loan.appliedDate || loan.createdAt).toLocaleDateString('en-IN')}</td>
      <td style="color: #ef4444; font-weight: 600;">
        ${typeof outstanding === 'number' ? '₹' + outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : outstanding}
      </td>
      <td style="white-space: nowrap;">
        ${loan.status === 'approved' ? `<button class="btn btn-small btn-action" onclick="openPaymentModalForLoan(${userLoans.indexOf(loan)})">💳 Pay</button>` : ''}
        ${loan.status === 'awaiting_user_acceptance' ? `<button class="btn btn-small btn-success" onclick="openLoanAcceptanceModal(${userLoans.indexOf(loan)})">✅ Review & Accept</button>` : ''}
        ${loan.status === 'pending' ? '<span style="color: #f59e0b; font-size: 0.85em;">Awaiting admin approval</span>' : ''}
        ${loan.status === 'rejected' ? '<span style="color: #ef4444; font-size: 0.85em;">Application rejected</span>' : ''}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="status-badge status-pending">Pending Review</span>',
    'awaiting_user_acceptance': '<span class="status-badge" style="background: #3b82f6;">Awaiting Your Response</span>',
    'approved': '<span class="status-badge status-active">Approved</span>',
    'rejected': '<span class="status-badge status-overdue">Rejected</span>',
    'completed': '<span class="status-badge status-paid">Completed</span>'
  };
  return badges[status] || '<span class="status-badge">Unknown</span>';
}

// Loan Application Modal
function openApplyLoanModal() {
  document.getElementById('applyLoanModal').style.display = 'flex';
  document.getElementById('applyLoanForm').reset();
}

function closeApplyLoanModal() {
  document.getElementById('applyLoanModal').style.display = 'none';
}

async function handleLoanApplication(e) {
  e.preventDefault();

  const amount = document.getElementById('loanAmount').value;
  const purpose = document.getElementById('loanPurpose').value;
  const duration = document.getElementById('loanDuration').value;
  const monthlyIncome = document.getElementById('monthlyIncome').value;
  const employmentType = document.getElementById('employmentType').value;

  const newApplication = {
    id: 'LOAN' + Date.now(),
    loanId: 'LOAN' + Date.now(),
    username: currentUser,
    type: 'loan',
    amount: parseFloat(amount),
    purpose: purpose,
    duration: parseInt(duration),
    monthlyIncome: parseFloat(monthlyIncome),
    employmentType: employmentType,
    status: 'pending',
    appliedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    payments: JSON.stringify([]),
    interestRate: null,
    approvedBy: null,
    approvedDate: null
  };

  try {
    showToast('Submitting application...', 'success');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: [newApplication] })
    });

    if (response.ok) {
      showToast('Loan application submitted successfully!', 'success');
      closeApplyLoanModal();
      await loadUserLoans();
      updateUserStats();
      renderUserLoans();
    } else {
      showToast('Failed to submit application', 'error');
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    showToast('Error submitting application', 'error');
  }
}

// Payment Modal
function openPaymentModalForLoan(index) {
  selectedLoanIndex = index;
  const loan = userLoans[index];
  
  if (loan.status !== 'approved') {
    showToast('Can only make payments on approved loans', 'error');
    return;
  }

  const emi = calculateEMI(loan.amount, loan.interestRate, loan.duration);
  const outstanding = calculateRemaining(loan);

  document.getElementById('paymentLoanId').textContent = loan.loanId || loan.id;
  document.getElementById('paymentEMI').textContent = '₹' + emi.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  document.getElementById('paymentOutstanding').textContent = '₹' + outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  document.getElementById('paymentAmount').value = emi.toFixed(2);

  document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
  selectedLoanIndex = -1;
}

async function handlePayment(e) {
  e.preventDefault();

  if (selectedLoanIndex === -1) return;

  const amount = parseFloat(document.getElementById('paymentAmount').value);
  const method = document.getElementById('paymentMethod').value;
  const note = document.getElementById('paymentNote').value;

  const loan = userLoans[selectedLoanIndex];
  const outstanding = calculateRemaining(loan);

  if (amount <= 0) {
    showToast('Please enter a valid amount', 'error');
    return;
  }

  if (amount > outstanding) {
    showToast('Payment amount cannot exceed outstanding balance', 'error');
    return;
  }

  const payment = {
    amount: amount,
    date: new Date().toISOString(),
    method: method,
    note: note
  };

  loan.payments.push(payment);

  try {
    showToast('Processing payment...', 'success');

    // Update loan in API
    const response = await fetch(`${API_URL}/id/${loan.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          payments: JSON.stringify(loan.payments)
        }
      })
    });

    if (response.ok) {
      showToast('Payment processed successfully!', 'success');
      closePaymentModal();
      await loadUserLoans();
      updateUserStats();
      renderUserLoans();
    } else {
      showToast('Payment failed', 'error');
      loan.payments.pop(); // Remove the payment if API call failed
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    showToast('Error processing payment', 'error');
    loan.payments.pop();
  }
}

// Calculation Functions
function calculateEMI(principal, interestRate, duration) {
  const P = parseFloat(principal);
  const r = parseFloat(interestRate) / 100 / 12;
  const n = parseInt(duration);
  
  if (r === 0) return P / n;
  
  const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  return emi;
}

function calculateTotalPayable(principal, interestRate, duration) {
  const emi = calculateEMI(principal, interestRate, duration);
  return emi * duration;
}

function calculateRemaining(loan) {
  const totalPayable = calculateTotalPayable(loan.amount, loan.interestRate, loan.duration);
  const totalPaid = loan.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  return Math.max(0, totalPayable - totalPaid);
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==================== LOAN ACCEPTANCE FUNCTIONS ====================

function openLoanAcceptanceModal(loanIndex) {
  const loan = userLoans[loanIndex];
  if (!loan) return;

  selectedLoanForAcceptance = loan;

  const amount = parseFloat(loan.amount);
  const interestRate = parseFloat(loan.interestRate);
  const duration = parseInt(loan.duration);

  const emi = calculateEMI(amount, interestRate, duration);
  const totalPayable = calculateTotalPayable(amount, interestRate, duration);
  const totalInterest = totalPayable - amount;

  // Fill modal with loan details
  document.getElementById('acceptLoanAmount').textContent = '₹' + amount.toLocaleString('en-IN');
  document.getElementById('acceptInterestRate').textContent = interestRate + '% per annum';
  document.getElementById('acceptDuration').textContent = duration + ' months';
  document.getElementById('acceptEMI').textContent = '₹' + emi.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  document.getElementById('acceptTotalInterest').textContent = '₹' + totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  document.getElementById('acceptTotalPayable').textContent = '₹' + totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  document.getElementById('loanAcceptanceModal').style.display = 'flex';
}

function closeLoanAcceptanceModal() {
  document.getElementById('loanAcceptanceModal').style.display = 'none';
  selectedLoanForAcceptance = null;
}

async function handleLoanAcceptance() {
  if (!selectedLoanForAcceptance) return;

  try {
    showToast('Processing loan acceptance...', 'success');

    const updateData = {
      status: 'approved',
      userAcceptedDate: new Date().toISOString()
    };

    const response = await fetch(`${API_URL}/id/${selectedLoanForAcceptance.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: updateData })
    });

    if (response.ok) {
      showToast('✅ Loan accepted successfully! Amount will be disbursed soon.', 'success');
      closeLoanAcceptanceModal();
      await loadUserLoans();
      updateUserStats();
      renderUserLoans();
    } else {
      showToast('Failed to accept loan', 'error');
    }
  } catch (error) {
    console.error('Error accepting loan:', error);
    showToast('Error accepting loan', 'error');
  }
}

async function handleLoanRejection() {
  if (!selectedLoanForAcceptance) return;

  const confirmReject = confirm('Are you sure you want to reject this loan offer? You will need to apply again if you change your mind.');
  if (!confirmReject) return;

  try {
    showToast('Processing loan rejection...', 'success');

    const updateData = {
      status: 'rejected',
      userRejectedDate: new Date().toISOString(),
      adminNotes: (selectedLoanForAcceptance.adminNotes || '') + '\n[User rejected the offer]'
    };

    const response = await fetch(`${API_URL}/id/${selectedLoanForAcceptance.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: updateData })
    });

    if (response.ok) {
      showToast('Loan offer rejected', 'success');
      closeLoanAcceptanceModal();
      await loadUserLoans();
      updateUserStats();
      renderUserLoans();
    } else {
      showToast('Failed to reject loan', 'error');
    }
  } catch (error) {
    console.error('Error rejecting loan:', error);
    showToast('Error rejecting loan', 'error');
  }
}
