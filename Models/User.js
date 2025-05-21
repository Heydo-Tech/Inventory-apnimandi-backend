const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  establishmentId:{
    type: Number,
    required: true,
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
