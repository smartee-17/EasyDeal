import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const startServer = async () => {
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`External access via: http://${HOST}:${PORT}`);
  });
};

startServer();
