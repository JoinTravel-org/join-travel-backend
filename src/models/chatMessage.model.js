import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "ChatMessage",
  tableName: "chat_messages",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    conversationId: {
      type: "uuid",
      nullable: true,
    },
    message: {
      type: "text",
      nullable: false,
    },
    response: {
      type: "text",
      nullable: true,
    },
    timestamp: {
      type: "bigint",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "userId",
      },
    },
    conversation: {
      target: "Conversation",
      type: "many-to-one",
      joinColumn: {
        name: "conversationId",
      },
    },
  },
  indices: [
    {
      name: "IDX_CHAT_MESSAGE_USER_ID",
      columns: ["userId"],
    },
    {
      name: "IDX_CHAT_MESSAGE_CONVERSATION_ID",
      columns: ["conversationId"],
    },
    {
      name: "IDX_CHAT_MESSAGE_TIMESTAMP",
      columns: ["timestamp"],
    },
  ],
});