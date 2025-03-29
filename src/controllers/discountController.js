const Discount = require('../models/Discount');

module.exports = {
  //NOTE: Get all discounts
  getAllDiscounts: async (req, res) => {
    try {
      const discounts = await Discount.find().lean();
      if (discounts.length === 0) {
        return res.status(200).json({ message: 'Discount not found' });
      }
      res.status(200).json(discounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //NOTE: Get discount
  getDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const discounts = await Discount.findById(id).lean();
      if (discounts.length === 0) {
        return res.status(200).json({ message: 'Discount not found' });
      }
      res.status(200).json(discounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //NOTE: Create discount
  createDiscount: async (res, req) => {
    try {
      const { code, discount, expiration, isActive, quantityLimit, quantityUsed } = req.body;

      const checkCode = Discount.findOne({ code: code });
      if (checkCode) {
        return res.status(400).json({ err: 'code', message: 'Mã giảm giá đã tồn tại' });
      }

      const newDiscount = await new Discount({
        code: code.trim(),
        discount: discount,
        expiration: expiration || Date.now(),
        isActive: isActive || false,
        quantityLimit: quantityLimit || 100,
        quantityUsed: quantityUsed || 0,
      });

      const savedDiscount = await newDiscount.save();
      res.status(200).json({ success: true, data: savedDiscount });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Update discount
  updateDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const { code, ...other } = req.body;
      const discount = await Discount.findByIdAndUpdate(id, ...other, { new: true });
      if (discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }
      res.status(200).json({ success: true, product: discount });
    } catch {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Delete discount
  deleteDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const discount = await Discount.findByIdAndDelete(id);
      if (!discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }
      res.status(200).json({ message: 'Discount deleted successfully' });
    } catch {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },
};
