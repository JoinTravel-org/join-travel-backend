import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Level",
  tableName: "levels",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: "increment",
    },
    levelNumber: {
      type: "integer",
      unique: true,
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    minPoints: {
      type: "integer",
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    rewards: {
      type: "jsonb",
      default: {},
    },
  },
});