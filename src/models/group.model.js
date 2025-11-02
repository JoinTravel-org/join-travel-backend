import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Group",
  tableName: "groups",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    name: {
      type: "varchar",
      length: 50,
      nullable: false
    },
    description: {
      type: "text",
      nullable: true
    },
    adminId: {
      type: "uuid",
      nullable: false
    }
  },
  relations: {
    admin: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "adminId"
      }
    },
    members: {
      type: "many-to-many",
      target: "User",
      joinTable: {
        name: "group_members",
        joinColumn: {
          name: "groupId",
          referencedColumnName: "id"
        },
        inverseJoinColumn: {
          name: "userId",
          referencedColumnName: "id"
        }
      }
    }
  }
});
