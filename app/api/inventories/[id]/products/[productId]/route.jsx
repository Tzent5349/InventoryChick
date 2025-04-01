import Inventory from '@/app/models/Inventory';
import connectDB from '@/lib/mongodb';
import { NextResponse, NextRequest } from 'next/server';
import { Product } from '@/app/models/Product';

export async function PUT(request, context) {
  try {
    await connectDB();

    const { quantity, notes, action } = await request.json();
    const { id, productId } = context.params;

    if (quantity < 0) {
      return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 });
    }

    // Add validation for notes
    if (notes && typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes must be a string' }, { status: 400 });
    }

    if (notes && notes.length > 500) {
      return NextResponse.json({ error: 'Notes cannot exceed 500 characters' }, { status: 400 });
    }

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    const productIndex = inventory.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found in inventory' }, { status: 404 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (action === 'replace') {
      const oldQuantity = inventory.products[productIndex].quantity;
      const difference = quantity - oldQuantity;
      product.currentQuantity += difference;
      inventory.products[productIndex].quantity = quantity;
    } else {
      product.currentQuantity += quantity;
      inventory.products[productIndex].quantity += quantity;
    }

    if (notes !== undefined) {
      inventory.products[productIndex].notes = notes;
    }

    await Promise.all([product.save(), inventory.save()]);

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error updating product in inventory:', error);
    return NextResponse.json({ error: 'Failed to update product in inventory' }, { status: 500 });
  }
} 