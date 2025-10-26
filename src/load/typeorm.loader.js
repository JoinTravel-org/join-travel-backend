import "reflect-metadata";
import { DataSource } from "typeorm";
import User from "../models/user.model.js";
import RevokedToken from "../models/revokedToken.model.js";
import Place from "../models/place.model.js";
import Itinerary, { ItineraryItemSchema } from "../models/itinerary.model.js";
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
  entities: [ User, RevokedToken, Place, Itinerary, ItineraryItemSchema],
  migrations: ["./src/migrations/*.js"],
  timezone: "UTC", // Usar UTC para consistencia global
  // Create database if it doesn't exist
  extra: {
    connectionLimit: 10,
  },
});
