# SprintLite - Task Management System

A modern task management system with authentication, project management, and issue tracking.

## Prerequisites

Before running the application, make sure you have:

1. **Node.js** installed (v14 or higher)
2. **MongoDB** installed and running locally
3. **PowerShell execution policy** configured (if needed)

## Step-by-Step Setup Instructions

### Step 1: Check MongoDB Status

Make sure MongoDB is running on your system:

```powershell
# Check if MongoDB is running
Get-Process mongod
```

If MongoDB is not running, start it:
```powershell
# Start MongoDB (adjust path if needed)
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"
```

### Step 2: Navigate to Project Directory

```powershell
cd C:\Users\Mays\Downloads\Sprint\Sprint
```

### Step 3: Install Dependencies (if needed)

If you haven't installed dependencies yet, or if you encounter issues:

```powershell
# Set execution policy (run PowerShell as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
npm install
```

### Step 4: Configure Environment Variables

Make sure your `.env` file exists with the correct configuration:

```
MONGO_URI=mongodb://localhost:27017/sprintlite
JWT_SECRET=your-secret-key-here
PORT=3000
```

### Step 5: Start the Application

```powershell
node index.js
```

You should see:
```
MongoDB connected
🚀 SprintLite API running at http://localhost:3000
📘 Swagger at http://localhost:3000/api-docs
```

### Step 6: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## Using the Application

### First Time Setup

1. **Register a New Account**
   - Click "Sign up" on the login page
   - Enter your name, email, and password
   - Click "Create Account"

2. **Create Your First Project**
   - After login, you'll see the Dashboard
   - Click "New Project"
   - Enter project name and description
   - Click "Create Project"

3. **Add Issues to Your Project**
   - Click on a project card to open it
   - Click "New Issue"
   - Fill in issue details (title, description, priority, type)
   - Click "Create Issue"

4. **Manage Issues**
   - Issues appear in the "To Do" column
   - Click an issue card to move it to "In Progress"
   - Click again to move it to "Done"

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` error:

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### PowerShell Script Execution Error

If you get "running scripts is disabled":

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### MongoDB Connection Error

Make sure MongoDB is running:

```powershell
# Check MongoDB status
Get-Process mongod

# If not running, start it
mongod --dbpath "C:\data\db"
```

## API Documentation

Access Swagger API documentation at:
```
http://localhost:3000/api-docs
```

## Project Structure

```
Sprint/
├── frontend/           # Vanilla JS Frontend
│   ├── index.html     # Main HTML file
│   ├── css/
│   │   └── style.css  # Styles
│   └── js/
│       ├── app.js     # Router & main logic
│       ├── api.js     # API wrapper
│       ├── auth.js    # Authentication
│       ├── dashboard.js # Dashboard view
│       └── project.js  # Project/Issue view
├── routes/            # API Routes
├── models/            # MongoDB Models
├── middleware/        # Auth middleware
├── validators/        # Request validation
└── index.js          # Server entry point
```

## Features

- ✅ User Authentication (Register/Login)
- ✅ Project Management
- ✅ Issue Tracking with Kanban Board
- ✅ Priority & Type Classification
- ✅ Responsive Design
- ✅ No Admin Seed Required (all users can create projects)