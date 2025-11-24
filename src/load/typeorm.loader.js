import "reflect-metadata";
import { DataSource } from "typeorm";
import User from "../models/user.model.js";
import UserAction from "../models/userActions.model.js";
import Level from "../models/levels.model.js";
import Badge from "../models/badges.model.js";
import RevokedToken from "../models/revokedToken.model.js";
import Place from "../models/place.model.js";
import UserFavorite from "../models/userFavorite.model.js";
import Itinerary, { ItineraryItemSchema } from "../models/itinerary.model.js";
import List from "../models/list.model.js";
import Review from "../models/review.model.js";
import ReviewMedia from "../models/reviewMedia.model.js";
import ReviewLike from "../models/reviewLike.model.js";
import Conversation from "../models/conversation.model.js";
import ChatMessage from "../models/chatMessage.model.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import DirectMessage from "../models/directMessage.model.js";
import Expense from "../models/expense.model.js";
import Question from "../models/question.model.js";
import Answer from "../models/answer.model.js";
import QuestionVote from "../models/questionVote.model.js";
import AnswerVote from "../models/answerVote.model.js";
import Notification from "../models/notification.model.js";
import UserFollower from "../models/userFollower.model.js";

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

  entities: [
    Group,
    GroupMessage,
    User,
    UserAction,
    Level,
    Badge,
    RevokedToken,
    Place,
    Itinerary,
    ItineraryItemSchema,
    List,
    UserFavorite,
    UserFollower,
    Review,
    ReviewMedia,
    ReviewLike,
    Conversation,
    ChatMessage,
    DirectMessage,
    Expense,
    Question,
    Answer,
    QuestionVote,
    AnswerVote,
    Notification,
  ],
  migrations: ["./src/migrations/*.js"],
  timezone: "America/Argentina/Buenos_Aires", // Usar zona horaria de Argentina
  // Create database if it doesn't exist
  extra: {
    connectionLimit: 10,
  },
});
