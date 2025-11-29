# React Loan Management System - Complete Setup Guide

## ✅ Already Completed
- React project initialized at: `C:\Users\DELL\OneDrive\Desktop\loan-management-react`
- Folder structure created (components, pages, services, contexts, styles)
- Dependencies installed: react-router-dom, chart.js, react-chartjs-2
- API service created (`src/services/api.js`)
- Auth context created (`src/contexts/AuthContext.jsx`)
- Dev server running on: http://localhost:5173

## 📝 Files to Create

Copy the following code into each file:

---

### 1. `src/components/Toast.jsx`

```jsx
import React, { useEffect } from 'react';
import '../styles/toast.css';

const Toast = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`toast ${type} show`}>
      {message}
    </div>
  );
};

export default Toast;
```

---

### 2. `src/components/ProtectedRoute.jsx`

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredType }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredType && user.userType !== requiredType) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

### 3. `src/main.jsx` (Replace existing)

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

### 4. `src/App.jsx` (Replace existing)

```jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          user?.userType === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/user" />
        ) : (
          <Login />
        )
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requiredType="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/user" element={
        <ProtectedRoute requiredType="user">
          <UserDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
```

---

### 5. `src/styles/toast.css`

```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1em 1.5em;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  opacity: 0;
  transform: translateX(400px);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast.show {
  opacity: 1;
  transform: translateX(0);
}

.toast.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.toast.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.toast.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
```

---

## 🎯 Next Steps

1. Create these files in the React project
2. Copy the Login, AdminDashboard, and UserDashboard page components (I'll provide in next message)
3. Copy all CSS styles
4. Test the application

The application will maintain exact same functionality and visuals as the original!
