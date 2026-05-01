import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import apiRoutes from './api/routes/index.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRoutes);

export default app;
