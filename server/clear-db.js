import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const databaseurl = process.env.MONGODB_URL;

mongoose.connect(databaseurl).then(async () => {
  console.log('Connected to MongoDB');
  await mongoose.connection.db.dropDatabase();
  console.log('Database cleared successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error clearing database:', err);
  process.exit(1);
});