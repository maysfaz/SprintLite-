const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sprint:      { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status:      { type: String, enum: ['backlog', 'todo', 'in-progress', 'done'], default: 'backlog' },
    priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    type:        { type: String, enum: ['story', 'bug', 'task', 'epic'], default: 'story' },
    storyPoints: { type: Number, min: 1, max: 21, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);