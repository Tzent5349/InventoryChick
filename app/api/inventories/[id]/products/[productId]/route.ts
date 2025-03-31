import Inventory from '@/app/models/Inventory';
import connectDB from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { Product } from '@/app/models/Product';
import { NextRequest } from 'next/server';

interface InventoryProduct {
  productId: {
    toString: () => string;
  };
  quantity: number;
  notes?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    await connectDB();
    const { quantity, notes, action } = await request.json();
    const { id, productId } = params;

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    const productIndex = inventory.products.findIndex(
      (p: InventoryProduct) => p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return NextResponse.json(
        { error: 'Product not found in inventory' },
        { status: 404 }
      );
    }

    // Find the product to update its current quantity
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If action is 'replace', replace the quantity, otherwise add to it
    if (action === 'replace') {
      // Calculate the difference to update product's current quantity
      const oldQuantity = inventory.products[productIndex].quantity;
      const difference = quantity - oldQuantity;
      product.currentQuantity += difference;
      inventory.products[productIndex].quantity = quantity;
    } else {
      // Add to current quantity
      product.currentQuantity += quantity;
      inventory.products[productIndex].quantity += quantity;
    }
    
    inventory.products[productIndex].notes = notes;

    // Save both product and inventory
    await Promise.all([
      product.save(),
      inventory.save()
    ]);

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error updating product in inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update product in inventory' },
      { status: 500 }
    );
  }
} 