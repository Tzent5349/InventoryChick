import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema); 