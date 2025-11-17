import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Notification",
  tableName: "notifications",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    type: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    title: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    message: {
      type: "text",
      nullable: false,
    },
    read: {
      type: "boolean",
      default: false,
    },
    data: {
      type: "jsonb",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_NOTIFICATION_USER",
      columns: ["userId"],
    },
    {
      name: "IDX_NOTIFICATION_USER_READ",
      columns: ["userId", "read"],
    },
    {
      name: "IDX_NOTIFICATION_CREATED",
      columns: ["createdAt"],
    },
  ],
});
