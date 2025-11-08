import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Expense",
  tableName: "expenses",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    concept: {
      type: "varchar",
      length: 100,
      nullable: false
    },
    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false
    },
    groupId: {
      type: "uuid",
      nullable: false
    },
    userId: {
      type: "uuid",
      nullable: false
    },
    createdAt: {
      type: "timestamp",
      createDate: true
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true
    }
  },
  relations: {
    group: {
      type: "many-to-one",
      target: "Group",
      joinColumn: {
        name: "groupId"
      }
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userId"
      }
    }
  }
});