// importProducts.js

import mongoose from 'mongoose';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Product from '../models/Product';

dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in your .env file');
  process.exit(1);
}

// At this point, we know MONGODB_URI is defined
const uri = MONGODB_URI as string;

interface ExcelRow {
  name?: string;
  Name?: string;
  Nome?: string;
  unit?: string;
  Unit?: string;
  Unidade?: string;
  quantityPerBox?: number;
  QuantityPerBox?: number;
  QuantidadePorCaixa?: number;
  boxUnit?: string;
  BoxUnit?: string;
  UnidadeCaixa?: string;
  currentQuantity?: number;
  CurrentQuantity?: number;
  QuantidadeAtual?: number;
  category?: string;
  Category?: string;
  Categoria?: string;
  location?: string;
  Location?: string;
  Localizacao?: string;
}

async function importProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Read the Excel file
    const workbook = xlsx.readFile(path.join(__dirname, 'full_pre_categorized_inventory.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<ExcelRow>(worksheet);

    // Process each row
    for (const row of data) {
      try {
        // Create product object with default values
        const product = {
          name: row.name || row.Name || row.Nome || '',
          unit: row.unit || row.Unit || row.Unidade || 'unidade',
          quantityPerBox: Number(row.quantityPerBox || row.QuantityPerBox || row.QuantidadePorCaixa || 0),
          boxUnit: row.boxUnit || row.BoxUnit || row.UnidadeCaixa || 'unidade',
          currentQuantity: Number(row.currentQuantity || row.CurrentQuantity || row.QuantidadeAtual || 0),
          category: row.category || row.Category || row.Categoria || 'Uncategorized',
          location: row.location || row.Location || row.Localizacao || 'Unspecified',
        };

        // Validate required field
        if (!product.name) {
          console.warn('Skipping row - missing required field: name', row);
          continue;
        }

        // Normalize unit values
        const unitMap: Record<string, string> = {
          'cx': 'cx',
          'caixa': 'cx',
          'box': 'cx',
          'kg': 'kg',
          'kilograma': 'kg',
          'kilogram': 'kg',
          'l': 'l',
          'litro': 'l',
          'litre': 'l',
          'barril': 'barril',
          'barrel': 'barril',
          'unidade': 'unidade',
          'unit': 'unidade',
          'piece': 'unidade'
        };

        product.unit = unitMap[product.unit?.toLowerCase() || ''] || 'unidade';

        // Normalize boxUnit values
        const boxUnitMap: Record<string, string> = {
          'unidade': 'unidade',
          'unit': 'unidade',
          'piece': 'unidade',
          'kg': 'kg',
          'kilograma': 'kg',
          'kilogram': 'kg',
          'l': 'l',
          'litro': 'l',
          'litre': 'l'
        };

        product.boxUnit = boxUnitMap[product.boxUnit?.toLowerCase() || ''] || 'unidade';

        // Check if product already exists
        const existingProduct = await Product.findOne({ name: product.name });
        if (existingProduct) {
          console.log(`Product "${product.name}" already exists, updating...`);
          await Product.findByIdAndUpdate(existingProduct._id, product);
        } else {
          console.log(`Creating new product: "${product.name}"`);
          await Product.create(product);
        }
      } catch (error) {
        console.error('Error processing row:', row, error);
      }
    }

    console.log('Import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

importProducts();
