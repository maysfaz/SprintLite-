const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Promote/Demote user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['member', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id, 
      { role }, 
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (will cascade delete their content)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow admin to delete themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete all content created by this user
    await Comment.deleteMany({ createdBy: id });
    await Issue.deleteMany({ createdBy: id });
    await Sprint.deleteMany({ createdBy: id });
    await Project.deleteMany({ createdBy: id });
    
    // Remove user from project members
    await Project.updateMany(
      { members: id },
      { $pull: { members: id } }
    );

    // Unassign issues
    await Issue.updateMany(
      { assignedTo: id },
      { $unset: { assignedTo: 1 } }
    );

    // Delete the user
    await User.findByIdAndDelete(id);

    res.json({ message: 'User and all their content deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all projects (admin overview)
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete any project
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Delete all related content
    const sprints = await Sprint.find({ project: id });
    const sprintIds = sprints.map(s => s._id);
    
    await Comment.deleteMany({ 
      issue: { $in: await Issue.find({ project: id }).distinct('_id') }
    });
    await Issue.deleteMany({ project: id });
    await Sprint.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    res.json({ message: 'Project and all related content deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all sprints (admin overview)
router.get('/sprints', async (req, res) => {
  try {
    const sprints = await Sprint.find()
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json({ sprints });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete any sprint
router.delete('/sprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sprint = await Sprint.findById(id);
    
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Move all issues back to backlog
    await Issue.updateMany(
      { sprint: id },
      { $unset: { sprint: 1 }, status: 'backlog' }
    );

    await Sprint.findByIdAndDelete(id);
    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all issues (admin overview)
router.get('/issues', async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('sprint', 'name')
      .sort({ createdAt: -1 });

    res.json({ issues });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete any issue
router.delete('/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);
    
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Delete all comments for this issue
    await Comment.deleteMany({ issue: id });
    await Issue.findByIdAndDelete(id);

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all comments (admin overview)
router.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('createdBy', 'name email')
      .populate('issue', 'title')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete any comment
router.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id);
    
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      projects: await Project.countDocuments(),
      sprints: await Sprint.countDocuments(),
      issues: await Issue.countDocuments(),
      comments: await Comment.countDocuments(),
      usersByRole: await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      projectsByStatus: await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      issuesByStatus: await Issue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      sprintsByStatus: await Sprint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;