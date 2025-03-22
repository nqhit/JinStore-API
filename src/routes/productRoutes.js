const express = require('express');
const {
  getAllProducts,
  getProductById,
  getProductsByCategoryId,
  createProduct,
  editProduct,
  deleteProduct,
} = require('../controllers/productController');

const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/category/:idCategory', getProductsByCategoryId);
router.post('/create', authMiddleware.verifyTokenAndAdmin, createProduct);
router.patch('/:id', authMiddleware.verifyTokenAndAdmin, editProduct);
router.delete('/:id', authMiddleware.verifyTokenAndAdmin, deleteProduct);

module.exports = router;
