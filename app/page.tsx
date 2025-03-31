'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, PlusCircleIcon, SunIcon, MoonIcon, MagnifyingGlassIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTheme } from './components/ThemeProvider';
import Link from 'next/link';
import React from 'react';

interface Product {
  _id: string;
  name: string;
  unit: 'cx' | 'unidade' | 'kg' | 'l' | 'barril';
  quantityPerBox?: number;
  boxUnit?: 'unidade' | 'kg' | 'l';
  currentQuantity: number;
  category: string;
  location: string;
  storeName?: string;
  lastUpdated?: Date;
}

interface Inventory {
  _id: string;
  name: string;
  storeName: string;
  date: string;
  description?: string;
  products: {
    productId: Product;
    quantity: number;
    notes?: string;
  }[];
}

type SortField = 'name' | 'category' | 'location' | 'quantity';
type SortOrder = 'asc' | 'desc';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(true);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    storeName: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });
  const [stores, setStores] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetchProducts();
    fetchInventories();
  }, []);

  useEffect(() => {
    // Extract unique stores from products
    const uniqueStores = Array.from(new Set(products.map(product => product.storeName || 'Uncategorized')));
    setStores(uniqueStores);
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

  const fetchInventories = async () => {
    try {
      const response = await fetch('/api/inventories');
      const data = await response.json();
      setInventories(data);
    } catch (error) {
      toast.error('Failed to fetch inventories');
    }
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryFormData),
      });
      const data = await response.json();
      setSelectedInventory(data);
      setIsInventoryFormOpen(false);
      toast.success('Inventory created successfully');
      fetchInventories();
    } catch (error) {
      toast.error('Failed to create inventory');
    }
  };

  const handleAddProductToInventory = async (product: Product, quantity: number) => {
    if (!selectedInventory) return;

    try {
      const response = await fetch(`/api/inventories/${selectedInventory._id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to add product');

      toast.success('Product added to inventory');
      fetchInventories();
    } catch (error) {
      toast.error('Failed to add product to inventory');
    }
  };

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'quantity':
          comparison = a.currentQuantity - b.currentQuantity;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="button-secondary flex items-center"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
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
        </div>

        {isInventoryFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Inventory</h2>
              <form onSubmit={handleInventorySubmit} className="space-y-4">
                <div>
                  <label className="label">Inventory Name *</label>
                  <input
                    type="text"
                    value={inventoryFormData.name}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Store Name *</label>
                  <select
                    value={inventoryFormData.storeName}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, storeName: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={inventoryFormData.date}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, date: e.target.value })}
                    className="input-field"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={inventoryFormData.description}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Create Inventory
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedInventory && (
          <>
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-2">{selectedInventory.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Store: {selectedInventory.storeName} | Date: {new Date(selectedInventory.date).toLocaleDateString()}
              </p>
            </div>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => toggleSort('name')}
                  className="button-secondary flex items-center"
                >
                  Sort by Name
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
                  )}
                </button>
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
            </div>

            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">({product.category})</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.location}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Unit:</span>
                          <span className="text-sm font-medium">{product.unit}</span>
                        </div>
                        {product.unit === 'cx' && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Quantity per Box:</span>
                            <span className="text-sm font-medium">{product.quantityPerBox} {product.boxUnit}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Current Quantity:</span>
                          <span className="text-sm font-medium">
                            {product.currentQuantity} {product.unit === 'cx' ? (product.boxUnit || 'unidade') : product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <button
                        onClick={() => {
                          const quantity = prompt('Enter quantity to add:');
                          if (quantity) {
                            handleAddProductToInventory(product, Number(quantity));
                          }
                        }}
                        className="button-primary flex items-center"
                      >
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        Add to Inventory
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
