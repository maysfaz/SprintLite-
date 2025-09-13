const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  members: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional()
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('active', 'completed', 'archived').optional()
}).min(1);

const inviteMemberSchema = Joi.object({
  memberId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

module.exports = { createProjectSchema, updateProjectSchema, inviteMemberSchema };