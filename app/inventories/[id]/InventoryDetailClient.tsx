'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, SunIcon, MoonIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../components/ThemeProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import React from 'react';

interface Product {
  _id: string;
  name: string;
  unit: string;
  category: string;
  location: string;
}

interface InventoryProduct {
  productId: Product;
  quantity: number;
  notes?: string;
}

interface Inventory {
  _id: string;
  name: string;
  storeName: string;
  date: string;
  description?: string;
  products: InventoryProduct[];
  createdAt: string;
}

interface InventoryDetailClientProps {
  id: string;
}

export default function InventoryDetailClient({ id }: InventoryDetailClientProps) {
  const { theme, toggleTheme } = useTheme();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, [id]);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/inventories/${id}`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    try {
      const response = await fetch(`/api/inventories/${id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to add product');

      toast.success('Product added successfully');
      setIsFormOpen(false);
      setSelectedProduct('');
      setQuantity(0);
      setNotes('');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product?')) return;

    try {
      const response = await fetch(`/api/inventories/${id}/products?productId=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove product');

      toast.success('Product removed successfully');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to remove product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!inventory) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="button-secondary flex items-center"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back
            </Link>
            <h1 className="text-3xl font-bold">{inventory.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
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

        <div className="card mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{inventory.storeName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Date: {new Date(inventory.date).toLocaleDateString()}
              </p>
              {inventory.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {inventory.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="button-primary flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add Product to Inventory</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="label">Search Products</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    placeholder="Search by name, category, or location"
                  />
                </div>
                <div>
                  <label className="label">Select Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select a product</option>
                    {filteredProducts.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} ({product.category}) - {product.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="input-field"
                    required
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {inventory.products.map((item) => (
            <div key={item.productId._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{item.productId.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.productId.category} - {item.productId.location}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-medium">
                      Quantity: {item.quantity} {item.productId.unit}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Notes: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProduct(item.productId._id)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 