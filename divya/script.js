// ==================== LOAN ID GENERATION ====================

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', { message, source, lineno, colno, error });
  return false; // Let default error handling continue
};

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

function generateLoanId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `LN-${timestamp}-${random}`;
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-message">${message}</div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ==================== MODAL FUNCTIONS ====================

function openLoanModal(editIndex = -1) {
  console.log('Opening loan modal, editIndex:', editIndex);
  
  try {
    editingIndex = editIndex;
    const modal = document.getElementById('loanModal');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('loanForm');

    if (!modal || !modalTitle || !submitBtn || !form) {
      console.error('Modal elements not found');
      showToast('Error opening form. Please refresh the page.', 'error');
      return;
    }

    if (editIndex !== -1 && loans[editIndex]) {
      const loan = loans[editIndex];
      modalTitle.textContent = 'Edit Loan';
      submitBtn.textContent = 'Update Loan';
      
      document.getElementById('customerName').value = loan.name;
      document.getElementById('loanAmount').value = loan.amount;
      document.getElementById('interestRate').value = loan.interestRate;
      document.getElementById('duration').value = loan.duration;
    } else {
      modalTitle.textContent = 'Add New Loan';
      submitBtn.textContent = 'Add Loan';
      form.reset();
    }

    modal.classList.add('active');
    
    // Focus on first input
    setTimeout(() => {
      const firstInput = document.getElementById('customerName');
      if (firstInput) firstInput.focus();
    }, 100);
    
    console.log('Modal opened successfully');
  } catch (error) {
    console.error('Error opening modal:', error);
    showToast('Error opening form. Please try again.', 'error');
  }
}

function closeLoanModal() {
  try {
    const modal = document.getElementById('loanModal');
    const form = document.getElementById('loanForm');
    
    if (modal) modal.classList.remove('active');
    if (form) form.reset();
    
    editingIndex = -1;
    console.log('Modal closed');
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

// ==================== PAYMENT MODAL FUNCTIONS ====================

function openPaymentModal(loanIndex) {
  paymentLoanIndex = loanIndex;
  const loan = loans[loanIndex];
  const remaining = calculateRemaining(loan);

  document.getElementById('paymentLoanId').textContent = loan.loanId;
  document.getElementById('paymentCustomerName').textContent = loan.name;
  document.getElementById('paymentRemainingBalance').textContent = '₹' + parseFloat(remaining).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('paymentDate').value = today;
  
  // Reset form but keep the date
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentNotes').value = '';
  document.getElementById('paymentMethod').selectedIndex = 0;
  document.getElementById('paymentAmount').focus();

  const modal = document.getElementById('paymentModal');
  modal.classList.add('active');
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('active');
  paymentLoanIndex = -1;
  document.getElementById('paymentForm').reset();
  document.getElementById('paymentWarning').style.display = 'none';
}

function openPaymentHistory(loanIndex) {
  historyLoanIndex = loanIndex;
  const loan = loans[loanIndex];
  const totalPayable = calculateTotalPayable(loan.amount, loan.interestRate, loan.duration);
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalPayable - totalPaid;

  document.getElementById('historyLoanId').textContent = loan.loanId;
  document.getElementById('historyCustomerName').textContent = loan.name;

  const historyBody = document.getElementById('paymentHistoryBody');
  if (loan.payments.length === 0) {
    historyBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5em; color: #999;">No payments yet</td></tr>';
  } else {
    historyBody.innerHTML = loan.payments.map(payment => `
      <tr>
        <td>${new Date(payment.date).toLocaleDateString('en-IN')}</td>
        <td style="text-align: right; font-weight: 600;">₹${parseFloat(payment.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
        <td>${payment.method}</td>
        <td>${payment.notes || '-'}</td>
      </tr>
    `).join('');
  }

  const modal = document.getElementById('paymentHistoryModal');
  modal.classList.add('active');
}

function closePaymentHistory() {
  const modal = document.getElementById('paymentHistoryModal');
  modal.classList.remove('active');
  historyLoanIndex = -1;
}

function openConfirmation(index) {
  deleteIndex = index;
  const modal = document.getElementById('confirmationModal');
  const loanName = loans[index].name;
  document.getElementById('confirmationMessage').textContent = 
    `Are you sure you want to delete the loan record for ${loanName}? This action cannot be undone.`;
  modal.classList.add('active');
}

function closeConfirmation() {
  const modal = document.getElementById('confirmationModal');
  modal.classList.remove('active');
  deleteIndex = -1;
}

// Close modals with click outside
document.addEventListener('click', (e) => {
  const loanModal = document.getElementById('loanModal');
  const confirmationModal = document.getElementById('confirmationModal');
  const paymentModal = document.getElementById('paymentModal');
  const paymentHistoryModal = document.getElementById('paymentHistoryModal');
  
  if (e.target === loanModal) closeLoanModal();
  if (e.target === confirmationModal) closeConfirmation();
  if (e.target === paymentModal) closePaymentModal();
  if (e.target === paymentHistoryModal) closePaymentHistory();
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLoanModal();
    closeConfirmation();
    closePaymentModal();
    closePaymentHistory();
  }
});

// ==================== PAGE NAVIGATION ====================

function showHome() {
  try {
    const homePage = document.getElementById('homePage');
    const loanPage = document.getElementById('loanPage');
    
    if (homePage) homePage.classList.remove('hidden');
    if (loanPage) loanPage.classList.add('hidden');
    if (homeLink) homeLink.classList.add('active');
    if (loanLink) loanLink.classList.remove('active');
    
    console.log('Navigated to Home page');
  } catch (error) {
    console.error('Error navigating to home:', error);
  }
}

function showLoans() {
  try {
    const homePage = document.getElementById('homePage');
    const loanPage = document.getElementById('loanPage');
    
    if (homePage) homePage.classList.add('hidden');
    if (loanPage) loanPage.classList.remove('hidden');
    if (loanLink) loanLink.classList.add('active');
    if (homeLink) homeLink.classList.remove('active');
    
    // Re-render loans when navigating to this page
    renderLoans();
    updateStats();
    
    console.log('Navigated to Loans page');
  } catch (error) {
    console.error('Error navigating to loans:', error);
  }
}

// ==================== LOAN MANAGEMENT LOGIC ====================

// Global variables
let loans = [];
let editingIndex = -1;
let deleteIndex = -1;
let paymentLoanIndex = -1;
let historyLoanIndex = -1;

// DOM Elements
let form, tableBody, searchInput, confirmDeleteBtn, paymentForm, paymentAmountInput;
let homeLink, loanLink, goToLoan, addLoanBtn;

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== INITIALIZING LOAN MANAGEMENT SYSTEM ===');
  
  try {
    // Load data from localStorage
    const savedLoans = localStorage.getItem('loans');
    loans = savedLoans ? JSON.parse(savedLoans) : [];
    console.log('Loaded loans from storage:', loans.length);
    
    // Initialize all DOM elements
    initializeDOMElements();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Initial render
    renderLoans();
    updateStats();
    updateDashboard();
    
    console.log('=== INITIALIZATION COMPLETE ===');
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Error initializing application. Please refresh the page.', 'error');
  }
});

function initializeDOMElements() {
  console.log('Initializing DOM elements...');
  
  // Form elements
  form = document.getElementById('loanForm');
  tableBody = document.getElementById('loanTableBody');
  searchInput = document.getElementById('searchInput');
  confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  paymentForm = document.getElementById('paymentForm');
  paymentAmountInput = document.getElementById('paymentAmount');
  
  // Navigation elements
  homeLink = document.getElementById('homeLink');
  loanLink = document.getElementById('loanLink');
  goToLoan = document.getElementById('goToLoan');
  addLoanBtn = document.getElementById('addLoanBtn');
  
  // Verify critical elements exist
  const criticalElements = {
    form, tableBody, homeLink, loanLink, addLoanBtn
  };
  
  for (const [name, element] of Object.entries(criticalElements)) {
    if (!element) {
      console.error(`Critical element missing: ${name}`);
      throw new Error(`Critical element missing: ${name}`);
    }
  }
  
  console.log('All DOM elements initialized successfully');
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  try {
    // Navigation listeners
    if (homeLink) {
      homeLink.addEventListener('click', function(e) {
        e.preventDefault();
        showHome();
      });
    }
    
    if (loanLink) {
      loanLink.addEventListener('click', function(e) {
        e.preventDefault();
        showLoans();
      });
    }
    
    if (goToLoan) {
      goToLoan.addEventListener('click', function(e) {
        e.preventDefault();
        showLoans();
      });
    }
    
    if (addLoanBtn) {
      addLoanBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openLoanModal();
      });
    }
    
    // Form listeners
    if (searchInput) {
      searchInput.addEventListener('input', filterLoans);
    }
    
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
    
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (paymentForm) {
      paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    if (paymentAmountInput) {
      paymentAmountInput.addEventListener('input', validatePaymentAmount);
    }
    
    console.log('Event listeners setup complete');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

function saveLoans() {
  try {
    localStorage.setItem('loans', JSON.stringify(loans));
    console.log('Loans saved successfully. Total:', loans.length);
    return true;
  } catch (error) {
    console.error('Error saving loans:', error);
    showToast('Error saving data. Please try again.', 'error');
    return false;
  }
}

// ==================== CALCULATION FUNCTIONS ====================

function calculateEMI(principal, annualRate, months) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return (principal / months).toFixed(2);
  }
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  return emi.toFixed(2);
}

function calculateTotalInterest(principal, annualRate, months) {
  const emi = calculateEMI(principal, annualRate, months);
  const totalPayable = emi * months;
  const interest = totalPayable - principal;
  return interest.toFixed(2);
}

function calculateTotalPayable(principal, annualRate, months) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal.toFixed(2);
  }
  const totalPayable = calculateEMI(principal, annualRate, months) * months;
  return totalPayable.toFixed(2);
}

function calculateTotalPaid(loanIndex) {
  return loans[loanIndex].payments.reduce((sum, p) => sum + p.amount, 0);
}

function calculateRemaining(loan) {
  const totalPayable = parseFloat(calculateTotalPayable(loan.amount, loan.interestRate, loan.duration));
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  return (totalPayable - totalPaid).toFixed(2);
}

function getStatus(loan) {
  const remaining = parseFloat(calculateRemaining(loan));
  if (remaining <= 0) {
    return '<span class="status-badge status-paid">✓ Paid</span>';
  } else if (remaining < parseFloat(calculateEMI(loan.amount, loan.interestRate, loan.duration)) * 2) {
    return '<span class="status-badge status-completed">Completing</span>';
  } else {
    return '<span class="status-badge status-active">Active</span>';
  }
}

// ==================== RENDER & FILTER ====================

function renderLoans() {
  console.log('=== RENDERING LOANS ===');
  console.log('Total loans to render:', loans.length);
  
  if (!tableBody) {
    console.error('ERROR: tableBody element not found!');
    showToast('Error: Table not found. Please refresh the page.', 'error');
    return;
  }
  
  try {
    tableBody.innerHTML = '';
    
    if (loans.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 3em; color: #999;">
            <p style="font-size: 1.1em; margin-bottom: 0.5em;">No loans found yet</p>
            <p style="font-size: 0.95em;">Click "Add New Loan" to get started</p>
          </td>
        </tr>
      `;
      console.log('No loans to display');
      return;
    }

    console.log('Rendering', loans.length, 'loan records...');
    
    loans.forEach((loan, index) => {
      try {
        const emi = calculateEMI(loan.amount, loan.interestRate, loan.duration);
        const totalPayable = calculateTotalPayable(loan.amount, loan.interestRate, loan.duration);
        const totalPaid = calculateTotalPaid(index);
        const remaining = calculateRemaining(loan);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${loan.loanId}</strong></td>
          <td>${loan.name}</td>
          <td><strong>₹${parseFloat(loan.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong></td>
          <td>${parseFloat(loan.interestRate).toFixed(2)}%</td>
          <td>₹${parseFloat(emi).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
          <td>₹${parseFloat(totalPayable).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
          <td style="color: #10b981; font-weight: 600;">₹${parseFloat(totalPaid).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
          <td style="color: #ef4444; font-weight: 700; font-size: 1.05em;">₹${parseFloat(remaining).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
          <td>${getStatus(loan)}</td>
          <td style="white-space: nowrap;">
            <button class="btn btn-small btn-action" onclick="openPaymentModal(${index})" title="Make Payment">💳 Pay</button>
            <button class="btn btn-small btn-action" onclick="openPaymentHistory(${index})" title="View History">📋 History</button>
            <button class="btn btn-small btn-action" onclick="editLoan(${index})" title="Edit Loan">✎ Edit</button>
            <button class="btn btn-small btn-action" onclick="deleteLoan(${index})" title="Delete Loan">✕ Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      } catch (error) {
        console.error('Error rendering loan at index', index, ':', error);
      }
    });
    
    console.log('Loans rendered successfully');
  } catch (error) {
    console.error('Error in renderLoans:', error);
    showToast('Error displaying loans. Please refresh the page.', 'error');
  }
}

function filterLoans() {
  const searchTerm = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll('#loanTableBody tr');
  
  rows.forEach(row => {
    if (row.cells.length > 1) {
      const loanId = row.cells[0].textContent.toLowerCase();
      const customerName = row.cells[1].textContent.toLowerCase();
      const matches = loanId.includes(searchTerm) || customerName.includes(searchTerm);
      row.style.display = matches ? '' : 'none';
    }
  });
}

// ==================== PAYMENT FUNCTIONS ====================

function validatePaymentAmount() {
  const amount = parseFloat(paymentAmountInput.value);
  const loan = loans[paymentLoanIndex];
  const remaining = parseFloat(calculateRemaining(loan));
  const warning = document.getElementById('paymentWarning');

  if (amount > remaining) {
    warning.textContent = `⚠️ Amount exceeds remaining balance (₹${remaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
    warning.style.display = 'block';
  } else if (amount > 0) {
    warning.style.display = 'none';
  }
}

function handlePaymentSubmit(e) {
  e.preventDefault();

  const amount = parseFloat(paymentAmountInput.value);
  const loan = loans[paymentLoanIndex];
  const remaining = parseFloat(calculateRemaining(loan));

  if (amount > remaining) {
    showToast('Payment amount cannot exceed remaining balance!', 'error');
    return;
  }

  if (amount <= 0) {
    showToast('Please enter a valid payment amount!', 'error');
    return;
  }

  const payment = {
    amount: amount,
    date: document.getElementById('paymentDate').value,
    method: document.getElementById('paymentMethod').value,
    notes: document.getElementById('paymentNotes').value,
    timestamp: new Date().toISOString()
  };

  loan.payments.push(payment);
  saveLoans();
  renderLoans();
  updateStats();
  updateDashboard();
  
  showToast(`Payment of ₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} processed successfully!`, 'success');
  closePaymentModal();
}

// ==================== LOAN MANAGEMENT ====================

window.deleteLoan = function(index) {
  openConfirmation(index);
};

function confirmDelete() {
  if (deleteIndex !== -1) {
    const loanName = loans[deleteIndex].name;
    const loanId = loans[deleteIndex].loanId;
    loans.splice(deleteIndex, 1);
    saveLoans();
    renderLoans();
    updateStats();
    updateDashboard();
    showToast(`Loan ${loanId} for ${loanName} deleted successfully!`, 'success');
    closeConfirmation();
  }
}

window.editLoan = function(index) {
  openLoanModal(index);
};

function handleFormSubmit(e) {
  e.preventDefault();
  console.log('=== FORM SUBMISSION STARTED ===');
  
  try {
    // Get form values with validation
    const nameInput = document.getElementById('customerName');
    const amountInput = document.getElementById('loanAmount');
    const rateInput = document.getElementById('interestRate');
    const durationInput = document.getElementById('duration');
    
    if (!nameInput || !amountInput || !rateInput || !durationInput) {
      console.error('Form inputs not found');
      showToast('Error: Form fields not found. Please refresh the page.', 'error');
      return;
    }
    
    const loan = {
      name: nameInput.value.trim(),
      amount: parseFloat(amountInput.value),
      interestRate: parseFloat(rateInput.value),
      duration: parseInt(durationInput.value)
    };

    console.log('Form data:', loan);

    // Validate data
    if (!loan.name || loan.name.length === 0) {
      showToast('Please enter customer name!', 'error');
      nameInput.focus();
      return;
    }
    
    if (isNaN(loan.amount) || loan.amount <= 0) {
      showToast('Please enter a valid loan amount!', 'error');
      amountInput.focus();
      return;
    }
    
    if (isNaN(loan.interestRate) || loan.interestRate < 0) {
      showToast('Please enter a valid interest rate!', 'error');
      rateInput.focus();
      return;
    }
    
    if (isNaN(loan.duration) || loan.duration <= 0) {
      showToast('Please enter a valid duration!', 'error');
      durationInput.focus();
      return;
    }

    // Process loan
    if (editingIndex !== -1) {
      // Update existing loan
      console.log('Updating loan at index:', editingIndex);
      const oldName = loans[editingIndex].name;
      loans[editingIndex].name = loan.name;
      loans[editingIndex].amount = loan.amount;
      loans[editingIndex].interestRate = loan.interestRate;
      loans[editingIndex].duration = loan.duration;
      showToast(`Loan for ${oldName} updated successfully!`, 'success');
      editingIndex = -1;
    } else {
      // Add new loan
      const newLoan = {
        ...loan,
        loanId: generateLoanId(),
        payments: [],
        createdDate: new Date().toISOString()
      };
      loans.push(newLoan);
      console.log('New loan created:', newLoan);
      console.log('Total loans now:', loans.length);
      showToast(`Loan ${newLoan.loanId} for ${loan.name} created successfully!`, 'success');
    }

    // Save and update UI
    if (saveLoans()) {
      closeLoanModal();
      showLoans(); // Navigate to loans page
      renderLoans();
      updateStats();
      updateDashboard();
      console.log('=== FORM SUBMISSION COMPLETE ===');
    }
  } catch (error) {
    console.error('Error in form submission:', error);
    showToast('Error processing loan. Please try again.', 'error');
  }
}

// ==================== STATISTICS ====================

function updateStats() {
  if (loans.length === 0) {
    document.getElementById('totalLoans').textContent = '0';
    document.getElementById('totalAmount').textContent = '₹0';
    document.getElementById('totalPayable').textContent = '₹0';
    return;
  }

  const totalLoans = loans.length;
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  
  // Calculate total payable and total paid
  let totalPayableAmount = 0;
  let totalPaid = 0;
  
  loans.forEach(loan => {
    const payable = parseFloat(calculateTotalPayable(loan.amount, loan.interestRate, loan.duration));
    totalPayableAmount += payable;
    totalPaid += loan.payments.reduce((sum, p) => sum + p.amount, 0);
  });
  
  // Calculate outstanding amount (Total Payable - Total Paid)
  const outstandingAmount = totalPayableAmount - totalPaid;

  document.getElementById('totalLoans').textContent = totalLoans;
  document.getElementById('totalAmount').textContent = '₹' + totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  document.getElementById('totalPayable').textContent = '₹' + outstandingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ==================== DASHBOARD & CHARTS ====================

let chartInstances = {
  loanDistribution: null,
  paymentStatus: null,
  amountBreakdown: null,
  paymentTrend: null
};

function updateDashboard() {
  updateDashboardStats();
  updateCharts();
}

function updateDashboardStats() {
  if (loans.length === 0) {
    document.getElementById('dashboardTotalCustomers').textContent = '0';
    document.getElementById('dashboardCollectionRate').textContent = '0%';
    document.getElementById('dashboardTotalLoaned').textContent = '₹0';
    document.getElementById('dashboardOutstanding').textContent = '₹0';
    return;
  }

  const totalCustomers = loans.length;
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  
  let totalPaid = 0;
  let totalPayableAmount = 0;
  
  loans.forEach(loan => {
    const payable = parseFloat(calculateTotalPayable(loan.amount, loan.interestRate, loan.duration));
    totalPayableAmount += payable;
    totalPaid += loan.payments.reduce((sum, p) => sum + p.amount, 0);
  });

  const outstanding = totalPayableAmount - totalPaid;
  const collectionRate = totalPayableAmount > 0 ? ((totalPaid / totalPayableAmount) * 100).toFixed(1) : 0;

  document.getElementById('dashboardTotalCustomers').textContent = totalCustomers;
  document.getElementById('dashboardCollectionRate').textContent = collectionRate + '%';
  document.getElementById('dashboardTotalLoaned').textContent = '₹' + totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  document.getElementById('dashboardOutstanding').textContent = '₹' + outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function updateCharts() {
  if (loans.length === 0) {
    console.log('No loans to display in charts');
    return;
  }
  
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded! Charts will not display.');
    showToast('Charts cannot be displayed. Please refresh the page.', 'error');
    return;
  }

  try {
    console.log('Updating all charts with', loans.length, 'loans...');
    updateLoanDistributionChart();
    updatePaymentStatusChart();
    updateAmountBreakdownChart();
    updatePaymentTrendChart();
    console.log('Charts updated successfully');
  } catch (error) {
    console.error('Error updating charts:', error);
    showToast('Error displaying charts. Please refresh the page.', 'error');
  }
}

function updateLoanDistributionChart() {
  try {
    const ctx = document.getElementById('loanDistributionChart');
    if (!ctx) {
      console.warn('Loan Distribution Chart canvas not found');
      return;
    }

    const labels = loans.map(loan => loan.name);
    const data = loans.map(loan => loan.amount);
    const colors = generateColors(loans.length);

    if (chartInstances.loanDistribution) {
      chartInstances.loanDistribution.destroy();
    }

    chartInstances.loanDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
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
    console.log('Loan Distribution Chart updated');
  } catch (error) {
    console.error('Error updating Loan Distribution Chart:', error);
  }
}

function updatePaymentStatusChart() {
  try {
    const ctx = document.getElementById('paymentStatusChart');
    if (!ctx) {
      console.warn('Payment Status Chart canvas not found');
      return;
    }

    let paidCount = 0;
    let pendingCount = 0;
    let completingCount = 0;

    loans.forEach(loan => {
      const remaining = parseFloat(calculateRemaining(loan));
      const emi = parseFloat(calculateEMI(loan.amount, loan.interestRate, loan.duration));
      
      if (remaining <= 0) {
        paidCount++;
      } else if (remaining < emi * 2) {
        completingCount++;
      } else {
        pendingCount++;
      }
    });

    if (chartInstances.paymentStatus) {
      chartInstances.paymentStatus.destroy();
    }

    chartInstances.paymentStatus = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Paid', 'Completing', 'Pending'],
        datasets: [{
          data: [paidCount, completingCount, pendingCount],
          backgroundColor: ['#a5d6a7', '#fff9c4', '#ffccbc'],
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
    console.log('Payment Status Chart updated');
  } catch (error) {
    console.error('Error updating Payment Status Chart:', error);
  }
}

function updateAmountBreakdownChart() {
  try {
    const ctx = document.getElementById('amountBreakdownChart');
    if (!ctx) {
      console.warn('Amount Breakdown Chart canvas not found');
      return;
    }

    // Get customer names and their total amounts (principal + interest payable)
    const customerAmounts = loans.map(loan => ({
      name: loan.name,
      totalPayable: parseFloat(calculateTotalPayable(loan.amount, loan.interestRate, loan.duration))
    })).sort((a, b) => b.totalPayable - a.totalPayable);

    const labels = customerAmounts.map(c => c.name);
    const data = customerAmounts.map(c => c.totalPayable);
    const colors = generateColors(data.length);

    if (chartInstances.amountBreakdown) {
      chartInstances.amountBreakdown.destroy();
    }

    chartInstances.amountBreakdown = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Payable (₹)',
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
    console.log('Amount Breakdown Chart updated');
  } catch (error) {
    console.error('Error updating Amount Breakdown Chart:', error);
  }
}

function updatePaymentTrendChart() {
  try {
    const ctx = document.getElementById('paymentTrendChart');
    if (!ctx) {
      console.warn('Payment Trend Chart canvas not found');
      return;
    }

    // Collect all payments with dates
    const allPayments = [];
    loans.forEach(loan => {
      loan.payments.forEach(payment => {
        allPayments.push({
          date: new Date(payment.date),
          amount: payment.amount
        });
      });
    });

    // Sort by date
    allPayments.sort((a, b) => a.date - b.date);

    // Group by month
    const monthlyData = {};
    allPayments.forEach(payment => {
      const monthKey = payment.date.toLocaleString('en-IN', { year: 'numeric', month: 'short' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
    });

    const labels = Object.keys(monthlyData);
    const data = Object.values(monthlyData);

    if (chartInstances.paymentTrend) {
      chartInstances.paymentTrend.destroy();
    }

    chartInstances.paymentTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
          label: 'Monthly Payments (₹)',
          data: data.length > 0 ? data : [0],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3498db',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    console.log('Payment Trend Chart updated');
  } catch (error) {
    console.error('Error updating Payment Trend Chart:', error);
  }
}

function generateColors(count) {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
    '#95a5a6', '#d35400'
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}
