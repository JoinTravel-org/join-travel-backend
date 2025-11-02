import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Badge",
  tableName: "badges",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: "increment",
    },
    name: {
      type: "varchar",
      length: 50,
      unique: true,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    criteria: {
      type: "jsonb",
      nullable: false,
    },
    iconUrl: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
  },
});