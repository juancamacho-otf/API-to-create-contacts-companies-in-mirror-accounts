const express = require('express');
const router = express.Router();
const contactRoutes = require('./contact');

router.use('/contact', contactRoutes);

module.exports = router;
