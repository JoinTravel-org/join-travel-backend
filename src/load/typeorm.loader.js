import "reflect-metadata";
import { DataSource } from "typeorm";
import { Location } from "../models/location.model.js";
import User from "../models/user.model.js";
import config from "../config/index.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: true, // true only for dev (auto create tables)
  logging: false,
  entities: [Location, User],
  migrations: ["./src/migrations/*.js"],
  timezone: "UTC", // Usar UTC para consistencia global
});
