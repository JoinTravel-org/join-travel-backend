import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "ReviewMedia",
  tableName: "review_media",
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
    filename: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    originalFilename: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    filePath: {
      type: "varchar",
      length: 500,
      nullable: true,
    },
    fileSize: {
      type: "bigint",
      nullable: false,
    },
    mimeType: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    fileData: {
      type: "bytea",
      nullable: true,
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
    },
  },
  indices: [
    {
      name: "IDX_REVIEW_MEDIA_REVIEW_ID",
      columns: ["reviewId"],
    },
    {
      name: "IDX_REVIEW_MEDIA_CREATED_AT",
      columns: ["createdAt"],
    },
  ],
});