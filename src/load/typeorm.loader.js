import "reflect-metadata";
import { DataSource } from "typeorm";
import User from "../models/user.model.js";
import UserAction from "../models/userActions.model.js";
import Level from "../models/levels.model.js";
import Badge from "../models/badges.model.js";
import RevokedToken from "../models/revokedToken.model.js";
import Place from "../models/place.model.js";
import Itinerary, { ItineraryItemSchema } from "../models/itinerary.model.js";
import Review from "../models/review.model.js";
import ReviewMedia from "../models/reviewMedia.model.js";
import ReviewLike from "../models/reviewLike.model.js";
import Conversation from "../models/conversation.model.js";
import ChatMessage from "../models/chatMessage.model.js";
import config from "../config/index.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: true, // Temporarily enabled to create missing tables
  logging: false,
  entities: [ User, UserAction, Level, Badge, RevokedToken, Place, Itinerary, ItineraryItemSchema, Review, ReviewMedia, ReviewLike, Conversation, ChatMessage],
  migrations: ["./src/migrations/*.js"],
  timezone: "UTC", // Usar UTC para consistencia global
  // Create database if it doesn't exist
  extra: {
    connectionLimit: 10,
  },
});
