const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content:   { type: String, required: true, trim: true },
    issue:     { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);