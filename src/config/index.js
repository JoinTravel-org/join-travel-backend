import dotenv from "dotenv";
dotenv.config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 8080,
  db: {
    host: process.env.POSTGRES_HOST || (process.env.NODE_ENV === 'test' ? 'postgres_db' : 'localhost'),
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === "true" || false,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET is required"); })(),
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET || (() => { throw new Error("JWT_REFRESH_SECRET is required"); })(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};

export default config;
