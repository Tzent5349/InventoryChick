'use client';

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../components/ThemeProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  unit: 'cx' | 'unidade' | 'kg' | 'l' | 'barril';
  quantityPerBox?: number;
  boxUnit?: 'unidade' | 'kg' | 'l';
  currentQuantity: number;
  category: string;
  location: string;
}

interface CategoryTotal {
  category: string;
  totalQuantity: number;
  unit: string;
  products: {
    name: string;
    quantity: number;
    unit: string;
    location: string;
  }[];
}

type SortField = 'category' | 'location' | 'quantity';
type SortOrder = 'asc' | 'desc';

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateCategoryTotals();
  }, [products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const calculateCategoryTotals = () => {
    const totals: { [key: string]: CategoryTotal } = {};

    products.forEach(product => {
      const quantity = product.unit === 'cx' && product.quantityPerBox
        ? product.currentQuantity * product.quantityPerBox
        : product.currentQuantity;

      const unit = product.unit === 'cx' ? product.boxUnit || 'unidade' : product.unit;

      if (!totals[product.category]) {
        totals[product.category] = {
          category: product.category,
          totalQuantity: 0,
          unit: unit,
          products: []
        };
      }

      totals[product.category].totalQuantity += quantity;
      totals[product.category].products.push({
        name: product.name,
        quantity: product.currentQuantity,
        unit: unit,
        location: product.location
      });
    });

    let sortedTotals = Object.values(totals);

    // Sort the totals based on the selected field and order
    sortedTotals.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'location':
          // Sort by first product's location in each category
          const aLocation = a.products[0]?.location || '';
          const bLocation = b.products[0]?.location || '';
          comparison = aLocation.localeCompare(bLocation);
          break;
        case 'quantity':
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setCategoryTotals(sortedTotals);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-6 h-6" />
            ) : (
              <SunIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => toggleSort('category')}
            className="button-secondary flex items-center"
          >
            Sort by Category
            {sortField === 'category' && (
              sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
            )}
          </button>
          <button
            onClick={() => toggleSort('location')}
            className="button-secondary flex items-center"
          >
            Sort by Location
            {sortField === 'location' && (
              sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
            )}
          </button>
          <button
            onClick={() => toggleSort('quantity')}
            className="button-secondary flex items-center"
          >
            Sort by Quantity
            {sortField === 'quantity' && (
              sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryTotals.map((category) => (
            <div key={category.category} className="card">
              <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
              <div className="mb-4">
                <div className="text-2xl font-bold">
                  {category.totalQuantity} {category.unit}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</div>
              </div>
              <div className="space-y-2">
                {category.products.map((product) => (
                  <div key={product.name} className="flex justify-between items-center">
                    <div>
                      <span className="text-sm">{product.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({product.location})</span>
                    </div>
                    <span className="text-sm font-medium">
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 