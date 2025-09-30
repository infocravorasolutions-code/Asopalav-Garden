# SuperAdmin Testing Guide

## Test SuperAdmins Created

### 1. System SuperAdmin (Production)
- **Email:** `superadmin@system.com`
- **Password:** `SuperAdmin@123`
- **Purpose:** Main production SuperAdmin account
- **Access:** `http://localhost:3000/superadmin/login`

### 2. Test SuperAdmin (Testing)
- **Email:** `test@superadmin.com`
- **Password:** `TestAdmin@123`
- **Purpose:** Testing and development
- **Access:** `http://localhost:3000/superadmin/login`

## Testing Scenarios

### 1. Authentication Testing

#### Login Testing
```bash
# Test valid login
Email: test@superadmin.com
Password: TestAdmin@123

# Test invalid login
Email: test@superadmin.com
Password: wrongpassword

# Test non-existent user
Email: nonexistent@test.com
Password: anypassword
```

#### Expected Results:
- ✅ Valid credentials should redirect to dashboard
- ❌ Invalid credentials should show error message
- ❌ Non-existent user should show error message

### 2. Dashboard Testing

#### Company Management
1. **View Companies**
   - Should display all companies in a table
   - Should show user statistics for each company
   - Should display company creation dates

2. **Create Company**
   - Click "Create Company" button
   - Fill in required fields (name, code, email)
   - Submit form
   - Verify company appears in table

3. **Edit Company**
   - Click "Edit" button on any company
   - Modify company details
   - Submit changes
   - Verify changes are reflected

4. **Delete Company**
   - Click "Delete" button on a company
   - Confirm deletion
   - Verify company is removed from table

### 3. Security Testing

#### Authentication
- Test JWT token expiration
- Test unauthorized access to protected routes
- Test logout functionality

#### Authorization
- Verify SuperAdmin can access all company data
- Test permission-based operations
- Verify proper error handling

### 4. API Testing

#### Authentication Endpoints
```bash
# Login
POST /api/superadmin/login
{
  "email": "test@superadmin.com",
  "password": "TestAdmin@123"
}

# Forgot Password
POST /api/superadmin/forgot-password
{
  "email": "test@superadmin.com"
}

# Reset Password
POST /api/superadmin/reset-password
{
  "token": "reset_token",
  "newPassword": "NewPassword@123"
}
```

#### Company Management Endpoints
```bash
# Get All Companies
GET /api/superadmin/companies
Authorization: Bearer <token>

# Create Company
POST /api/superadmin/companies
Authorization: Bearer <token>
{
  "name": "Test Company",
  "code": "TEST001",
  "email": "test@company.com"
}

# Update Company
PUT /api/superadmin/companies/:companyId
Authorization: Bearer <token>
{
  "name": "Updated Company Name"
}

# Delete Company
DELETE /api/superadmin/companies/:companyId
Authorization: Bearer <token>
```

## Management Commands

### List All SuperAdmins
```bash
node scripts/manageSuperAdmins.js list
```

### Create New SuperAdmin
```bash
node scripts/manageSuperAdmins.js create "John Doe" "john@test.com" "password123" "9876543210"
```

### Delete SuperAdmin
```bash
node scripts/manageSuperAdmins.js delete "john@test.com"
```

### Reset Password
```bash
node scripts/manageSuperAdmins.js reset-password "john@test.com" "newpassword123"
```

### Show Help
```bash
node scripts/manageSuperAdmins.js help
```

## Test Data Setup

### Create Test Companies
1. Login as SuperAdmin
2. Create multiple test companies with different:
   - Company names and codes
   - Industries and descriptions
   - Color themes and branding
   - Settings and configurations

### Create Test Users
1. For each test company, create:
   - Admin users
   - Manager users
   - Employee users
2. This will provide realistic data for testing user statistics

## Testing Checklist

### ✅ Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Token expiration handling
- [ ] Password reset flow

### ✅ Company Management
- [ ] View all companies
- [ ] Create new company
- [ ] Edit existing company
- [ ] Delete company (with and without users)
- [ ] View company details
- [ ] User statistics display

### ✅ UI/UX Testing
- [ ] Responsive design on mobile
- [ ] Loading states and error handling
- [ ] Form validation
- [ ] Navigation between pages
- [ ] Modal functionality

### ✅ Security Testing
- [ ] Unauthorized access prevention
- [ ] Token-based authentication
- [ ] Input validation and sanitization
- [ ] Error message security

### ✅ Performance Testing
- [ ] Dashboard loading speed
- [ ] Large dataset handling
- [ ] API response times
- [ ] Memory usage

## Common Test Cases

### 1. Company Creation Flow
```
1. Login as SuperAdmin
2. Click "Create Company"
3. Fill form with:
   - Name: "Test Company"
   - Code: "TEST001"
   - Email: "test@company.com"
   - Industry: "Technology"
4. Submit form
5. Verify company appears in table
6. Verify company details are correct
```

### 2. Company Deletion Flow
```
1. Select a company with no users
2. Click "Delete" button
3. Confirm deletion
4. Verify company is removed
5. Test deletion of company with users (should show error)
```

### 3. User Statistics Testing
```
1. Create companies with different user counts
2. Verify statistics are accurate
3. Test real-time updates
4. Verify user count displays
```

## Troubleshooting

### Common Issues
1. **Login Issues**
   - Check credentials
   - Verify database connection
   - Check JWT token validity

2. **Company Management Issues**
   - Verify SuperAdmin permissions
   - Check company data integrity
   - Verify user count calculations

3. **UI Issues**
   - Check browser console for errors
   - Verify API responses
   - Test on different browsers

### Debug Commands
```bash
# Check SuperAdmin status
node scripts/manageSuperAdmins.js list

# Create additional test SuperAdmin
node scripts/manageSuperAdmins.js create "Debug Admin" "debug@test.com" "debug123" "9999999999"

# Reset test SuperAdmin password
node scripts/manageSuperAdmins.js reset-password "test@superadmin.com" "NewTestPassword@123"
```

## Test Results Documentation

### Test Execution Log
- [ ] Authentication tests passed
- [ ] Company management tests passed
- [ ] Security tests passed
- [ ] UI/UX tests passed
- [ ] Performance tests passed

### Issues Found
- [ ] Issue 1: Description and resolution
- [ ] Issue 2: Description and resolution
- [ ] Issue 3: Description and resolution

### Recommendations
- [ ] Performance optimization needed
- [ ] Additional security measures
- [ ] UI improvements required
- [ ] Feature enhancements

## Conclusion

This testing guide provides comprehensive coverage of the SuperAdmin system functionality. Use the test SuperAdmin credentials to perform thorough testing of all features and ensure the system works correctly before production deployment.
