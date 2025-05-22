const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, verifyTokenAndAdmin } = require('../middlewares/authMiddleware');

router.post('/create', verifyToken, orderController.createOrder);
router.get('', verifyToken, orderController.getOrdersStatus);
router.get('/:id', verifyToken, orderController.getOrdersStatus);

module.exports = router;
