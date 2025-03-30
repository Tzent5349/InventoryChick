import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
  },
  unit: {
    type: String,
    required: [true, 'Please provide a unit'],
    enum: ['cx', 'unidade', 'kg'],
  },
  quantityPerBox: {
    type: Number,
    required: function(this: { unit: string }) {
      return this.unit === 'cx';
    },
  },
  currentQuantity: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
  },
  location: {
    type: String,
    required: [true, 'Please provide a location'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema); 