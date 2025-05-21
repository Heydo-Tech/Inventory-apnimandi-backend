const mongoose = require('mongoose');
const Product = require('./Product');

// Inventory schema
const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',  // Reference to Product model
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  noOfCarton: {
    type: Number,
    required: true
  },
  quantityPerCarton: {
    type: Number,
    required: true
  },
  remarks: {
    type: String
  },
  establishment: {
    type: String,
    required: true
  }
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
