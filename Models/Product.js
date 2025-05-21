const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCategory: {
    type: String,
    required: true
  },
  productSubcategory: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  barcode: {
    type: Number,
  },
  expireDate:{
    type:Date
  }
  ,

  sku: {
    type: String, // You can use String or Number based on your needs
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
