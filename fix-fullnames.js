// Script to fix missing fullName fields in existing users
const { MongoClient } = require('mongodb');

async function fixFullNames() {
  const uri = 'mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('opd_wallet');
    const users = db.collection('users');

    // Find all users where fullName is missing but firstName and lastName exist
    const usersToFix = await users.find({
      'name.firstName': { $exists: true },
      'name.lastName': { $exists: true },
      'name.fullName': { $exists: false }
    }).toArray();

    console.log(`Found ${usersToFix.length} users to fix`);

    for (const user of usersToFix) {
      const fullName = `${user.name.firstName} ${user.name.lastName}`;
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            'name.fullName': fullName
          }
        }
      );
      console.log(`Fixed: ${user.email} -> ${fullName}`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixFullNames();