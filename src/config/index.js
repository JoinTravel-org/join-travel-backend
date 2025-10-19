import dotenv from "dotenv";

dotenv.config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 8080,
};

export default config;
