// Authentication and API Configuration
const API_URL = 'https://sheetdb.io/api/v1/ipiwtojb2g89s';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'divya123'
};

// Toast notification function
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Toggle between login and register forms
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const registerLink = document.getElementById('registerLink');
  const loginLink = document.getElementById('loginLink');

  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Handle login
  loginForm.addEventListener('submit', handleLogin);

  // Handle registration
  registerForm.addEventListener('submit', handleRegister);
});

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showToast('Please enter username and password', 'error');
    return;
  }

  // Check if admin login (automatic detection) - case insensitive
  if (username.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
    // Admin login successful
    sessionStorage.setItem('userType', 'admin');
    sessionStorage.setItem('username', ADMIN_CREDENTIALS.username);
    showToast('Admin login successful!', 'success');
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1000);
    return;
  }

  // User login - check against API
  try {
    showToast('Logging in...', 'success');
    
    // Fetch all users and filter
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status);
      showToast('Unable to connect to server. Please try again.', 'error');
      return;
    }
    
    let allData = await response.json();
    console.log('Raw API response:', allData);
    console.log('Response type:', typeof allData);
    console.log('Is array?:', Array.isArray(allData));
    
    // Handle if API returns empty or not an array
    if (!allData || !Array.isArray(allData)) {
      console.log('API returned invalid data structure');
      showToast('No users registered yet. Please register first.', 'error');
      return;
    }
    
    // Handle empty array
    if (allData.length === 0) {
      console.log('API returned empty array - no data yet');
      showToast('No users registered. Please register first.', 'error');
      return;
    }
    
    // Case-insensitive username comparison
    const users = allData.filter(item => item.type === 'user' && item.username.toLowerCase() === username.toLowerCase());
    console.log('Filtered users:', users);
    console.log('Total records:', allData.length);
    console.log('User records:', allData.filter(item => item.type === 'user').length);
    console.log('Looking for username:', username);
    console.log('All usernames in DB:', allData.filter(item => item.type === 'user').map(u => `"${u.username}"`));

    if (users && users.length > 0) {
      const user = users[0];
      console.log('Found user:', user);
      console.log('User password from DB:', `"${user.password}"`);
      console.log('Entered password:', `"${password}"`);
      console.log('DB password length:', user.password ? user.password.length : 0);
      console.log('Entered password length:', password.length);
      console.log('Passwords match?:', user.password === password);
      console.log('Password trimmed match?:', String(user.password).trim() === String(password).trim());
      
      // Check password (trim both to handle whitespace)
      if (String(user.password).trim() === String(password).trim()) {
        // Login successful - store the original username from database
        sessionStorage.setItem('userType', 'user');
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('userId', user.id || user.username);
        sessionStorage.setItem('userEmail', user.email || '');
        
        showToast('Login successful!', 'success');
        setTimeout(() => {
          window.location.href = 'user.html';
        }, 1000);
      } else {
        console.error('Password mismatch!');
        showToast('Invalid password', 'error');
      }
    } else {
      console.log('No users found matching username:', username);
      showToast('User not found. Please register first.', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed: ' + error.message, 'error');
  }
}

// Handle Registration
async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;

  // Validation
  if (!username || !email || !phone || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  // Check if username already exists
  try {
    showToast('Creating account...', 'success');
    
    // Fetch all users and check for duplicates (case-insensitive)
    const checkResponse = await fetch(API_URL);
    const allData = await checkResponse.json();
    const existingUsers = allData.filter(item => item.type === 'user' && item.username.toLowerCase() === username.toLowerCase());

    if (existingUsers && existingUsers.length > 0) {
      showToast('Username already exists', 'error');
      return;
    }

    // Create new user
    const newUser = {
      id: 'USER' + Date.now().toString(),
      username: username,
      email: email,
      phone: phone,
      password: password,
      createdAt: new Date().toISOString(),
      type: 'user'
    };

    console.log('Creating new user:', newUser);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: [newUser] })
    });

    console.log('Registration response status:', response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('Registration response data:', responseData);
      showToast('Registration successful! Please login.', 'success');
      
      // Clear form
      document.getElementById('registerForm').reset();
      
      // Switch to login form
      setTimeout(() => {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
      }, 1500);
    } else {
      const errorData = await response.text();
      console.error('Registration failed:', errorData);
      showToast('Registration failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Registration failed: ' + error.message, 'error');
  }
}