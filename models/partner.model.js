const mongoose = require('mongoose');

const partnerApplicationSchema = new mongoose.Schema(
  {
    partnerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    studioName: {
      type: String,
      trim: true,
    },
    yearOfEstablishment: {
      type: String,
      trim: true,
    },
    founderName: {
      type: String,
      trim: true,
    },
    teamSize: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
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
    specialization: {
      type: String,
      trim: true,
    },
    projectValueRange: {
      type: String,
      trim: true,
    },
    portfolioLink: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    clientRef1: {
      type: String,
      trim: true,
    },
    clientRef2: {
      type: String,
      trim: true,
    },
    consent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'submitted',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PartnerApplication ||
  mongoose.model('PartnerApplication', partnerApplicationSchema);