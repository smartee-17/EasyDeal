import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'ci') {
  dotenv.config({ path: '.env.test' });
}
