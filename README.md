# Inventory Management System

A modern inventory management system built with Next.js, MongoDB, and TypeScript. This application helps you track products, manage stock levels, and organize items by categories and locations.

## Features

- 📦 Product Management
  - Add, edit, and delete products
  - Track quantities and units
  - Support for multiple units (boxes, units, kg, liters, barrels)
  - Category and location organization

- 📊 Dashboard
  - View total quantities by category
  - Sort products by name, category, location, or quantity
  - Quick overview of inventory status

- 🔍 Search and Filter
  - Search products by name, category, or location
  - Filter by category
  - Sort products by various criteria

- 🌓 Dark/Light Mode
  - Toggle between dark and light themes
  - Persistent theme preference

- 📱 Progressive Web App
  - Install on mobile devices
  - Offline support
  - Native app-like experience

## Tech Stack

- Next.js 14
- TypeScript
- MongoDB
- Tailwind CSS
- React Hot Toast
- XLSX for Excel import

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Tzent5349/InventoryChick.git
cd InventoryChick
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your MongoDB connection string:
```
MONGODB_URI=your_mongodb_connection_string
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Importing Products from Excel

1. Place your Excel file in the `lib` directory
2. Name it `full_pre_categorized_inventory.xlsx`
3. Run the import script:
```bash
npm run import-products
```

The Excel file should have columns with any of these names (case-insensitive):
- name/Name/Nome (required)
- unit/Unit/Unidade
- quantityPerBox/QuantityPerBox/QuantidadePorCaixa
- boxUnit/BoxUnit/UnidadeCaixa
- currentQuantity/CurrentQuantity/QuantidadeAtual
- category/Category/Categoria
- location/Location/Localizacao

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
