const Joi = require('joi');

const createIssueSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).optional(),
  assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  type: Joi.string().valid('story', 'bug', 'task', 'epic').optional(),
  storyPoints: Joi.number().integer().min(1).max(21).optional()
});

const updateIssueSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string().valid('backlog', 'todo', 'in-progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  type: Joi.string().valid('story', 'bug', 'task', 'epic').optional(),
  storyPoints: Joi.number().integer().min(1).max(21).optional()
}).min(1);

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required()
});

module.exports = { createIssueSchema, updateIssueSchema, createCommentSchema };