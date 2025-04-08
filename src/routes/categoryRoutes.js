const express = require('express');
const {
  getAllCategory,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllCategory);
router.get('/:id', getCategory);
router.post('/create', authMiddleware.verifyTokenAndAdmin, createCategory);
router.patch('/update/:id', authMiddleware.verifyTokenAndAdmin, updateCategory);
router.delete('/delete/:id', authMiddleware.verifyTokenAndAdmin, deleteCategory);

module.exports = router;
