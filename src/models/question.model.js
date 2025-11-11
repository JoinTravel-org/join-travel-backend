import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Question",
  tableName: "questions",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    placeId: {
      type: "uuid",
      nullable: false,
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    content: {
      type: "text",
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
    place: {
      type: "many-to-one",
      target: "Place",
      joinColumn: { name: "placeId" },
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
    },
    questionVotes: {
      type: "one-to-many",
      target: "QuestionVote",
      inverseSide: "question",
    },
  },
});