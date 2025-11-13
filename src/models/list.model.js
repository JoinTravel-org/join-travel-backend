import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "List",
  tableName: "lists",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    title: {
      type: "varchar",
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    userId: {
      type: "uuid",
      nullable: false,
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
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "userId",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
    places: {
      target: "Place",
      type: "many-to-many",
      joinTable: {
        name: "list_places",
        joinColumn: {
          name: "listId",
          referencedColumnName: "id",
        },
        inverseJoinColumn: {
          name: "placeId",
          referencedColumnName: "id",
        },
      },
      cascade: true,
    },
  },
});