import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "UserRateLimit",
  tableName: "user_rate_limits",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
      unique: true,
    },
    minuteCount: {
      type: "int",
      default: 0,
      nullable: false,
    },
    minuteWindowStart: {
      type: "timestamp",
      nullable: false,
    },
    dailyCount: {
      type: "int",
      default: 0,
      nullable: false,
    },
    dailyWindowStart: {
      type: "timestamp",
      nullable: false,
    },
    blockedUntil: {
      type: "timestamp",
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
      type: "one-to-one",
      joinColumn: {
        name: "userId",
        referencedColumnName: "id",
      },
    },
  },
  indices: [
    {
      name: "IDX_USER_RATE_LIMIT_USER_ID",
      columns: ["userId"],
      isUnique: true,
    },
    {
      name: "IDX_USER_RATE_LIMIT_BLOCKED_UNTIL",
      columns: ["blockedUntil"],
    },
  ],
});