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
    createdAt: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      createDate: true, // Se establece automáticamente al crear
    },
    updatedAt: {
      type: "timestamp", // timestamp se almacena en UTC en PostgreSQL
      updateDate: true, // Se actualiza automáticamente al modificar
    },
  },
});
