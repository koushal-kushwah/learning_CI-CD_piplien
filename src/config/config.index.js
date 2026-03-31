import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: Number(process.env.PORT),
  CORS: process.env.CORS,
  DB_STRING: process.env.DB_STRING,
  FRONT_END_URL: process.env.FRONT_END_URL,

  // Redis Configuration
  // REDIS_HOST: process.env.REDIS_HOST,
  // REDIS_STRING: process.env.REDIS_STRING,
  // REDIS_PORT: Number(process.env.REDIS_PORT),
  // REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  EXPIN: process.env.JWT_EXPIRES_IN,
};

console.log('DB_STRING testing:', process.env.DB_STRING);