const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { validateRedeem } = require('../middleware/validators');
const redeemVoucher = require('../api/index');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.post('/', validateRedeem, asyncHandler(async (req, res) => {
  const { voucherCode, mobileNumber } = req.body;
  const dbPath = path.join(__dirname, '../DatabaseT.txt');

  let existingCodes = [];
  if (fs.existsSync(dbPath)) {
    const fileContent = fs.readFileSync(dbPath, 'utf8');
    existingCodes = fileContent.split('\n').map(line => line.trim()).filter(Boolean);
  }
  if (existingCodes.includes(voucherCode)) {
    return res.status(409).json({
      status: {
        message: 'Duplicate voucherCode. This code has already been processed.',
        code: 'DUPLICATE_CODE',
      },
    });
  }

  const result = await redeemVoucher(voucherCode, mobileNumber);

  if (result && result.status && result.status.code === 'SUCCESS') {
    fs.appendFileSync(dbPath, voucherCode + '\n');
  }

  res.status(200).json(result);
}));

module.exports = router; 
