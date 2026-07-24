import 'dotenv/config';
import app from './app.js';
import connectDB from './config/database.js';
import { initCloudinary } from './config/cloudinary.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const startServer = async () => {
  try {
      await connectDB();

      initCloudinary();

      app.listen(PORT, HOST, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`External access via: http://${HOST}:${PORT}`);
      });
  } catch (error){
      console.error('Server failed to start:', error);
      process.exit(1);
  }
};

startServer();
