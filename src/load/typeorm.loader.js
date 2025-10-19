import "reflect-metadata";
import { DataSource } from "typeorm";
import { Location } from "../entities/Location.js";
import config from "../config/index.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: false, // true only for dev (auto create tables)
  logging: false,
  entities: [Location],
  migrations: ["./src/migrations/*.js"],
});
