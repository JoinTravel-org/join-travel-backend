import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Review",
  tableName: "reviews",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    rating: {
      type: "integer",
      nullable: false,
    },
    content: {
      type: "text",
      nullable: false,
    },
    placeId: {
      type: "uuid",
      nullable: false,
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    createdAt: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      default: () => "CURRENT_TIMESTAMP", // PostgreSQL usa UTC por defecto con nuestra configuración
    },
    updatedAt: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP", // Se actualiza automáticamente en UTC
    },
  },
  relations: {
    place: {
      target: "Place",
      type: "many-to-one",
      joinColumn: {
        name: "placeId",
      },
    },
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "userId",
      },
    },
    reviewMedia: {
      target: "ReviewMedia",
      type: "one-to-many",
      inverseSide: "review",
    },
    reviewLikes: {
      target: "ReviewLike",
      type: "one-to-many",
      inverseSide: "review",
    },
  },
  indices: [
    {
      name: "IDX_REVIEW_PLACE_ID",
      columns: ["placeId"],
    },
    {
      name: "IDX_REVIEW_USER_ID",
      columns: ["userId"],
    },
    {
      name: "IDX_REVIEW_CREATED_AT",
      columns: ["createdAt"],
    },
  ],
});
