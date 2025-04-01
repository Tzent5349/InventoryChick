import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Inventory from '@/app/models/Inventory';

export async function GET(
  request: Request,
  context: any
) {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    const { id } = context.params;
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