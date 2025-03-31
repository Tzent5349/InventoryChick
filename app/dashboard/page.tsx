'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, PlusCircleIcon, SunIcon, MoonIcon, MagnifyingGlassIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTheme } from '../components/ThemeProvider';
import Link from 'next/link';

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

type SortField = 'store' | 'date' | 'name';
type SortOrder = 'asc' | 'desc';

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [productSortField, setProductSortField] = useState<'name' | 'category' | 'location'>('name');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [quickAddData, setQuickAddData] = useState<Record<string, { boxes: number | string; units: number | string }>>({});

  useEffect(() => {
    fetchInventories();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Extract unique stores from inventories
    const inventoryStores = Array.from(new Set(inventories.map(inventory => inventory.storeName)));
    setStores(inventoryStores);
  }, [inventories]);

  const fetchInventories = async () => {
    try {
      const response = await fetch('/api/inventories');
      const data = await response.json();
      setInventories(data);
    } catch (error) {
      toast.error('Failed to fetch inventories');
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

  const handleDeleteInventory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory?')) return;

    try {
      const response = await fetch(`/api/inventories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete inventory');

      toast.success('Inventory deleted successfully');
      fetchInventories();
    } catch (error) {
      toast.error('Failed to delete inventory');
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

  const filteredInventories = inventories
    .filter(inventory => {
      const matchesSearch = inventory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inventory.storeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStore = !selectedStore || inventory.storeName === selectedStore;
      return matchesSearch && matchesStore;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'store':
          comparison = a.storeName.localeCompare(b.storeName);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Group inventories by store
  const groupedInventories = filteredInventories.reduce((acc, inventory) => {
    if (!acc[inventory.storeName]) {
      acc[inventory.storeName] = [];
    }
    acc[inventory.storeName].push(inventory);
    return acc;
  }, {} as Record<string, Inventory[]>);

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
      fetchInventories();
      // Refresh the selected inventory to update the current quantity
      const updatedResponse = await fetch(`/api/inventories/${selectedInventory._id}`);
      const updatedInventory = await updatedResponse.json();
      setSelectedInventory(updatedInventory);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product in inventory');
    }
  };

  const handleEditQuantity = (product: Product, currentQuantity: number) => {
    if (product.unit === 'cx') {
      const boxes = Math.floor(currentQuantity / (product.quantityPerBox || 1));
      const units = currentQuantity % (product.quantityPerBox || 1);
      setQuickAddData(prev => ({
        ...prev,
        [product._id]: { boxes, units }
      }));
    } else if (product.unit === 'packet') {
      const boxes = Math.floor(currentQuantity / (product.packetQuantity || 1));
      const units = currentQuantity % (product.packetQuantity || 1);
      setQuickAddData(prev => ({
        ...prev,
        [product._id]: { boxes, units }
      }));
    } else {
      setQuickAddData(prev => ({
        ...prev,
        [product._id]: { boxes: 0, units: currentQuantity }
      }));
    }
  };

  const handleEditSave = async (product: Product) => {
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
      const response = await fetch(`/api/inventories/${selectedInventory._id}/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity: totalUnits,
          notes: `${product.unit === 'cx' ? 'Updated' : product.unit === 'packet' ? 'Updated' : 'Updated'} ${typeof productData.boxes === 'number' ? productData.boxes : 0} ${product.unit === 'cx' ? 'boxes' : product.unit === 'packet' ? 'packets' : ''} and ${typeof productData.units === 'number' ? productData.units : 0} units`,
          action: 'replace'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      toast.success('Product quantity updated successfully');
      setQuickAddData(prev => {
        const newData = { ...prev };
        delete newData[product._id];
        return newData;
      });
      fetchInventories();
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
      switch (productSortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        default:
          comparison = 0;
      }
      return productSortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="button-secondary flex items-center"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Manage Products
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

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="input-field"
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
            <button
              onClick={() => toggleSort('store')}
              className="button-secondary flex items-center"
            >
              Sort by Store
              {sortField === 'store' && (
                sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
              )}
            </button>
            <button
              onClick={() => toggleSort('date')}
              className="button-secondary flex items-center"
            >
              Sort by Date
              {sortField === 'date' && (
                sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
              )}
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
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedInventories).map(([store, storeInventories]) => (
            <div key={store} className="card">
              <h2 className="text-xl font-semibold mb-4">{store}</h2>
              <div className="space-y-4">
                {storeInventories.map((inventory) => (
                  <div key={inventory._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{inventory.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Date: {new Date(inventory.date).toLocaleDateString()}
                        </p>
                        {inventory.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {inventory.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1">Products:</h4>
                          <ul className="space-y-1">
                            {inventory.products.map((item, index) => (
                              <li key={`${item.productId._id}-${index}`} className="text-sm">
                                {item.productId.name} - {item.quantity} {item.productId.unit === 'cx' ? (item.productId.boxUnit || 'unidade') : item.productId.unit === 'packet' ? (item.productId.packetUnit || 'unidade') : item.productId.unit}
                                {item.notes && <span className="text-gray-500 dark:text-gray-400"> ({item.notes})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            setSelectedInventory(inventory);
                            setIsViewModalOpen(true);
                          }}
                          className="button-secondary flex items-center"
                        >
                          <ChartBarIcon className="w-5 h-5 mr-2" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInventory(inventory);
                            setIsQuickAddModalOpen(true);
                            fetchProducts();
                          }}
                          className="button-secondary flex items-center"
                        >
                          <PencilIcon className="w-5 h-5 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(inventory._id)}
                          className="button-danger flex items-center"
                        >
                          <TrashIcon className="w-5 h-5 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isQuickAddModalOpen && selectedInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Products to {selectedInventory.name}</h2>
              <button
                onClick={() => {
                  setIsQuickAddModalOpen(false);
                  setSelectedInventory(null);
                  setQuickAddData({});
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (productSortField === 'name') {
                      setProductSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setProductSortField('name');
                      setProductSortOrder('asc');
                    }
                  }}
                  className="button-secondary flex items-center"
                >
                  Sort by Name
                  {productSortField === 'name' && (
                    productSortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (productSortField === 'category') {
                      setProductSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setProductSortField('category');
                      setProductSortOrder('asc');
                    }
                  }}
                  className="button-secondary flex items-center"
                >
                  Sort by Category
                  {productSortField === 'category' && (
                    productSortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (productSortField === 'location') {
                      setProductSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setProductSortField('location');
                      setProductSortOrder('asc');
                    }
                  }}
                  className="button-secondary flex items-center"
                >
                  Sort by Location
                  {productSortField === 'location' && (
                    productSortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4 ml-1" /> : <ArrowDownIcon className="w-4 h-4 ml-1" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {selectedInventory.products.find(p => p.productId._id === product._id)?.quantity || 0} {product.unit === 'cx' ? (product.boxUnit || 'unidade') : product.unit === 'packet' ? (product.packetUnit || 'unidade') : product.unit}
                            </span>
                            <button
                              onClick={() => handleEditQuantity(product, selectedInventory.products.find(p => p.productId._id === product._id)?.quantity || 0)}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuickAdd(product)}
                          className="button-primary flex items-center"
                        >
                          <PlusCircleIcon className="w-5 h-5 mr-2" />
                          Add
                        </button>
                        <button
                          onClick={() => handleEditSave(product)}
                          className="button-secondary flex items-center"
                        >
                          <PencilIcon className="w-5 h-5 mr-2" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">View Products in {selectedInventory.name}</h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedInventory(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedInventory.products
                .filter(item => 
                  item.productId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.productId.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.productId.location.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <div key={`${item.productId._id}-${index}`} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-semibold">{item.productId.name}</h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">({item.productId.category})</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.productId.location}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Unit:</span>
                            <span className="text-sm font-medium">{item.productId.unit}</span>
                          </div>
                          {item.productId.unit === 'cx' && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Quantity per Box:</span>
                              <span className="text-sm font-medium">{item.productId.quantityPerBox} {item.productId.boxUnit}</span>
                            </div>
                          )}
                          {item.productId.unit === 'packet' && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Quantity per Packet:</span>
                              <span className="text-sm font-medium">{item.productId.packetQuantity} {item.productId.packetUnit}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Quantity:</span>
                            <span className="text-sm font-medium">
                              {item.quantity} {item.productId.unit === 'cx' ? (item.productId.boxUnit || 'unidade') : item.productId.unit === 'packet' ? (item.productId.packetUnit || 'unidade') : item.productId.unit}
                            </span>
                          </div>
                          {item.notes && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Notes:</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{item.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 