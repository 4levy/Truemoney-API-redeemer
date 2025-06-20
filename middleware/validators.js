const Joi = require('joi');

const redeemSchema = Joi.object({
  code: Joi.string().required(),
  amount: Joi.number().min(1).required(),
});

function validateRedeem(req, res, next) {
  const { error } = redeemSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
      },
      details: error.details.map(d => d.message),
    });
  }
  next();
}

module.exports = { validateRedeem }; 