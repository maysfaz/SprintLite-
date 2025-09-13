const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../validators/validate');
const { createProjectSchema, updateProjectSchema, inviteMemberSchema } = require('../validators/project.schemas');
const router = express.Router();

router.use(requireAuth);

// Get all projects for current user
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check if user has access to this project
    const hasAccess = project.createdBy._id.toString() === req.user.id || 
                     project.members.some(m => m._id.toString() === req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project (manager/admin only)
router.post('/', requireRole(['manager', 'admin']), validate(createProjectSchema), async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;

    // Validate members exist
    if (members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return res.status(400).json({ error: 'Some members not found' });
      }
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      members: [...members, req.user.id] // Add creator as member
    });

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.status(201).json({ message: 'Project created successfully', project: populatedProject });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project (creator or admin only)
router.patch('/:id', validate(updateProjectSchema), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check permissions
    const canUpdate = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canUpdate) return res.status(403).json({ error: 'Permission denied' });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('createdBy', 'name email')
    .populate('members', 'name email');

    res.json({ message: 'Project updated successfully', project: updatedProject });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Invite member to project
router.post('/:id/invite', validate(inviteMemberSchema), async (req, res) => {
  try {
    const { memberId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check permissions (creator or admin)
    const canInvite = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canInvite) return res.status(403).json({ error: 'Permission denied' });

    // Check if user exists
    const user = await User.findById(memberId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if already member
    if (project.members.includes(memberId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    project.members.push(memberId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.json({ message: 'Member invited successfully', project: updatedProject });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const project = await Project.findById(id);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check permissions (creator or admin)
    const canRemove = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canRemove) return res.status(403).json({ error: 'Permission denied' });

    project.members = project.members.filter(m => m.toString() !== memberId);
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project (creator or admin only)
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check permissions
    const canDelete = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ error: 'Permission denied' });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;