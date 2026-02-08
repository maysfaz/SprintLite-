const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:      { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
    startDate:   { type: Date },
    endDate:     { type: Date },
    goal:        { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sprint', sprintSchema);