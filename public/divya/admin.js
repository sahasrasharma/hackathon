// Admin Dashboard JavaScript
const API_URL = 'https://sheetdb.io/api/v1/ipiwtojb2g89s';
let allLoans = [];
let allUsers = [];
let selectedLoanForReview = null;
let selectedUserForDelete = null;
let statusChart = null;

// Check authentication
document.addEventListener('DOMContentLoaded', function() {
  checkAdminAuth();
  initializeAdminDashboard();
  setupEventListeners();
});

function checkAdminAuth() {
  const userType = sessionStorage.getItem('userType');

  if (!userType || userType !== 'admin') {
    window.location.href = 'login.html';
    return;
  }
}

function setupEventListeners() {
  // Navigation
  document.getElementById('dashboardLink').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('dashboardSection');
    setActiveNav('dashboardLink');
  });

  document.getElementById('pendingLink').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('pendingSection');
    setActiveNav('pendingLink');
    renderPendingApplications();
  });

  document.getElementById('allLoansLink').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('allLoansSection');
    setActiveNav('allLoansLink');
    renderAllLoans();
  });

  document.getElementById('usersLink').addEventListener('click', async (e) => {
    e.preventDefault();
    showSection('usersSection');
    setActiveNav('usersLink');
    await loadAllUsers();
    renderUsers();
  });

  document.getElementById('userProfilesLink').addEventListener('click', async (e) => {
    e.preventDefault();
    showSection('userProfilesSection');
    setActiveNav('userProfilesLink');
    await loadAllUsers();
    await loadAllLoans();
    renderUserProfiles();
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Review modal
  document.getElementById('closeReviewModal').addEventListener('click', closeReviewModal);
  document.getElementById('cancelReviewBtn').addEventListener('click', closeReviewModal);
  document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmission);
  document.getElementById('reviewAction').addEventListener('change', toggleInterestRateField);

  // History modal
  document.getElementById('closeHistoryModal').addEventListener('click', closeHistoryModal);

  // Delete user modal
  document.getElementById('closeDeleteUserModal').addEventListener('click', closeDeleteUserModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteUserModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', handleDeleteUser);

  // User profile modal
  document.getElementById('closeUserProfileModal').addEventListener('click', closeUserProfileModal);

  // Search
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('userSearchInput').addEventListener('input', handleUserSearch);
  document.getElementById('profileSearchInput').addEventListener('input', handleProfileSearch);

  // Close modals on outside click
  window.addEventListener('click', function(e) {
    const reviewModal = document.getElementById('reviewModal');
    const historyModal = document.getElementById('historyModal');
    const deleteUserModal = document.getElementById('deleteUserModal');
    const userProfileModal = document.getElementById('userProfileModal');
    
    if (e.target === reviewModal) closeReviewModal();
    if (e.target === historyModal) closeHistoryModal();
    if (e.target === deleteUserModal) closeDeleteUserModal();
    if (e.target === userProfileModal) closeUserProfileModal();
    if (e.target === historyModal) closeHistoryModal();
  });
}

function showSection(sectionId) {
  document.querySelectorAll('main section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');
}

function setActiveNav(linkId) {
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById(linkId).classList.add('active');
}

function logout() {
  sessionStorage.clear();
  showToast('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

async function initializeAdminDashboard() {
  await loadAllLoans();
  updateAdminStats();
  updateStatusChart();
  updateRecentApplications();
}

async function loadAllLoans() {
  try {
    // Fetch all data from API
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Filter only loan records (type=loan)
    allLoans = Array.isArray(data) ? data
      .filter(item => item.type === 'loan')
      .map(loan => ({
        ...loan,
        payments: loan.payments ? (typeof loan.payments === 'string' ? JSON.parse(loan.payments) : loan.payments) : []
      })) : [];
    
    console.log('Loaded all loans:', allLoans);
  } catch (error) {
    console.error('Error loading loans:', error);
    showToast('Error loading loans', 'error');
    allLoans = [];
  }
}

function updateAdminStats() {
  const pendingCount = allLoans.filter(l => l.status === 'pending').length;
  const approvedCount = allLoans.filter(l => l.status === 'approved').length;
  
  let totalDisbursed = 0;
  let totalOutstanding = 0;

  allLoans.forEach(loan => {
    if (loan.status === 'approved') {
      totalDisbursed += parseFloat(loan.amount) || 0;
      const outstanding = calculateRemaining(loan);
      totalOutstanding += outstanding;
    }
  });

  document.getElementById('pendingCount').textContent = pendingCount;
  document.getElementById('approvedCount').textContent = approvedCount;
  document.getElementById('totalDisbursed').textContent = '₹' + totalDisbursed.toLocaleString('en-IN');
  document.getElementById('adminOutstanding').textContent = '₹' + totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function updateStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  const pendingCount = allLoans.filter(l => l.status === 'pending').length;
  const approvedCount = allLoans.filter(l => l.status === 'approved').length;
  const rejectedCount = allLoans.filter(l => l.status === 'rejected').length;
  const awaitingCount = allLoans.filter(l => l.status === 'awaiting_user_acceptance').length;

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Awaiting User', 'Approved', 'Rejected'],
      datasets: [{
        data: [pendingCount, awaitingCount, approvedCount, rejectedCount],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function updateRecentApplications() {
  const recentDiv = document.getElementById('recentApplications');
  const recentApps = [...allLoans]
    .sort((a, b) => new Date(b.appliedDate || b.createdAt) - new Date(a.appliedDate || a.createdAt))
    .slice(0, 5);

  if (recentApps.length === 0) {
    recentDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 2em;">No recent applications</p>';
    return;
  }

  recentDiv.innerHTML = recentApps.map(loan => `
    <div class="recent-item">
      <div>
        <strong>${loan.username}</strong> - ₹${parseFloat(loan.amount).toLocaleString('en-IN')}
        <br>
        <small>${new Date(loan.appliedDate || loan.createdAt).toLocaleString('en-IN')}</small>
      </div>
      <span class="status-badge status-${loan.status}">${loan.status}</span>
    </div>
  `).join('');
}

function renderPendingApplications() {
  const tableBody = document.getElementById('pendingTableBody');
  const pendingLoans = allLoans.filter(l => l.status === 'pending');

  if (pendingLoans.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 3em; color: #999;">
          <p style="font-size: 1.1em;">No pending applications</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  pendingLoans.forEach(loan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${loan.loanId || loan.id}</strong></td>
      <td>${loan.username}</td>
      <td><strong>₹${parseFloat(loan.amount).toLocaleString('en-IN')}</strong></td>
      <td>${loan.purpose}</td>
      <td>${loan.duration} months</td>
      <td>₹${parseFloat(loan.monthlyIncome).toLocaleString('en-IN')}</td>
      <td>${loan.employmentType}</td>
      <td>${new Date(loan.appliedDate || loan.createdAt).toLocaleDateString('en-IN')}</td>
      <td style="white-space: nowrap;">
        <button class="btn btn-small btn-action" onclick="openReviewModal('${loan.id}')">Review</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function renderAllLoans(searchQuery = '') {
  const tableBody = document.getElementById('allLoansTableBody');
  let filteredLoans = allLoans;

  if (searchQuery) {
    filteredLoans = allLoans.filter(loan => 
      loan.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan.loanId || loan.id).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filteredLoans.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 3em; color: #999;">
          <p style="font-size: 1.1em;">No loans found</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  filteredLoans.forEach(loan => {
    const emi = loan.status === 'approved' ? calculateEMI(loan.amount, loan.interestRate, loan.duration) : 'N/A';
    const totalPayable = loan.status === 'approved' ? calculateTotalPayable(loan.amount, loan.interestRate, loan.duration) : 'N/A';
    const totalPaid = loan.status === 'approved' ? loan.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) : 'N/A';
    const outstanding = loan.status === 'approved' ? calculateRemaining(loan) : 'N/A';
    const statusBadge = getStatusBadge(loan.status);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${loan.loanId || loan.id}</strong></td>
      <td>${loan.username}</td>
      <td><strong>₹${parseFloat(loan.amount).toLocaleString('en-IN')}</strong></td>
      <td>${loan.interestRate ? loan.interestRate + '%' : 'N/A'}</td>
      <td>${typeof emi === 'number' ? '₹' + emi.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : emi}</td>
      <td>${typeof totalPayable === 'number' ? '₹' + totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : totalPayable}</td>
      <td style="color: #10b981; font-weight: 600;">
        ${typeof totalPaid === 'number' ? '₹' + totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : totalPaid}
      </td>
      <td style="color: #ef4444; font-weight: 700;">
        ${typeof outstanding === 'number' ? '₹' + outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : outstanding}
      </td>
      <td>${statusBadge}</td>
      <td style="white-space: nowrap;">
        ${loan.status === 'approved' ? `<button class="btn btn-small btn-action" onclick="openHistoryModal('${loan.id}')">📋 History</button>` : ''}
        ${loan.status === 'pending' ? `<button class="btn btn-small btn-action" onclick="openReviewModal('${loan.id}')">Review</button>` : ''}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function handleSearch(e) {
  const searchQuery = e.target.value;
  renderAllLoans(searchQuery);
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="status-badge status-pending">Pending</span>',
    'awaiting_user_acceptance': '<span class="status-badge" style="background: #3b82f6;">Awaiting User</span>',
    'approved': '<span class="status-badge status-active">Approved</span>',
    'rejected': '<span class="status-badge status-overdue">Rejected</span>'
  };
  return badges[status] || '<span class="status-badge">Unknown</span>';
}

// Review Modal
function openReviewModal(loanId) {
  const loan = allLoans.find(l => l.id === loanId);
  if (!loan) return;

  selectedLoanForReview = loan;

  document.getElementById('reviewLoanId').textContent = loan.loanId || loan.id;
  document.getElementById('reviewUsername').textContent = loan.username;
  document.getElementById('reviewAmount').textContent = '₹' + parseFloat(loan.amount).toLocaleString('en-IN');
  document.getElementById('reviewPurpose').textContent = loan.purpose;
  document.getElementById('reviewDuration').textContent = loan.duration + ' months';
  document.getElementById('reviewIncome').textContent = '₹' + parseFloat(loan.monthlyIncome).toLocaleString('en-IN');
  document.getElementById('reviewEmployment').textContent = loan.employmentType;
  document.getElementById('reviewDate').textContent = new Date(loan.appliedDate || loan.createdAt).toLocaleString('en-IN');

  document.getElementById('reviewForm').reset();
  document.getElementById('interestRateGroup').style.display = 'none';
  document.getElementById('reviewModal').style.display = 'flex';
}

function closeReviewModal() {
  document.getElementById('reviewModal').style.display = 'none';
  selectedLoanForReview = null;
}

function toggleInterestRateField() {
  const action = document.getElementById('reviewAction').value;
  const interestRateGroup = document.getElementById('interestRateGroup');
  
  if (action === 'approved') {
    interestRateGroup.style.display = 'block';
    document.getElementById('interestRate').required = true;
  } else {
    interestRateGroup.style.display = 'none';
    document.getElementById('interestRate').required = false;
  }
}

async function handleReviewSubmission(e) {
  e.preventDefault();

  if (!selectedLoanForReview) return;

  const action = document.getElementById('reviewAction').value;
  const interestRate = document.getElementById('interestRate').value;
  const adminNotes = document.getElementById('adminNotes').value;

  if (action === 'approved' && !interestRate) {
    showToast('Please enter interest rate for approved loans', 'error');
    return;
  }

  const updateData = {
    status: action === 'approved' ? 'awaiting_user_acceptance' : action,
    reviewedBy: 'admin',
    reviewedDate: new Date().toISOString(),
    adminNotes: adminNotes
  };

  if (action === 'approved') {
    updateData.interestRate = parseFloat(interestRate);
    updateData.approvedDate = new Date().toISOString();
  }

  try {
    showToast('Processing decision...', 'success');

    const response = await fetch(`${API_URL}/id/${selectedLoanForReview.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: updateData })
    });

    if (response.ok) {
      if (action === 'approved') {
        showToast('Loan approved! Waiting for user acceptance.', 'success');
      } else {
        showToast(`Loan ${action} successfully!`, 'success');
      }
      closeReviewModal();
      await loadAllLoans();
      updateAdminStats();
      updateStatusChart();
      updateRecentApplications();
      renderPendingApplications();
    } else {
      showToast('Failed to update loan status', 'error');
    }
  } catch (error) {
    console.error('Error updating loan:', error);
    showToast('Error updating loan status', 'error');
  }
}

// Payment History Modal
function openHistoryModal(loanId) {
  const loan = allLoans.find(l => l.id === loanId);
  if (!loan) return;

  const historyContent = document.getElementById('historyContent');
  
  if (!loan.payments || loan.payments.length === 0) {
    historyContent.innerHTML = '<p style="text-align: center; color: #999; padding: 2em;">No payments made yet</p>';
  } else {
    historyContent.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${loan.payments.map(payment => `
            <tr>
              <td>${new Date(payment.date).toLocaleString('en-IN')}</td>
              <td>₹${parseFloat(payment.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              <td>${payment.method}</td>
              <td>${payment.note || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top: 1em; padding: 1em; background: #f9fafb; border-radius: 8px;">
        <strong>Total Paid:</strong> ₹${loan.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </div>
    `;
  }

  document.getElementById('historyModal').style.display = 'flex';
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
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

// ==================== USER MANAGEMENT ====================

async function loadAllUsers() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Filter only user records (type=user)
    allUsers = Array.isArray(data) ? data.filter(item => item.type === 'user') : [];
    
    console.log('Loaded all users:', allUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('Error loading users', 'error');
    allUsers = [];
  }
}

function renderUsers(searchQuery = '') {
  const tableBody = document.getElementById('usersTableBody');
  let filteredUsers = allUsers;

  if (searchQuery) {
    filteredUsers = allUsers.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Calculate stats
  const totalUsers = allUsers.length;
  const activeBorrowers = [...new Set(allLoans.filter(l => l.status === 'approved').map(l => l.username))].length;
  
  document.getElementById('totalUsers').textContent = totalUsers;
  document.getElementById('activeBorrowers').textContent = activeBorrowers;

  if (filteredUsers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3em; color: #999;">
          <p style="font-size: 1.1em;">No users found</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  filteredUsers.forEach(user => {
    const userLoans = allLoans.filter(l => l.username === user.username);
    const activeLoans = userLoans.filter(l => l.status === 'approved').length;
    const totalBorrowed = userLoans
      .filter(l => l.status === 'approved')
      .reduce((sum, l) => sum + parseFloat(l.amount), 0);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${user.username}</strong></td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.phone || 'N/A'}</td>
      <td>${userLoans.length}</td>
      <td style="color: #10b981; font-weight: 600;">${activeLoans}</td>
      <td><strong>₹${totalBorrowed.toLocaleString('en-IN')}</strong></td>
      <td>${new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
      <td style="white-space: nowrap;">
        <button class="btn btn-small btn-action" onclick="openDeleteUserModal('${user.username}', ${userLoans.length})" 
          style="background: #ef4444; border-color: #ef4444;" title="Delete User">
          🗑️ Delete
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function handleUserSearch(e) {
  const searchQuery = e.target.value;
  renderUsers(searchQuery);
}

function openDeleteUserModal(username, loanCount) {
  selectedUserForDelete = username;
  
  document.getElementById('deleteUsername').textContent = username;
  document.getElementById('deleteLoanCount').textContent = loanCount;
  
  document.getElementById('deleteUserModal').style.display = 'flex';
}

function closeDeleteUserModal() {
  document.getElementById('deleteUserModal').style.display = 'none';
  selectedUserForDelete = null;
}

async function handleDeleteUser() {
  if (!selectedUserForDelete) return;

  try {
    showToast('Deleting user and all related data...', 'success');

    // Get all records for this user (user record + loan records)
    const response = await fetch(API_URL);
    const allData = await response.json();
    
    const recordsToDelete = allData.filter(item => 
      item.username === selectedUserForDelete || 
      (item.type === 'user' && item.username === selectedUserForDelete)
    );

    console.log('Records to delete:', recordsToDelete);

    // Delete each record
    for (const record of recordsToDelete) {
      try {
        await fetch(`${API_URL}/id/${record.id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting record:', record.id, error);
      }
    }

    showToast('User deleted successfully!', 'success');
    closeDeleteUserModal();
    
    // Reload data
    await loadAllUsers();
    await loadAllLoans();
    renderUsers();
    updateAdminStats();
    updateStatusChart();
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast('Error deleting user', 'error');
  }
}

// ==================== USER PROFILES ====================

function renderUserProfiles(searchQuery = '') {
  const tableBody = document.getElementById('profilesTableBody');
  let filteredUsers = allUsers;

  if (searchQuery) {
    filteredUsers = allUsers.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filteredUsers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3em; color: #999;">
          <p style="font-size: 1.1em;">No users found</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  filteredUsers.forEach(user => {
    const userLoans = allLoans.filter(l => l.username === user.username && l.status === 'approved');
    const totalBorrowed = userLoans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    const totalPaid = userLoans.reduce((sum, l) => {
      const payments = l.payments || [];
      return sum + payments.reduce((pSum, p) => pSum + parseFloat(p.amount || 0), 0);
    }, 0);
    const totalOutstanding = userLoans.reduce((sum, l) => sum + calculateRemaining(l), 0);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${user.username}</strong></td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.phone || 'N/A'}</td>
      <td>${allLoans.filter(l => l.username === user.username).length}</td>
      <td><strong>₹${totalBorrowed.toLocaleString('en-IN')}</strong></td>
      <td style="color: #10b981; font-weight: 600;">₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
      <td style="color: #ef4444; font-weight: 700;">₹${totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
      <td style="white-space: nowrap;">
        <button class="btn btn-small btn-action" onclick="openUserProfileModal('${user.username}')">
          👤 View Profile
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function handleProfileSearch(e) {
  const searchQuery = e.target.value;
  renderUserProfiles(searchQuery);
}

function openUserProfileModal(username) {
  const user = allUsers.find(u => u.username === username);
  if (!user) return;

  const userLoans = allLoans.filter(l => l.username === username);
  const approvedLoans = userLoans.filter(l => l.status === 'approved');
  
  const totalBorrowed = approvedLoans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const totalPaid = approvedLoans.reduce((sum, l) => {
    const payments = l.payments || [];
    return sum + payments.reduce((pSum, p) => pSum + parseFloat(p.amount || 0), 0);
  }, 0);
  const totalOutstanding = approvedLoans.reduce((sum, l) => sum + calculateRemaining(l), 0);

  // Fill user info
  document.getElementById('profileUsername').textContent = user.username;
  document.getElementById('profileEmail').textContent = user.email || 'N/A';
  document.getElementById('profilePhone').textContent = user.phone || 'N/A';
  document.getElementById('profileJoined').textContent = new Date(user.createdAt).toLocaleDateString('en-IN');

  // Fill stats
  document.getElementById('profileTotalBorrowed').textContent = '₹' + totalBorrowed.toLocaleString('en-IN');
  document.getElementById('profileTotalPaid').textContent = '₹' + totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  document.getElementById('profileOutstanding').textContent = '₹' + totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // Fill loan history table
  const loansTableBody = document.getElementById('profileLoansTableBody');
  if (userLoans.length === 0) {
    loansTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2em; color: #999;">No loans found</td>
      </tr>
    `;
  } else {
    loansTableBody.innerHTML = '';
    userLoans.forEach(loan => {
      const borrowed = parseFloat(loan.amount || 0);
      const paid = loan.status === 'approved' ? (loan.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) : 0;
      const outstanding = loan.status === 'approved' ? calculateRemaining(loan) : 0;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${loan.loanId || loan.id}</strong></td>
        <td>₹${borrowed.toLocaleString('en-IN')}</td>
        <td>${loan.interestRate ? loan.interestRate + '%' : 'N/A'}</td>
        <td>${loan.duration} mo</td>
        <td>₹${borrowed.toLocaleString('en-IN')}</td>
        <td style="color: #10b981; font-weight: 600;">₹${paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
        <td style="color: #ef4444; font-weight: 700;">₹${outstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
        <td>${getStatusBadge(loan.status)}</td>
        <td>${new Date(loan.appliedDate || loan.createdAt).toLocaleDateString('en-IN')}</td>
      `;
      loansTableBody.appendChild(row);
    });
  }

  document.getElementById('userProfileModal').style.display = 'flex';
}

function closeUserProfileModal() {
  document.getElementById('userProfileModal').style.display = 'none';
}
