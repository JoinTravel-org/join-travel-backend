import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "UserAction",
  tableName: "user_actions",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: "increment",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    actionType: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    pointsAwarded: {
      type: "integer",
      nullable: false,
    },
    metadata: {
      type: "jsonb",
      default: {},
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
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_USER_ACTIONS_USER_ID",
      columns: ["userId"],
    },
    {
      name: "IDX_USER_ACTIONS_CREATED_AT",
      columns: ["createdAt"],
    },
  ],
});