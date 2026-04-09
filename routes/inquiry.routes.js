const express = require('express');

const {
  startInquiry,
  updateInquiryStep2,
  completeInquiry,
} = require('../controllers/inquiry.controller');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/start', rateLimiter, startInquiry);
router.put('/step2/:inquiryId', rateLimiter, updateInquiryStep2);
router.put('/complete/:inquiryId', rateLimiter, completeInquiry);

module.exports = router;