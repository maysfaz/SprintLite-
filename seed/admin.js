require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const email = process.env.ADMIN_EMAIL || 'admin@sprintlite.com';
    const name = process.env.ADMIN_NAME || 'SprintLite Admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin already exists:', email);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await User.create({ 
        name, 
        email, 
        passwordHash, 
        role: 'admin',
        bio: 'System Administrator'
      });
      console.log('Admin created:', email);
    }

    const sampleUsers = [
      {
        name: 'John Manager',
        email: 'manager@sprintlite.com',
        role: 'manager',
        bio: 'Project Manager'
      },
      {
        name: 'Jane Developer',
        email: 'developer@sprintlite.com',
        role: 'member',
        bio: 'Full Stack Developer'
      }
    ];

    for (const userData of sampleUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const passwordHash = await bcrypt.hash('password123', 10);
        await User.create({ ...userData, passwordHash });
        console.log('Sample user created:', userData.email);
      }
    }

    console.log('Done. Admin credentials ->', { email, password });
    console.log('Sample credentials -> manager@sprintlite.com / password123');
    console.log('Sample credentials -> developer@sprintlite.com / password123');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();