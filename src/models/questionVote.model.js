import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "QuestionVote",
  tableName: "question_votes",
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
    createdAt: {
      type: "timestamp",
      createDate: true,
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
  },
  uniques: [
    {
      columns: ["questionId", "userId"],
    },
  ],
});