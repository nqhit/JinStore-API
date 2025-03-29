const express = require('express');
const router = express.Router();

const {
  getAllDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} = require('../controllers/discountController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyTokenAndAdmin, getAllDiscounts);
router.get('/', getDiscount);
router.post('/create', authMiddleware.verifyTokenAndAdmin, createDiscount);
router.patch('/:id', authMiddleware.verifyTokenAndAdmin, updateDiscount);
router.delete('/:id', authMiddleware.verifyTokenAndAdmin, deleteDiscount);

module.exports = router;
