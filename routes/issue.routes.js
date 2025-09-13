const express = require('express');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../validators/validate');
const { createIssueSchema, updateIssueSchema, createCommentSchema } = require('../validators/issue.schemas');

const router = express.Router();

router.use(requireAuth);

// Get all issues for a project
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

    const issues = await Issue.find({ project: projectId })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('sprint', 'name status')
      .sort({ createdAt: -1 });

    res.json({ issues });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single issue with comments
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('sprint', 'name status');

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check if user has access
    const project = await Project.findById(issue.project._id);
    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    // Get comments for this issue
    const comments = await Comment.find({ issue: issue._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 });

    res.json({ issue, comments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create issue
router.post('/project/:projectId', validate(createIssueSchema), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, type, storyPoints } = req.body;

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    // If assignedTo is provided, check if user is project member
    if (assignedTo && !project.members.includes(assignedTo)) {
      return res.status(400).json({ error: 'Assigned user is not a project member' });
    }

    const issue = await Issue.create({
      title,
      description,
      assignedTo,
      priority,
      type,
      storyPoints,
      project: projectId,
      createdBy: req.user.id
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    res.status(201).json({ message: 'Issue created successfully', issue: populatedIssue });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update issue (creator or admin can edit any field, others can only update status if assigned)
router.patch('/:id', validate(updateIssueSchema), async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate('project');
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check if user has access to project
    const project = await Project.findById(issue.project._id);
    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    // Check permissions for different types of updates
    const isCreator = issue.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isAssigned = issue.assignedTo && issue.assignedTo.toString() === req.user.id;

    // Only creator or admin can edit all fields
    if (!isCreator && !isAdmin) {
      // Others can only update status if they're assigned to the issue
      if (!isAssigned || Object.keys(req.body).some(key => key !== 'status')) {
        return res.status(403).json({ error: 'You can only update status of issues assigned to you' });
      }
    }

    // If assignedTo is being changed, check if user is project member
    if (req.body.assignedTo && !project.members.includes(req.body.assignedTo)) {
      return res.status(400).json({ error: 'Assigned user is not a project member' });
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('project', 'name')
    .populate('sprint', 'name status');

    res.json({ message: 'Issue updated successfully', issue: updatedIssue });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to issue
router.post('/:id/comments', validate(createCommentSchema), async (req, res) => {
  try {
    const { content } = req.body;
    const issue = await Issue.findById(req.params.id).populate('project');
    
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check if user has access to project
    const project = await Project.findById(issue.project._id);
    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const comment = await Comment.create({
      content,
      issue: issue._id,
      createdBy: req.user.id
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ message: 'Comment added successfully', comment: populatedComment });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for an issue
router.get('/:id/comments', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate('project');
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check if user has access to project
    const project = await Project.findById(issue.project._id);
    const hasAccess = project.createdBy.toString() === req.user.id || 
                     project.members.includes(req.user.id) ||
                     req.user.role === 'admin';

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const comments = await Comment.find({ issue: req.params.id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete issue (creator or admin only)
router.delete('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check permissions
    const canDelete = issue.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ error: 'Permission denied' });

    // Delete all comments for this issue
    await Comment.deleteMany({ issue: issue._id });
    
    // Delete the issue
    await Issue.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (creator or admin only)
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate('issue');
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Check permissions
    const canDelete = comment.createdBy.toString() === req.user.id || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ error: 'Permission denied' });

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;