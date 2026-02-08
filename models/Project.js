const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status:      { type: String, enum: ['active', 'completed', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);