const express = require('express');

const { applyPartner } = require('../controllers/partner.controller');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/apply', rateLimiter, applyPartner);

module.exports = router;