const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

async function addBloodGroupToUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find all users without bloodGroup field
    const usersWithoutBloodGroup = await usersCollection.find({
      bloodGroup: { $exists: false }
    }).toArray();

    console.log(`Found ${usersWithoutBloodGroup.length} users without bloodGroup field`);

    if (usersWithoutBloodGroup.length === 0) {
      console.log('All users already have bloodGroup field. Nothing to update.');
      return;
    }

    // Update each user with a random blood group (for demo purposes)
    let updateCount = 0;
    for (const user of usersWithoutBloodGroup) {
      const randomBloodGroup = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { bloodGroup: randomBloodGroup } }
      );

      updateCount++;
      console.log(`Updated user ${user.email} with blood group ${randomBloodGroup}`);
    }

    console.log(`\nSuccessfully updated ${updateCount} users with blood group data`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

addBloodGroupToUsers();
