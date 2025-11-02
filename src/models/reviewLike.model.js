import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "ReviewLike",
  tableName: "review_likes",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    reviewId: {
      type: "uuid",
      nullable: false,
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    type: {
      type: "varchar",
      length: 10,
      nullable: false,
      enum: ["like", "dislike"],
      default: 'like',
    },
    createdAt: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    review: {
      target: "Review",
      type: "many-to-one",
      joinColumn: {
        name: "reviewId",
      },
      onDelete: "CASCADE",
    },
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_REVIEW_LIKE_REVIEW_ID",
      columns: ["reviewId"],
    },
    {
      name: "IDX_REVIEW_LIKE_USER_ID",
      columns: ["userId"],
    },
    {
      name: "IDX_REVIEW_LIKE_TYPE",
      columns: ["type"],
    },
    {
      name: "IDX_REVIEW_LIKE_UNIQUE",
      columns: ["reviewId", "userId"],
      isUnique: true,
    },
  ],
});