require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

//  Load Swagger FIRST 
let swaggerDocument;
try {
  const file = fs.readFileSync('./swagger.json', 'utf8');
  swaggerDocument = JSON.parse(file);
} catch (err) {
  console.error('Error loading swagger.json:', err.message);
}

//  Load Routes FIRST 
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const sprintRoutes = require('./routes/sprint.routes');
const issueRoutes = require('./routes/issue.routes');
const adminRoutes = require('./routes/admin.routes');

//    Create App 
const app = express();

//        Middlewares 
app.use(cors());
app.use(express.json());

//  Swagger 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//  Routes 
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);

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
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 SprintLite API running at http://localhost:${PORT}`);
      console.log(`📘 Swagger at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
}

start();
