import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "RevokedToken",
  tableName: "revoked_tokens",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    token: {
      type: "text",
      nullable: false,
      unique: true,
    },
    expiresAt: {
      type: "timestamp",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
  indices: [
    {
      name: "IDX_REVOKED_TOKEN",
      columns: ["token"],
    },
    {
      name: "IDX_REVOKED_EXPIRES_AT",
      columns: ["expiresAt"],
    },
  ],
});