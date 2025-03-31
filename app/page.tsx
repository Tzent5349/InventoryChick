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

type SortField = 'name' | 'category' | 'location' | 'quantity';
type SortOrder = 'asc' | 'desc';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuantityFormOpen, setIsQuantityFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [stores, setStores] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    unit: 'unidade',
    quantityPerBox: 0,
    boxUnit: 'unidade',
    category: '',
    location: '',
    storeName: '',
  });
  const [quantityData, setQuantityData] = useState({
    quantity: 0,
  });
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    boxes: 0,
    units: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Extract unique categories and stores from products
    const uniqueCategories = Array.from(new Set(products.map(product => product.category)));
    const uniqueStores = Array.from(new Set(products.map(product => product.storeName || 'Uncategorized')));
    setCategories(uniqueCategories);
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

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct._id, ...formData }),
        });
        toast.success('Product updated successfully');
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Product added successfully');
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', unit: 'unidade', quantityPerBox: 0, boxUnit: 'unidade', category: '', location: '', storeName: '' });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleQuantitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const newQuantity = selectedProduct.currentQuantity + quantityData.quantity;
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct._id,
          currentQuantity: newQuantity,
        }),
      });
      toast.success('Quantity updated successfully');
      setIsQuantityFormOpen(false);
      setSelectedProduct(null);
      setQuantityData({ quantity: 0 });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit,
      quantityPerBox: product.quantityPerBox || 0,
      boxUnit: product.boxUnit || 'unidade',
      category: product.category,
      location: product.location,
      storeName: product.storeName || '',
    });
    setIsFormOpen(true);
  };

  const handleAddQuantity = (product: Product) => {
    setSelectedProduct(product);
    setIsQuantityFormOpen(true);
  };

  const handleQuickAdd = async (product: Product) => {
    setSelectedProduct(product);
    setIsQuickAddOpen(true);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      let totalQuantity = 0;
      
      if (selectedProduct.unit === 'cx' && selectedProduct.quantityPerBox) {
        // If it's a box product, calculate total units
        totalQuantity = (quickAddData.boxes * selectedProduct.quantityPerBox) + quickAddData.units;
      } else {
        // If it's a unit product, just add the units
        totalQuantity = quickAddData.units;
      }

      const newQuantity = selectedProduct.currentQuantity + totalQuantity;
      
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct._id,
          currentQuantity: newQuantity,
        }),
      });

      toast.success('Quantity updated successfully');
      setIsQuickAddOpen(false);
      setSelectedProduct(null);
      setQuickAddData({ boxes: 0, units: 0 });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update quantity');
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
    .filter(product => selectedCategory === 'all' || product.category === selectedCategory)
    .filter(product => selectedStore === 'all' || product.storeName === selectedStore)
    .filter(product => {
      if (!product.lastUpdated) return true;
      const productMonth = new Date(product.lastUpdated).toISOString().slice(0, 7);
      return productMonth === selectedMonth;
    })
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
            <button
              onClick={() => setIsFormOpen(true)}
              className="button-primary flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Product
            </button>
          </div>
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="all">All Stores</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field max-w-xs"
            />
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStore('all');
                setSelectedMonth(new Date().toISOString().slice(0, 7));
                setSearchQuery('');
                setSortField('name');
                setSortOrder('asc');
              }}
              className="button-secondary flex items-center"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Clear Filters
            </button>
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

        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field flex-1"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category"
                        className="input-field w-32"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="button-secondary whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      unit: e.target.value as Product['unit'],
                      quantityPerBox: 0,
                      boxUnit: 'unidade'
                    })}
                    className="input-field"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="cx">Caixa (CX)</option>
                    <option value="kg">Kilograma (KG)</option>
                    <option value="l">Litro (L)</option>
                    <option value="barril">Barril</option>
                  </select>
                </div>
                {formData.unit === 'cx' && (
                  <>
                    <div>
                      <label className="label">Box Unit</label>
                      <select
                        value={formData.boxUnit}
                        onChange={(e) => setFormData({ ...formData, boxUnit: e.target.value || 'unidade' })}
                        className="input-field"
                      >
                        <option value="unidade">Unidade</option>
                        <option value="kg">Kilograma (KG)</option>
                        <option value="l">Litro (L)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Quantity per Box</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantityPerBox || ''}
                        onChange={(e) => setFormData({ ...formData, quantityPerBox: Number(e.target.value) || 0 })}
                        className="input-field"
                        placeholder={`Enter quantity per box in ${formData.boxUnit}`}
                        step={formData.boxUnit === 'l' ? "0.01" : "1"}
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingProduct(null);
                      setFormData({ name: '', unit: 'unidade', quantityPerBox: 0, boxUnit: 'unidade', category: '', location: '', storeName: '' });
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    {editingProduct ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isQuantityFormOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Update Quantity</h2>
              <div className="mb-4">
                <p className="text-sm">Product: {selectedProduct.name}</p>
                <p className="text-sm">Current Quantity: {selectedProduct.currentQuantity}</p>
                <p className="text-sm">Unit: {selectedProduct.unit}</p>
              </div>
              <form onSubmit={handleQuantitySubmit} className="space-y-4">
                <div>
                  <label className="label">Add Quantity</label>
                  <input
                    type="number"
                    value={quantityData.quantity || ''}
                    onChange={(e) => setQuantityData({ quantity: Number(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="Enter quantity to add"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuantityFormOpen(false);
                      setSelectedProduct(null);
                      setQuantityData({ quantity: 0 });
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isQuickAddOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Quick Add Quantity</h2>
              <div className="mb-4">
                <p className="text-sm">Product: {selectedProduct.name}</p>
                <p className="text-sm">Current Quantity: {selectedProduct.currentQuantity}</p>
                <p className="text-sm">Unit: {selectedProduct.unit}</p>
                {selectedProduct.unit === 'cx' && selectedProduct.quantityPerBox && (
                  <p className="text-sm">Quantity per Box: {selectedProduct.quantityPerBox} {selectedProduct.boxUnit}</p>
                )}
              </div>
              <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                {selectedProduct.unit === 'cx' && selectedProduct.quantityPerBox && (
                  <div>
                    <label className="label">Boxes</label>
                    <input
                      type="number"
                      min="0"
                      value={quickAddData.boxes || ''}
                      onChange={(e) => setQuickAddData({ ...quickAddData, boxes: Number(e.target.value) || 0 })}
                      className="input-field"
                      placeholder={`Enter number of boxes (${selectedProduct.quantityPerBox} ${selectedProduct.boxUnit} each)`}
                    />
                  </div>
                )}
                <div>
                  <label className="label">
                    {selectedProduct.unit === 'cx' ? `Additional ${selectedProduct.boxUnit}` : selectedProduct.unit}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quickAddData.units || ''}
                    onChange={(e) => setQuickAddData({ ...quickAddData, units: Number(e.target.value) || 0 })}
                    className="input-field"
                    placeholder={`Enter additional ${selectedProduct.unit === 'cx' ? selectedProduct.boxUnit : selectedProduct.unit}`}
                  />
                </div>
                {selectedProduct.unit === 'cx' && selectedProduct.quantityPerBox && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total {selectedProduct.boxUnit} to add: {(quickAddData.boxes * selectedProduct.quantityPerBox) + quickAddData.units}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAddOpen(false);
                      setSelectedProduct(null);
                      setQuickAddData({ boxes: 0, units: 0 });
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleQuickAdd(product)}
                      className="button-primary flex items-center"
                    >
                      <PlusCircleIcon className="w-5 h-5 mr-2" />
                      Quick Add
                    </button>
                    <button
                      onClick={() => handleAddQuantity(product)}
                      className="button-secondary flex items-center"
                    >
                      <PlusCircleIcon className="w-5 h-5 mr-2" />
                      Add Units
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
    </main>
  );
}
