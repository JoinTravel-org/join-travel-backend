import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    email: {
      type: "varchar",
      unique: true,
      nullable: false,
    },
    password: {
      type: "varchar",
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 30,
      nullable: true,
    },
    age: {
      type: "integer",
      nullable: true,
    },
    profilePicture: {
      type: "varchar",
      nullable: true,
    },
    isEmailConfirmed: {
      type: "boolean",
      default: false,
    },
    emailConfirmationToken: {
      type: "varchar",
      nullable: true,
    },
    emailConfirmationExpires: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      nullable: true,
    },
    // Gamification fields
    points: {
      type: "integer",
      default: 0,
    },
    level: {
      type: "integer",
      default: 1,
    },
    levelName: {
      type: "varchar",
      length: 50,
      default: "Explorador",
    },
    badges: {
      type: "jsonb",
      default: [],
    },
    lastActivity: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    createdAt: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      createDate: true, // Se establece automáticamente al crear
    },
    updatedAt: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      updateDate: true, // Se actualiza automáticamente al modificar
    },
  },
  relations: {
    groups: {
      type: "many-to-many",
      target: "Group",
      inverseSide: "members",
      joinTable: {
        name: "group_members",
        joinColumn: {
          name: "userId",
          referencedColumnName: "id",
        },
        inverseJoinColumn: {
          name: "groupId",
          referencedColumnName: "id",
        },
      },
    },
  },
});
