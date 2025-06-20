const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateRedeem } = require('../middleware/validators');
const apiHandler = require('../api/index');

const router = express.Router();

router.post('/', validateRedeem, asyncHandler(async (req, res) => {
  // Business logic is handled in apiHandler
  await apiHandler(req, res);
}));

module.exports = router; 