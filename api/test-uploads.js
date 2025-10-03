const fs = require('fs');
const path = require('path');

console.log('=== CHECKING FILE UPLOAD DIRECTORY ===');

const uploadsDir = path.join(__dirname, 'uploads', 'claims');

if (fs.existsSync(uploadsDir)) {
  console.log('✅ Upload directory exists:', uploadsDir);

  // List all user directories
  const userDirs = fs.readdirSync(uploadsDir);
  console.log('User directories found:', userDirs.length);

  userDirs.forEach(userDir => {
    const userPath = path.join(uploadsDir, userDir);
    const files = fs.readdirSync(userPath);
    console.log(`\nUser: ${userDir}`);
    console.log(`Files: ${files.length}`);
    files.forEach(file => {
      const filePath = path.join(userPath, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
  });
} else {
  console.log('❌ Upload directory does not exist:', uploadsDir);
  console.log('Creating directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Directory created');
}

// Check MongoDB for claims
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
  if (err) {
    console.error('❌ MongoDB connection error:', err);
    return;
  }

  console.log('\n=== CHECKING DATABASE ===');
  console.log('✅ Connected to MongoDB');

  const db = client.db('opd_wallet');
  const collection = db.collection('memberclaims');

  const count = await collection.countDocuments();
  console.log('Total claims in database:', count);

  const claims = await collection.find({}).limit(5).toArray();
  console.log('\nRecent claims:');
  claims.forEach(claim => {
    console.log(`\nClaim ID: ${claim.claimId}`);
    console.log(`Status: ${claim.status}`);
    console.log(`Documents: ${claim.documents ? claim.documents.length : 0}`);
    if (claim.documents && claim.documents.length > 0) {
      claim.documents.forEach(doc => {
        console.log(`  - ${doc.originalName} (${doc.fileSize} bytes)`);
        console.log(`    Path: ${doc.filePath}`);
      });
    }
  });

  client.close();
});