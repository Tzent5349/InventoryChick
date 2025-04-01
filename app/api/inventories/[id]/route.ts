import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Inventory from '@/app/models/Inventory';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Await params before using them
    const { id } = await params;
    console.log('Connected to MongoDB, fetching inventory with ID:', id);
    
    const inventory = await Inventory.findById(id).populate('products.productId');
    console.log('Inventory found:', inventory ? 'Yes' : 'No');
    
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const inventory = await Inventory.findByIdAndDelete(params.id);
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/inventories/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 