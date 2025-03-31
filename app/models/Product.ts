import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    enum: ['cx', 'unidade', 'kg', 'l', 'barril'],
    default: 'unidade',
  },
  quantityPerBox: {
    type: Number,
    default: 0,
    validate: {
      validator: function(this: {
        quantityPerBox: number; unit: string 
}) {
        return this.unit !== 'cx' || this.quantityPerBox > 0;
      },
      message: 'Quantity per box is required when unit is "cx"'
    }
  },
  boxUnit: {
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
    default: 'Uncategorized',
  },
  location: {
    type: String,
    default: 'Unspecified',
  },
  storeName: {
    type: String,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Delete the existing model if it exists to prevent the "Cannot overwrite model once compiled" error
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema); 