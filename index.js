require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs=require("fs"); 

const app = express();



let swaggerDocument;
try {
  const file = fs.readFileSync('./swagger.json', 'utf8');
  swaggerDocument = JSON.parse(file);
} catch (err) {
  console.error('Error loading swagger.json:', err.message);
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const sprintRoutes = require('./routes/sprint.routes');
const issueRoutes = require('./routes/issue.routes');
const adminRoutes = require('./routes/admin.routes');



app.use(cors());

// Parse JSON
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Enable CORS for all origins (simple for demo)
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'SprintLite API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth (POST /register, POST /login, GET /profile, PATCH /profile)',
      projects: '/api/projects (CRUD operations)',
      sprints: '/api/sprints (CRUD operations, start/complete)',
      issues: '/api/issues (CRUD operations, comments)',
      admin: '/api/admin (user management, system stats)'
    }
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`SprintLite API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
}

start();