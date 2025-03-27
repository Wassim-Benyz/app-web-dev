const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrl: String, // Added field for image URL
});

module.exports = mongoose.model("Product", productSchema);
