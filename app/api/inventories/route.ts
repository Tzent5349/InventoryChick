import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Inventory from '../../../models/Inventory';

export async function GET() {
  try {
    await connectDB();
    const inventories = await Inventory.find({})
      .sort({ date: -1 })
      .populate('products.productId');
    return NextResponse.json(inventories);
  } catch (error) {
    console.error('GET /api/inventories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    if (!data.name || !data.date) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'Name and date are required' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.create(data);
    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventories error:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.findByIdAndUpdate(id, updateData, { new: true });
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('PUT /api/inventories error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const inventory = await Inventory.findByIdAndDelete(id);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/inventories error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 