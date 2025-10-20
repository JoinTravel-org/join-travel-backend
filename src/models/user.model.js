import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "User",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    email: {
      type: "varchar",
      unique: true,
      nullable: false,
    },
    password: {
      type: "varchar",
      nullable: false,
    },
    isEmailConfirmed: {
      type: "boolean",
      default: false,
    },
    emailConfirmationToken: {
      type: "varchar",
      nullable: true,
    },
    emailConfirmationExpires: {
      type: "timestamp",
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
});
