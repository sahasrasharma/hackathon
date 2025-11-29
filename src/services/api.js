// API Service for SheetDB
const API_URL = 'https://sheetdb.io/api/v1/ipiwtojb2g89s';

// Admin credentials
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'divya123'
};

// Fetch all data
export const fetchAllData = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Fetch filtered data
export const fetchFilteredData = async (filters) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(${API_URL}/search?);
    if (!response.ok) {
      throw new Error('Failed to fetch filtered data');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    throw error;
  }
};

// Create new record
export const createRecord = async (data) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [data] })
    });
    if (!response.ok) {
      throw new Error('Failed to create record');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
};

// Update record
export const updateRecord = async (id, data) => {
  try {
    const response = await fetch(${API_URL}/id/, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data })
    });
    if (!response.ok) {
      throw new Error('Failed to update record');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
};

// Delete record
export const deleteRecord = async (id) => {
  try {
    const response = await fetch(${API_URL}/id/, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete record');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
};

// User authentication
export const authenticateUser = async (username, password) => {
  try {
    // Check admin credentials first
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      return {
        success: true,
        userType: 'admin',
        user: { username, userType: 'admin' }
      };
    }

    // Check user credentials
    const allData = await fetchAllData();
    const users = allData.filter(item => item.type === 'user' && item.username === username);

    if (users && users.length > 0) {
      const user = users[0];
      if (String(user.password).trim() === String(password).trim()) {
        return {
          success: true,
          userType: 'user',
          user: {
            username: user.username,
            userId: user.id || username,
            userEmail: user.email || '',
            userType: 'user'
          }
        };
      } else {
        return { success: false, message: 'Invalid password' };
      }
    } else {
      return { success: false, message: 'User not found. Please register first.' };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Login failed: ' + error.message };
  }
};

// Register new user
export const registerUser = async (userData) => {
  try {
    // Check for existing username
    const allData = await fetchAllData();
    const existingUsers = allData.filter(
      item => item.type === 'user' && item.username === userData.username
    );

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, message: 'Username already exists' };
    }

    // Create new user
    const newUser = {
      id: 'USER' + Date.now().toString(),
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      createdAt: new Date().toISOString(),
      type: 'user'
    };

    await createRecord(newUser);
    return { success: true, message: 'Registration successful!' };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed: ' + error.message };
  }
};
