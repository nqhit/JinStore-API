const express = require('express');
const { getAllCategory, getCategory, createCategory } = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllCategory);
router.get('/:id', getCategory);
router.post('/create', authMiddleware.verifyTokenAndAdmin, createCategory);

module.exports = router;
