import xlsx from 'xlsx';
import mongoose from 'mongoose';
import { Product } from '../app/models/Product';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define MONGODB_URI in your .env file');
  process.exit(1);
}

async function importProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read the Excel file
    const workbook = xlsx.readFile('lib/products.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

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