import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in .env file");
  }
  try {
    // Get URI from environment
    
    
    console.log('🔌 Connecting to MongoDB...');
    
    // SIMPLEST CONNECTION - no options at all
    await mongoose.connect(uri);
    
    console.log(`✅ MongoDB Connected!`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
  } catch (error) {
    console.error(`❌ MongoDB connection failed:`);
    console.error(`Error: ${error.message}`);
    
    // Check for common issues
    if (error.message.includes('usenewurlparser')) {
      console.error('\n⚠️  Found deprecated options in your code!');
      console.error('Make sure you are NOT using:');
      console.error('  - useNewUrlParser');
      console.error('  - useUnifiedTopology');
      console.error('These are deprecated in Mongoose v6+');
    }
    
    process.exit(1);
  }
};

export default connectDB;