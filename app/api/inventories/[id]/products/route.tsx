import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Inventory from '@/app/models/Inventory';
import { Product } from '@/app/models/Product';

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    await connectDB();
    const { productId, quantity, notes } = await request.json();
    const inventoryId = context.params.id;

    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    // Find the product and update its quantityHistory
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product already exists in inventory
    const existingProductIndex = inventory.products.findIndex(
      (p: any) => p.productId.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // Update existing product quantity and notes
      inventory.products[existingProductIndex].quantity += quantity;
      if (notes) {
        inventory.products[existingProductIndex].notes = notes;
      }
    } else {
      // Add new product to inventory
      inventory.products.push({
        productId,
        quantity,
        notes
      });
    }

    // Update product's currentQuantity and quantityHistory
    product.currentQuantity += quantity;

    const existingHistoryIndex = product.quantityHistory.findIndex(
      (h: any) => h.storeName === inventory.storeName && 
                h.date.getTime() === inventory.date.getTime()
    );

    if (existingHistoryIndex !== -1) {
      product.quantityHistory[existingHistoryIndex].quantity += quantity;
    } else {
      product.quantityHistory.push({
        storeName: inventory.storeName,
        date: inventory.date,
        quantity: quantity
      });
    }

    // Save both inventory and product
    await Promise.all([inventory.save(), product.save()]);
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error adding product to inventory:', error);
    return NextResponse.json(
      { error: 'Failed to add product to inventory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.findById(context.params.id);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    inventory.products = inventory.products.filter(
      (product: any) => product.productId.toString() !== productId
    );

    await inventory.save();
    return NextResponse.json({ message: 'Product removed from inventory successfully' });
  } catch (error) {
    console.error('DELETE /api/inventories/[id]/products error:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from inventory' },
      { status: 500 }
    );
  }
} 