const express = require('express');

const { getBaseRoute } = require('../controllers/baseController');
const { submitContact } = require('../controllers/contactController');
const { submitPartner } = require('../controllers/partnerController');
const inquiryRoutes = require('./inquiry.routes');
const partnerRoutes = require('./partner.routes');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', getBaseRoute);
router.post('/contact', rateLimiter, submitContact);
router.post('/partner', rateLimiter, submitPartner);
router.use('/inquiry', inquiryRoutes);
router.use('/partners', partnerRoutes);

module.exports = router;