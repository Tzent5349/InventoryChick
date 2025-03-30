import mongoose from 'mongoose';
import { Product } from '../app/models/Product';

const products = [
  // Bebidas
  {
    name: "Coca-Cola 2L",
    unit: "cx",
    quantityPerBox: 6,
    boxUnit: "l",
    currentQuantity: 0,
    category: "Bebidas",
    location: "Estante 1"
  },
  {
    name: "Água Mineral 5L",
    unit: "barril",
    quantityPerBox: 20,
    boxUnit: "l",
    currentQuantity: 0,
    category: "Bebidas",
    location: "Estante 2"
  },
  {
    name: "Cerveja 600ml",
    unit: "cx",
    quantityPerBox: 12,
    boxUnit: "l",
    currentQuantity: 0,
    category: "Bebidas",
    location: "Estante 3"
  },

  // Limpeza
  {
    name: "Detergente 5L",
    unit: "barril",
    quantityPerBox: 20,
    boxUnit: "l",
    currentQuantity: 0,
    category: "Limpeza",
    location: "Estante 4"
  },
  {
    name: "Desinfetante 1L",
    unit: "cx",
    quantityPerBox: 12,
    boxUnit: "l",
    currentQuantity: 0,
    category: "Limpeza",
    location: "Estante 5"
  },

  // Alimentos
  {
    name: "Arroz 5kg",
    unit: "cx",
    quantityPerBox: 6,
    boxUnit: "kg",
    currentQuantity: 0,
    category: "Alimentos",
    location: "Estante 6"
  },
  {
    name: "Feijão 1kg",
    unit: "cx",
    quantityPerBox: 12,
    boxUnit: "kg",
    currentQuantity: 0,
    category: "Alimentos",
    location: "Estante 7"
  },
  {
    name: "Açúcar 1kg",
    unit: "cx",
    quantityPerBox: 12,
    boxUnit: "kg",
    currentQuantity: 0,
    category: "Alimentos",
    location: "Estante 8"
  },

  // Higiene
  {
    name: "Papel Higiênico",
    unit: "cx",
    quantityPerBox: 12,
    boxUnit: "unidade",
    currentQuantity: 0,
    category: "Higiene",
    location: "Estante 9"
  },
  {
    name: "Sabonete",
    unit: "cx",
    quantityPerBox: 24,
    boxUnit: "unidade",
    currentQuantity: 0,
    category: "Higiene",
    location: "Estante 10"
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    await Product.insertMany(products);
    console.log('Successfully seeded products');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts(); 