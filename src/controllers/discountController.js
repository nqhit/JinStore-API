const Discount = require('../models/Discount');
const mongoose = require('mongoose');

module.exports = {
  //NOTE: Get all discounts
  getAllDiscounts: async (req, res) => {
    try {
      const discounts = await Discount.find().lean();
      if (discounts.length === 0) {
        return res.status(200).json([]);
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
      const discount = await Discount.findById(id).lean();
      if (!discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }
      res.status(200).json(discount);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //NOTE: Create discount
  createDiscount: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { code, discount, expiration, isActive, quantityLimit } = req.body;

      const checkCode = await Discount.findOne({ code: code });
      if (checkCode) {
        return res.status(400).json({ err: 'code', message: 'Mã giảm giá đã tồn tại' });
      }

      const newDiscount = new Discount({
        code: code.trim(),
        discount: discount,
        expiration: expiration || Date.now(),
        isActive: isActive || false,
        quantityLimit: quantityLimit || 100,
      });

      const savedDiscount = await newDiscount.save({ session });
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(savedDiscount);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error('Lỗi khi thêm mã giảm giá:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi server',
        error: error.message,
      });
    }
  },

  //NOTE: Update discount
  updateDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If trying to update code, check if it already exists
      if (updateData.code) {
        const existingDiscount = await Discount.findOne({
          code: updateData.code,
          _id: { $ne: id }, // exclude the current discount
        });

        if (existingDiscount) {
          return res.status(400).json({
            err: 'code',
            message: 'Mã giảm giá đã tồn tại',
          });
        }
      }

      const discount = await Discount.findByIdAndUpdate(id, updateData, { new: true });

      if (!discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }

      res.status(200).json(discount);
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
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
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  // NOTE: Toggle discount active status
  toggleDiscountStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const discount = await Discount.findById(id);

      if (!discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }

      discount.isActive = !discount.isActive;
      await discount.save();

      res.status(200).json(discount);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },
};
