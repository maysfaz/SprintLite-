const Joi = require('joi');

const createSprintSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  goal: Joi.string().max(500).optional(),
  endDate: Joi.date().greater('now').optional()
});

const updateSprintSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  goal: Joi.string().max(500).optional(),
  endDate: Joi.date().optional()
}).min(1);

const moveIssueSchema = Joi.object({
  issueId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

module.exports = { createSprintSchema, updateSprintSchema, moveIssueSchema };