require('dotenv').config();
<<<<<<< HEAD
=======

>>>>>>> master
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
<<<<<<< HEAD
const fs=require("fs"); 

const app = express();



=======
const fs = require('fs');

//  Load Swagger FIRST 
>>>>>>> master
let swaggerDocument;
try {
  const file = fs.readFileSync('./swagger.json', 'utf8');
  swaggerDocument = JSON.parse(file);
} catch (err) {
  console.error('Error loading swagger.json:', err.message);
}
<<<<<<< HEAD
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


=======

//  Load Routes FIRST 
>>>>>>> master
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const sprintRoutes = require('./routes/sprint.routes');
const issueRoutes = require('./routes/issue.routes');
const adminRoutes = require('./routes/admin.routes');

<<<<<<< HEAD


app.use(cors());

// Parse JSON
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Enable CORS for all origins (simple for demo)
// Routes
=======
//    Create App 
const app = express();

//        Middlewares 
app.use(cors());
app.use(express.json());

//  Swagger 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//  Routes 
>>>>>>> master
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);

<<<<<<< HEAD
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

=======
//  Static Files 
app.use(express.static('frontend'));

//  Health Check 
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'SprintLite API is running',
    version: '1.0.0'
  });
});

//  SPA Fallback 
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

//  Start Server 
>>>>>>> master
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
<<<<<<< HEAD
      console.log(`SprintLite API listening on http://localhost:${PORT}`);
=======
      console.log(`🚀 SprintLite API running at http://localhost:${PORT}`);
      console.log(`📘 Swagger at http://localhost:${PORT}/api-docs`);
>>>>>>> master
    });
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
}

<<<<<<< HEAD
start();
=======
start();
>>>>>>> master
