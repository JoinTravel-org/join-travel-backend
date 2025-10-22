import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Place",
  tableName: "places",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    name: {
      type: "varchar",
      nullable: false,
    },
    address: {
      type: "varchar",
      nullable: false,
    },
    latitude: {
      type: "decimal",
      precision: 10,
      scale: 8,
      nullable: false,
    },
    longitude: {
      type: "decimal",
      precision: 11,
      scale: 8,
      nullable: false,
    },
    image: {
      type: "varchar",
      nullable: true,
    },
    rating: {
      type: "decimal",
      precision: 2,
      scale: 1,
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
    description:{
      type: "text",
      nullable: true,
    },
    city: {
      type: "varchar",
      nullable: true,
    },
  },
});