import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Answer",
  tableName: "answers",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    questionId: {
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
    question: {
      type: "many-to-one",
      target: "Question",
      joinColumn: { name: "questionId" },
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
    },
    answerVotes: {
      type: "one-to-many",
      target: "AnswerVote",
      inverseSide: "answer",
    },
  },
});