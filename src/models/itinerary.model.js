import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Itinerary",
  tableName: "itineraries",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    name: {
      type: "varchar",
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
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "userId",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
    items: {
      target: "ItineraryItem",
      type: "one-to-many",
      inverseSide: "itinerary",
      cascade: true,
    },
  },
});

export const ItineraryItemSchema = new EntitySchema({
  name: "ItineraryItem",
  tableName: "itinerary_items",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    itineraryId: {
      type: "uuid",
      nullable: false,
    },
    placeId: {
      type: "uuid",
      nullable: false,
    },
    date: {
      type: "date",
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
    itinerary: {
      target: "Itinerary",
      type: "many-to-one",
      joinColumn: {
        name: "itineraryId",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
    place: {
      target: "Place",
      type: "many-to-one",
      joinColumn: {
        name: "placeId",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
});
