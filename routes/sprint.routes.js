const express = require('express');
const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../validators/validate');
const { createSprintSchema, updateSprintSchema, moveIssueSchema } = require('../validators/sprint.schemas');

const router = express.Router();

router.use(requireAuth);

// Get all sprints for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const sprints = await Sprint.find({ project: projectId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ sprints });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single sprint with issues
router.get('/:id', async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Check if user has access
    const project = await Project.findById(sprint.project._id);
    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    // Get issues in this sprint
    const issues = await Issue.find({ sprint: sprint._id })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ sprint, issues });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create sprint (manager only)
router.post('/project/:projectId', requireRole(['manager', 'admin']), validate(createSprintSchema), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, goal, endDate } = req.body;

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const hasAccess = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const sprint = await Sprint.create({
      name,
      description,
      goal,
      endDate,
      project: projectId,
      createdBy: req.user.id
    });

    const populatedSprint = await Sprint.findById(sprint._id)
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.status(201).json({ message: 'Sprint created successfully', sprint: populatedSprint });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update sprint (manager only)
router.patch('/:id', requireRole(['manager', 'admin']), validate(updateSprintSchema), async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('project');
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Check permissions
    const project = await Project.findById(sprint.project._id);
    const canUpdate = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canUpdate) return res.status(403).json({ error: 'Permission denied' });

    const updatedSprint = await Sprint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('createdBy', 'name email')
    .populate('project', 'name');

    res.json({ message: 'Sprint updated successfully', sprint: updatedSprint });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start sprint (manager only)
router.patch('/:id/start', requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('project');
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (sprint.status !== 'planning') {
      return res.status(400).json({ error: 'Sprint is not in planning status' });
    }

    // Check permissions
    const project = await Project.findById(sprint.project._id);
    const canStart = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canStart) return res.status(403).json({ error: 'Permission denied' });

    sprint.status = 'active';
    sprint.startDate = new Date();
    await sprint.save();

    res.json({ message: 'Sprint started successfully', sprint });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete sprint (manager only)
router.patch('/:id/complete', requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('project');
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    if (sprint.status !== 'active') {
      return res.status(400).json({ error: 'Sprint is not active' });
    }

    // Check permissions
    const project = await Project.findById(sprint.project._id);
    const canComplete = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canComplete) return res.status(403).json({ error: 'Permission denied' });

    sprint.status = 'completed';
    await sprint.save();

    // Move incomplete issues back to backlog
    await Issue.updateMany(
      { sprint: sprint._id, status: { $ne: 'done' } },
      { $unset: { sprint: 1 }, status: 'backlog' }
    );

    res.json({ message: 'Sprint completed successfully', sprint });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Move issue to sprint (manager only)
router.post('/:id/issues', requireRole(['manager', 'admin']), validate(moveIssueSchema), async (req, res) => {
  try {
    const { issueId } = req.body;
    const sprint = await Sprint.findById(req.params.id).populate('project');
    
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check if issue belongs to the same project
    if (issue.project.toString() !== sprint.project._id.toString()) {
      return res.status(400).json({ error: 'Issue does not belong to this project' });
    }

    // Check permissions
    const project = await Project.findById(sprint.project._id);
    const canMove = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canMove) return res.status(403).json({ error: 'Permission denied' });

    // Move issue to sprint
    issue.sprint = sprint._id;
    if (issue.status === 'backlog') {
      issue.status = 'todo';
    }
    await issue.save();

    res.json({ message: 'Issue moved to sprint successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove issue from sprint (manager only)
router.delete('/:id/issues/:issueId', requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const { id, issueId } = req.params;
    const sprint = await Sprint.findById(id).populate('project');
    
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check permissions
    const project = await Project.findById(sprint.project._id);
    const canRemove = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canRemove) return res.status(403).json({ error: 'Permission denied' });

    // Remove issue from sprint
    issue.sprint = null;
    issue.status = 'backlog';
    await issue.save();

    res.json({ message: 'Issue removed from sprint successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete sprint (manager only)
router.delete('/:id', requireRole(['manager', 'admin']), async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('project');
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    // Check permissions
    const project = await Project.findById(sprint.project._id);
    const canDelete = project.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ error: 'Permission denied' });

    // Move all issues back to backlog
    await Issue.updateMany(
      { sprint: sprint._id },
      { $unset: { sprint: 1 }, status: 'backlog' }
    );

    await Sprint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;