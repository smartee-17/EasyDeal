import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import apiRoutes from './api/routes/index.js';
import errorMiddleware from './api/middlewares/error.middleware.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
];

const isPrivateNetworkOrigin = (origin) => {
  try {
    const url = new URL(origin);

    if (url.protocol !== 'http:') {
      return false;
    }

    const hostname = url.hostname;

    // localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // 192.168.x.x
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    // 10.x.x.x
    if (/^10\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    // 172.16.x.x - 172.31.x.x
    if (
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      // Explicitly configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Development LAN/local origins
      if (
        process.env.NODE_ENV !== 'production' &&
        isPrivateNetworkOrigin(origin)
      ) {
        return callback(null, true);
      }

      // Production frontend
      if (
        process.env.NODE_ENV === 'production' &&
        origin === process.env.CLIENT_URL
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRoutes);

app.use(errorMiddleware);

export default app;