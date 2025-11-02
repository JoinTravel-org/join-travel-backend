import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "UserFavorite",
  tableName: "user_favorites",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    placeId: {
      type: "uuid",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
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
    place: {
      target: "Place",
      type: "many-to-one",
      joinColumn: {
        name: "placeId",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_USER_FAVORITE_USER_ID",
      columns: ["userId"],
    },
    {
      name: "IDX_USER_FAVORITE_PLACE_ID",
      columns: ["placeId"],
    },
    {
      name: "IDX_USER_FAVORITE_UNIQUE",
      columns: ["userId", "placeId"],
      isUnique: true,
    },
  ],
});