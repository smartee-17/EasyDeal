import 'dotenv/config';
import app from './app.js';
import connectDB from './config/database.js';
import { initCloudinary } from './config/cloudinary.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const startServer = async () => {
  try {
    await connectDB();

    initCloudinary();

    app.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Listening on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

startServer();