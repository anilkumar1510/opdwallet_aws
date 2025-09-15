const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin123@mongo:27017/opd_wallet?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  memberId: { type: String, unique: true, sparse: true },
  userId: String,
  name: {
    fullName: String,
    firstName: String,
    lastName: String,
  },
  phone: String,
  status: { type: String, default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

async function seedMember() {
  try {
    // Check if member already exists
    const existingUser = await User.findOne({ email: 'member@test.com' });

    if (existingUser) {
      console.log('Test member already exists');
      process.exit(0);
    }

    // Create new member
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    const member = new User({
      email: 'member@test.com',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      memberId: 'OPD000001',
      userId: 'USR000001',
      name: {
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
      },
      phone: '+91 9876543210',
      status: 'ACTIVE',
    });

    await member.save();
    console.log('Test member created successfully:');
    console.log('Email: member@test.com');
    console.log('Password: Test123!');
    console.log('Member ID: OPD000001');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding member:', error);
    process.exit(1);
  }
}

seedMember();