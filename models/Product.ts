import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    enum: ['cx', 'unidade', 'kg', 'l', 'barril', 'packet'],
    required: true,
  },
  quantityPerBox: {
    type: Number,
    default: 0,
  },
  boxUnit: {
    type: String,
    enum: ['unidade', 'kg', 'l'],
    default: 'unidade',
  },
  packetQuantity: {
    type: Number,
    default: 0,
  },
  packetUnit: {
    type: String,
    enum: ['unidade', 'kg', 'l'],
    default: 'unidade',
  },
  currentQuantity: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 