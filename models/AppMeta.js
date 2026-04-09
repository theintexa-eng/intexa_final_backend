const mongoose = require('mongoose');

const appMetaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'app_meta',
  }
);

module.exports = mongoose.model('AppMeta', appMetaSchema);