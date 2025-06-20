const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateRedeem } = require('../middleware/validators');
const redeemVoucher = require('../api/index');

const router = express.Router();

router.post('/', validateRedeem, asyncHandler(async (req, res) => {
  const { voucherCode, mobileNumber } = req.body;
  const result = await redeemVoucher(voucherCode, mobileNumber);
  res.status(200).json(result);
}));

module.exports = router; 