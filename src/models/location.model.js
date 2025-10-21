import { EntitySchema } from "typeorm";

export const Location = new EntitySchema({
  name: "Location",
  tableName: "locations",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    description: {
      type: "text",
      nullable: true,
    },
    imageUrl: {
      type: "varchar",
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
