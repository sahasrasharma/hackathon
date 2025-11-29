import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Redirect to Divya Project login page
    window.location.href = '/divya/login.html'
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>💰 Loan Management System</h2>
        <p>Redirecting to login...</p>
      </div>
    </div>
  )
}

export default App
