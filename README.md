# Backend Project - User & Admin Panel

## Features Implemented

### User Panel
- ✅ Email & Password Signup/Login
- ✅ Google OAuth Authentication
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Duplicate account prevention
- ✅ Server-side validation
- ✅ Profile Management (Update Name, Phone, Bio)
- ✅ Profile Picture Upload
- ✅ Change Password functionality
- ✅ Forgot/Reset Password via Email

### Admin Panel
- ✅ Role-Based Access Control (Admin only)
- ✅ View users with pagination
- ✅ Search & filter users
- ✅ Create, edit, delete users
- ✅ Block/Unblock users
- ✅ Impersonate users with activity logging

### Database Design (MongoDB)
- ✅ Users collection with proper indexes
- ✅ OAuth Providers collection
- ✅ Password Resets collection
- ✅ Impersonation Logs collection
- ✅ Scalable design for 1M+ users
- ✅ Indexed fields: email, role, isBlocked
- ✅ Pagination implemented
- ✅ No N+1 queries (using aggregation)

### Security Features
- ✅ Environment variables for all secrets
- ✅ XSS protection (helmet, input sanitization)
- ✅ CSRF protection (cors with credentials)
- ✅ Rate limiting
- ✅ NoSQL injection prevention
- ✅ Secure admin routes

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### Setup
- The CI/CD pipeline is configured in `.github/workflows/ci.yml`
- It runs on every push and pull request to the `main` branch
- Tests Node.js versions 18.x and 20.x
- Installs dependencies and runs tests

### Usage
- Push your code to the `main` branch to trigger the pipeline
- Check the Actions tab in GitHub for build status
- For deployment, add a deploy job in the workflow file (e.g., to Heroku or AWS)

## Setup Instructions

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd <project-directory> 