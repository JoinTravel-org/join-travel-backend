import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "DirectMessage",
  tableName: "direct_messages",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    senderId: {
      type: "uuid",
      nullable: false,
    },
    receiverId: {
      type: "uuid",
      nullable: false,
    },
    conversationId: {
      type: "varchar",
      length: 255,
      nullable: false,
      comment:
        "Unique identifier for conversation between two users (sorted user IDs)",
    },
    content: {
      type: "text",
      nullable: false,
    },
    isRead: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    sender: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "senderId",
      },
    },
    receiver: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "receiverId",
      },
    },
  },
  indices: [
    {
      name: "IDX_DIRECT_MESSAGE_SENDER_ID",
      columns: ["senderId"],
    },
    {
      name: "IDX_DIRECT_MESSAGE_RECEIVER_ID",
      columns: ["receiverId"],
    },
    {
      name: "IDX_DIRECT_MESSAGE_CONVERSATION_ID",
      columns: ["conversationId"],
    },
    {
      name: "IDX_DIRECT_MESSAGE_CREATED_AT",
      columns: ["createdAt"],
    },
  ],
});
