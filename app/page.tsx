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
  unit: 'cx' | 'unidade' | 'kg' | 'l' | 'barril' | 'packet';
  quantityPerBox?: number;
  boxUnit?: 'unidade' | 'kg' | 'l';
  packetQuantity?: number;
  packetUnit?: 'unidade' | 'kg' | 'l';
  currentQuantity: number;
  category: string;
  location: string;
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

interface QuickAddData {
  [key: string]: {
    boxes: number | string;
    units: number | string;
  };
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    storeName: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });
  const [stores, setStores] = useState<string[]>([]);
  const [isNewStoreInput, setIsNewStoreInput] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    unit: 'unidade' as Product['unit'],
    quantityPerBox: 0,
    boxUnit: 'unidade' as Product['boxUnit'],
    packetQuantity: 0,
    packetUnit: 'unidade' as Product['packetUnit'],
    category: '',
    location: '',
  });
  const [quickAddData, setQuickAddData] = useState<QuickAddData>({});

  useEffect(() => {
    fetchProducts();
    fetchInventories();
  }, []);

  useEffect(() => {
    // Extract unique stores from inventories
    const inventoryStores = Array.from(new Set(inventories.map(inventory => inventory.storeName)));
    setStores(inventoryStores);
  }, [inventories]);

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
    if (!inventoryFormData.storeName.trim()) {
      toast.error('Please select or create a store');
      return;
    }
    try {
      const response = await fetch('/api/inventories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryFormData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create inventory');
      }
      const data = await response.json();
      setSelectedInventory(data);
      setIsInventoryFormOpen(false);
      toast.success('Inventory created successfully');
      fetchInventories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create inventory');
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

  const handleNewStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStoreName.trim()) {
      setStores(prev => [...prev, newStoreName.trim()]);
      setInventoryFormData(prev => ({ ...prev, storeName: newStoreName.trim() }));
      setIsNewStoreInput(false);
      setNewStoreName('');
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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct 
        ? `/api/products?id=${editingProduct._id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save product');
      }

      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setIsProductFormOpen(false);
      setEditingProduct(null);
      setProductFormData({
        name: '',
        unit: 'unidade',
        quantityPerBox: 0,
        boxUnit: 'unidade',
        packetQuantity: 0,
        packetUnit: 'unidade',
        category: '',
        location: '',
      });
      fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      unit: product.unit,
      quantityPerBox: product.quantityPerBox || 0,
      boxUnit: product.boxUnit || 'unidade',
      packetQuantity: product.packetQuantity || 0,
      packetUnit: product.packetUnit || 'unidade',
      category: product.category,
      location: product.location,
    });
    setIsProductFormOpen(true);
  };

  const handleInputChange = (productId: string, field: 'boxes' | 'units', value: string) => {
    const numValue = value === '' ? '' : parseFloat(value);
    setQuickAddData(prev => {
      const newData = { ...prev };
      if (!newData[productId]) {
        newData[productId] = { boxes: '', units: '' };
      }
      newData[productId] = {
        ...newData[productId],
        [field]: numValue
      };
      return newData;
    });
  };

  const handleQuickAdd = async (product: Product) => {
    if (!selectedInventory) return;

    const productData = quickAddData[product._id] || { boxes: '', units: '' };
    let totalUnits = 0;
    
    if (product.unit === 'cx') {
      const boxes = typeof productData.boxes === 'number' ? productData.boxes : 0;
      const units = typeof productData.units === 'number' ? productData.units : 0;
      totalUnits = (boxes * (product.quantityPerBox || 0)) + units;
    } else if (product.unit === 'packet') {
      const packets = typeof productData.boxes === 'number' ? productData.boxes : 0;
      const additionalUnits = typeof productData.units === 'number' ? productData.units : 0;
      totalUnits = (packets * (product.packetQuantity || 0)) + additionalUnits;
    } else {
      totalUnits = typeof productData.units === 'number' ? productData.units : 0;
    }

    if (totalUnits < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    try {
      const existingProduct = selectedInventory.products.find(p => p.productId._id === product._id);
      const method = existingProduct ? 'PUT' : 'POST';
      const url = existingProduct 
        ? `/api/inventories/${selectedInventory._id}/products/${product._id}`
        : `/api/inventories/${selectedInventory._id}/products`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity: totalUnits,
          notes: `${product.unit === 'cx' ? 'Added' : product.unit === 'packet' ? 'Added' : 'Added'} ${typeof productData.boxes === 'number' ? productData.boxes : 0} ${product.unit === 'cx' ? 'boxes' : product.unit === 'packet' ? 'packets' : ''} and ${typeof productData.units === 'number' ? productData.units : 0} units`,
          action: 'add'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      toast.success('Product added successfully');
      // Only clear the data for this specific product
      setQuickAddData(prev => {
        const newData = { ...prev };
        delete newData[product._id];
        return newData;
      });
      
      // Refresh both inventories and products data
      await Promise.all([
        fetchInventories(),
        fetchProducts()
      ]);
      
      // Refresh the selected inventory to update the current quantity
      const updatedResponse = await fetch(`/api/inventories/${selectedInventory._id}`);
      const updatedInventory = await updatedResponse.json();
      setSelectedInventory(updatedInventory);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product in inventory');
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
              onClick={() => setIsInventoryFormOpen(true)}
              className="button-primary flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Inventory
            </button>
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
                  {isNewStoreInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter new store name"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleNewStoreSubmit}
                        className="button-primary"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNewStoreInput(false)}
                        className="button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={inventoryFormData.storeName}
                        onChange={(e) => setInventoryFormData({ ...inventoryFormData, storeName: e.target.value })}
                        className="input-field flex-1"
                        required
                      >
                        <option value="">Select a store</option>
                        {stores.map((store) => (
                          <option key={store} value={store}>
                            {store}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsNewStoreInput(true)}
                        className="button-secondary"
                      >
                        New Store
                      </button>
                    </div>
                  )}
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
                        {product.unit === 'packet' && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Quantity per Packet:</span>
                            <span className="text-sm font-medium">{product.packetQuantity} {product.packetUnit}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Current Quantity:</span>
                          <span className="text-sm font-medium">
                            {product.currentQuantity} {product.unit === 'cx' ? (product.boxUnit || 'unidade') : product.unit === 'packet' ? (product.packetUnit || 'unidade') : product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="button-secondary flex items-center"
                      >
                        <PencilIcon className="w-5 h-5 mr-2" />
                        Edit
                      </button>
                      {selectedInventory && (
                        <div className="flex items-center space-x-2">
                          {(product.unit === 'cx' || product.unit === 'packet') && (
                            <>
                              <input
                                type="number"
                                value={quickAddData[product._id]?.boxes?.toString() ?? ''}
                                onChange={(e) => handleInputChange(product._id, 'boxes', e.target.value)}
                                className="input-field w-20"
                                min="0"
                                step="0.01"
                                placeholder={product.unit === 'cx' ? "Boxes" : "Packets"}
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">{product.unit === 'cx' ? "boxes" : "packets"}</span>
                            </>
                          )}
                          <input
                            type="number"
                            value={quickAddData[product._id]?.units?.toString() ?? ''}
                            onChange={(e) => handleInputChange(product._id, 'units', e.target.value)}
                            className="input-field w-20"
                            min="0"
                            step="0.01"
                            placeholder="Units"
                          />
                          <button
                            onClick={() => handleQuickAdd(product)}
                            className="button-primary flex items-center"
                          >
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Quick Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {isProductFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="label">Product Name *</label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Unit *</label>
                  <select
                    value={productFormData.unit}
                    onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value as Product['unit'] })}
                    className="input-field"
                    required
                  >
                    <option value="unidade">Unit</option>
                    <option value="cx">Box</option>
                    <option value="packet">Packet</option>
                    <option value="kg">Kilogram</option>
                    <option value="l">Liter</option>
                    <option value="barril">Barrel</option>
                  </select>
                </div>
                {productFormData.unit === 'cx' && (
                  <>
                    <div>
                      <label className="label">Quantity per Box</label>
                      <input
                        type="number"
                        value={productFormData.quantityPerBox}
                        onChange={(e) => setProductFormData({ ...productFormData, quantityPerBox: parseFloat(e.target.value) })}
                        className="input-field"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="label">Box Unit</label>
                      <select
                        value={productFormData.boxUnit}
                        onChange={(e) => setProductFormData({ ...productFormData, boxUnit: e.target.value as Product['boxUnit'] })}
                        className="input-field"
                      >
                        <option value="unidade">Unit</option>
                        <option value="kg">Kilogram</option>
                        <option value="l">Liter</option>
                      </select>
                    </div>
                  </>
                )}
                {productFormData.unit === 'packet' && (
                  <>
                    <div>
                      <label className="label">Quantity per Packet</label>
                      <input
                        type="number"
                        value={productFormData.packetQuantity}
                        onChange={(e) => setProductFormData({ ...productFormData, packetQuantity: parseFloat(e.target.value) })}
                        className="input-field"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="label">Packet Unit</label>
                      <select
                        value={productFormData.packetUnit}
                        onChange={(e) => setProductFormData({ ...productFormData, packetUnit: e.target.value as Product['packetUnit'] })}
                        className="input-field"
                      >
                        <option value="unidade">Unit</option>
                        <option value="kg">Kilogram</option>
                        <option value="l">Liter</option>
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="label">Category *</label>
                  <input
                    type="text"
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input
                    type="text"
                    value={productFormData.location}
                    onChange={(e) => setProductFormData({ ...productFormData, location: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductFormOpen(false);
                      setEditingProduct(null);
                      setProductFormData({
                        name: '',
                        unit: 'unidade',
                        quantityPerBox: 0,
                        boxUnit: 'unidade',
                        packetQuantity: 0,
                        packetUnit: 'unidade',
                        category: '',
                        location: '',
                      });
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
