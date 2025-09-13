Simple Express + Mongoose API with JWT authentication, Joi validation, CORS, and a tiny vanilla JS frontend.

## Setup

1) Install dependencies
```bash
npm install
```

2) Configure environment in `.env` (already provided with defaults). Ensure MongoDB is running locally.

3) (Optional) Seed an admin user
```bash
npm run seed:admin
# Defaults:
# email: admin@sprintlite.com
# password: admin123
```

You can change admin seed credentials by setting environment variables before running the command:
```
ADMIN_EMAIL=me@uni.edu ADMIN_NAME="Super Admin" ADMIN_PASSWORD="S3cr3t!" npm run seed:admin
```

4) Start the API
```bash
npm start
# API at http://localhost:3000
```

## Endpoints

- `POST /api/auth/register` -> { name, email, password }
- `POST /api/auth/login` -> { email, password }
- `GET /api/courses` -> Auth required (any role)
- `POST /api/courses` -> Admin required
- `PATCH /api/courses/:id` -> Admin required
- `DELETE /api/courses/:id` -> Admin required

## Frontend

Open `frontend/login.html` or `frontend/register.html` in a browser (or serve the folder with a simple static server). The frontend expects the API at `http://localhost:3000`.