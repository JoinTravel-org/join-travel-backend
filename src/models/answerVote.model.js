import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "AnswerVote",
  tableName: "answer_votes",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    answerId: {
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
    answer: {
      type: "many-to-one",
      target: "Answer",
      joinColumn: { name: "answerId" },
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
    },
  },
  uniques: [
    {
      columns: ["answerId", "userId"],
    },
  ],
});