import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';

async function cleanupMasters() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Clean up any null code entries in category_master
    const categoryCollection = db.collection('category_master');
    const result = await categoryCollection.deleteMany({ code: null });
    console.log(`Deleted ${result.deletedCount} documents with null code from category_master`);

    // Drop the problematic unique index
    try {
      await categoryCollection.dropIndex('code_1');
      console.log('Dropped code_1 index from category_master');
    } catch (error) {
      console.log('Index code_1 may not exist:', error.message);
    }

    console.log('Cleanup completed successfully!');

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the cleanup script
cleanupMasters().catch(console.error);