const express = require('express');
const {
  getAllProducts,
  createProduct,
  getProductById,
  editProduct,
  deleteProduct,
} = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/create', authMiddleware.verifyTokenAndAdmin, createProduct);
router.patch('/:id', authMiddleware.verifyTokenAndAdmin, editProduct);
router.delete('/:id', authMiddleware.verifyTokenAndAdmin, deleteProduct);

module.exports = router;
