import dotenv from 'dotenv';
dotenv.config();
export const MONGO_URL=process.env.MONGO_URL;
export const JWT_USER_PASSWORD=process.env.JWT_USER_PASSWORD;