const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    inquiryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    propertyType: {
      type: String,
      trim: true,
    },
    budget: {
      type: String,
      trim: true,
    },
    timeline: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    stepCompleted: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    status: {
      type: String,
      default: 'in_progress',
      enum: ['in_progress', 'completed'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);