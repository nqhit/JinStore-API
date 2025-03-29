const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  getProductByIdCategory,
  createProduct,
  editProduct,
  deleteProduct,
} = require('../controllers/productController');

const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/category/:idCategory', getProductByIdCategory);
router.post('/create', authMiddleware.verifyTokenAndAdmin, createProduct);
router.patch('/:id', authMiddleware.verifyTokenAndAdmin, editProduct);
router.delete('/:id', authMiddleware.verifyTokenAndAdmin, deleteProduct);

module.exports = router;
