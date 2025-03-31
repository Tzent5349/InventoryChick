'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, SunIcon, MoonIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../components/ThemeProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import React from 'react';

interface Inventory {
  _id: string;
  name: string;
  date: string;
  description?: string;
  products: {
    productId: {
      _id: string;
      name: string;
      unit: string;
    };
    quantity: number;
    notes?: string;
  }[];
  createdAt: string;
}

export default function Inventories() {
  const { theme, toggleTheme } = useTheme();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      const response = await fetch('/api/inventories');
      const data = await response.json();
      setInventories(data);
    } catch (error) {
      toast.error('Failed to fetch inventories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/inventories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      toast.success('Inventory created successfully');
      setIsFormOpen(false);
      setFormData({ name: '', date: new Date().toISOString().slice(0, 10), description: '' });
      fetchInventories();
    } catch (error) {
      toast.error('Failed to create inventory');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this inventory?')) {
      try {
        await fetch(`/api/inventories?id=${id}`, { method: 'DELETE' });
        toast.success('Inventory deleted successfully');
        fetchInventories();
      } catch (error) {
        toast.error('Failed to delete inventory');
      }
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventories</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="button-secondary flex items-center"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Home
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
              New Inventory
            </button>
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Inventory</h2>
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
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormData({ name: '', date: new Date().toISOString().slice(0, 10), description: '' });
                    }}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventories.map((inventory) => (
            <div key={inventory._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{inventory.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Date: {new Date(inventory.date).toLocaleDateString()}
                  </p>
                  {inventory.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {inventory.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Products: {inventory.products.length}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/inventories/${inventory._id}`}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(inventory._id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 