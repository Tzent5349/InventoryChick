import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

if (!process.env.MONGODB_URI || !process.env.MONGODB_PASSWORD) {
  throw new Error('Please define the MONGODB_URI and MONGODB_PASSWORD environment variables inside .env');
}

const MONGODB_URI = process.env.MONGODB_URI.replace('${MONGODB_PASSWORD}', process.env.MONGODB_PASSWORD);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<mongoose.Connection> {
  try {
    if (cached.conn) {
      console.log('Using cached MongoDB connection');
      return cached.conn;
    }

    if (!cached.promise) {
      console.log('Creating new MongoDB connection...');
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose.connection;
      });
    }

    try {
      cached.conn = await cached.promise;
      console.log('MongoDB connection established');
    } catch (e) {
      console.error('Error establishing MongoDB connection:', {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
        error: e
      });
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  } catch (error) {
    console.error('connectDB error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    throw error;
  }
}

export default connectDB; 