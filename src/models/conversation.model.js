import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Conversation",
  tableName: "conversations",
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
    title: {
      type: "varchar",
      length: 255,
      nullable: true,
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
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "userId",
      },
    },
  },
  indices: [
    {
      name: "IDX_CONVERSATION_USER_ID",
      columns: ["userId"],
    },
    {
      name: "IDX_CONVERSATION_CREATED_AT",
      columns: ["createdAt"],
    },
  ],
});