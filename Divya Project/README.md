# Loan Management System with API Integration

## 🎯 Overview
A complete loan management system with user authentication, loan application workflow, admin approval system, and API integration with SheetDB.

## 🚀 Features

### For Users:
- **Register & Login** - Create account and login securely
- **Apply for Loans** - Submit loan applications with details
- **Track Application Status** - View pending, approved, or rejected applications
- **Make Payments** - Pay EMI after loan approval
- **View Dashboard** - See statistics and loan history

### For Admin:
- **Review Applications** - Approve or reject loan requests
- **Set Interest Rates** - Define interest rate when approving loans
- **Manage All Loans** - View and monitor all loans
- **View Payment History** - Track payments for each loan
- **Dashboard Analytics** - Visual charts and statistics

## 🔐 Login Credentials

### Admin Login:
- **Username**: `admin`
- **Password**: `divya123`
- **Login As**: Admin

### User Login:
- Register a new account first
- Or use any registered user credentials
- **Login As**: User

## 📋 Loan Workflow

1. **User applies for loan** → Status: `Pending Review`
2. **Admin reviews application** → Admin can approve or reject
3. **If approved** → Admin sets interest rate → Status: `Approved`
4. **User can now make payments** → Only after approval
5. **Payments reduce outstanding balance**

## 🗂️ File Structure

```
├── login.html          - Login & Registration page
├── login.css           - Login page styles
├── auth.js             - Authentication logic
├── user.html           - User dashboard
├── user.js             - User dashboard logic
├── admin.html          - Admin dashboard
├── admin.js            - Admin dashboard logic
├── styles.css          - Shared styles
└── README.md           - This file
```

## 🌐 API Integration

**API Endpoint**: `https://sheetdb.io/api/v1/du2qay0yiexz4`

### Data Structure:

**User Data**:
```json
{
  "id": "unique_id",
  "username": "user123",
  "email": "user@example.com",
  "phone": "1234567890",
  "password": "hashed_password",
  "type": "user",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Loan Data**:
```json
{
  "id": "LOAN1234567890",
  "loanId": "LOAN1234567890",
  "username": "user123",
  "type": "loan",
  "amount": 50000,
  "purpose": "Business",
  "duration": 12,
  "monthlyIncome": 50000,
  "employmentType": "Salaried",
  "status": "pending|approved|rejected",
  "interestRate": 12.5,
  "appliedDate": "2025-01-01T00:00:00Z",
  "approvedDate": "2025-01-02T00:00:00Z",
  "reviewedBy": "admin",
  "adminNotes": "Approved based on income",
  "payments": "[{\"amount\":4166.67,\"date\":\"2025-02-01\",\"method\":\"UPI\",\"note\":\"EMI payment\"}]"
}
```

## 🎨 Features Breakdown

### User Dashboard:
- **Statistics Cards**: Total applications, approved loans, borrowed amount, outstanding
- **Loan Tabs**: Filter by all, pending, approved, rejected
- **Apply Modal**: Form to submit new loan application
- **Payment Modal**: Make EMI or partial payments on approved loans

### Admin Dashboard:
- **Dashboard View**: Stats, charts, recent applications
- **Pending Applications**: Review and approve/reject
- **All Loans**: Search, view payment history
- **Review Modal**: Set interest rate and add notes

## 🔧 How to Run

1. **Start a local server**:
   ```bash
   python -m http.server 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000/login.html
   ```

3. **First Time Setup**:
   - Register a new user account
   - Or login as admin directly
   - Apply for loans as user
   - Approve loans as admin
   - Make payments as user

## 💡 Key Points

- **Real API Integration**: All data is stored in SheetDB
- **Authentication**: Session-based authentication
- **Workflow**: Users can only pay after admin approval
- **Interest Calculation**: EMI calculated using standard formula
- **Payment Tracking**: All payments are tracked and reduce outstanding
- **Responsive Design**: Works on all devices

## 🎯 Business Logic

### EMI Calculation:
```javascript
EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
```
Where:
- P = Principal amount
- r = Monthly interest rate (annual rate / 12 / 100)
- n = Loan duration in months

### Outstanding Calculation:
```javascript
Outstanding = Total Payable - Total Paid
Total Payable = EMI × Duration
```

## 🔒 Security Notes

- Passwords stored in plain text (for demo purposes)
- In production, use proper password hashing
- Implement JWT tokens for better security
- Add server-side validation

## 📞 Support

For any issues or questions, please contact the development team.

---

**© 2025 Loan Management System - All Rights Reserved**
