import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Inventory from '../../../../models/Inventory';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const data = await request.json();
    
    if (!data.productId || !data.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.findById(params.id);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    // Check if product already exists in inventory
    const existingProductIndex = inventory.products.findIndex(
      (p) => p.productId.toString() === data.productId
    );

    if (existingProductIndex >= 0) {
      // Update existing product
      inventory.products[existingProductIndex] = {
        productId: data.productId,
        quantity: data.quantity,
        notes: data.notes,
      };
    } else {
      // Add new product
      inventory.products.push({
        productId: data.productId,
        quantity: data.quantity,
        notes: data.notes,
      });
    }

    await inventory.save();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('POST /api/inventories/[id]/products error:', error);
    return NextResponse.json(
      { error: 'Failed to add product to inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    await connectDB();
    const inventory = await Inventory.findById(params.id);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    inventory.products = inventory.products.filter(
      (p) => p.productId.toString() !== params.productId
    );

    await inventory.save();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('DELETE /api/inventories/[id]/products error:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 