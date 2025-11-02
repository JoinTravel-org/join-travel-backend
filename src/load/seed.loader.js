import { AppDataSource } from "./typeorm.loader.js";
import placeRepository from "../repository/place.repository.js";
import UserRepository from "../repository/user.repository.js";
import reviewRepository from "../repository/review.repository.js";
import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import logger from "../config/logger.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

// Gamification seed data
export const LEVELS_DATA = [
  { levelNumber: 1, name: 'Explorador', minPoints: 0, description: 'Registrarse', rewards: { badge: 'Explorador' }, instructions: ["Registrate en la plataforma"] },
  { levelNumber: 2, name: 'Viajero Activo', minPoints: 30, description: 'Tener al menos 3 reseñas publicadas', rewards: { badge: 'Viajero Activo', unlock_feature: 'advanced_search' }, instructions: ["Escribe reseñas de calidad sobre lugares que has visitado", "Sé específico sobre tu experiencia", "Incluye detalles útiles para otros usuarios"] },
  { levelNumber: 3, name: 'Guía Experto', minPoints: 100, description: 'Obtener al menos 10 likes en sus aportes', rewards: { badge: 'Guía Experto', unlock_feature: 'expert_badge_display' }, instructions: ["Recibe votos positivos en tus reseñas", "Interactúa con otros usuarios", "Comparte reseñas detalladas con fotos"] },
  { levelNumber: 4, name: 'Maestro Viajero', minPoints: 150, description: 'Alcanzar 10 reseñas y 50 likes', rewards: { badge: 'Maestro Viajero', unlock_feature: 'priority_support' }, instructions: ["Continúa escribiendo reseñas de calidad", "Mantén un alto nivel de engagement", "Ayuda a la comunidad con tus experiencias"] },
];

export const BADGES_DATA = [
  { name: '🌍 Primera Reseña', description: 'Crear tu primera reseña', criteria: { action_type: 'review_created', count: 1 }, iconUrl: '🌍', instructions: ["Navega a la página de un lugar que hayas visitado", "Haz clic en 'Escribir reseña'", "Completa el formulario con tu experiencia", "Publica la reseña"] },
  { name: '📸 Fotógrafo', description: 'Subir una foto o video en cualquier reseña', criteria: { action_type: 'media_upload', count: 1 }, iconUrl: '📸', instructions: ["Toma fotos de calidad de los lugares que visitas", "Sube imágenes junto con tus reseñas", "Asegúrate de que las fotos sean nítidas y relevantes"] },
  { name: '⭐ Popular', description: 'Recibir al menos 5 likes en reseñas propias', criteria: { action_type: 'vote_received', count: 5 }, iconUrl: '⭐', instructions: ["Escribe reseñas útiles y detalladas", "Interactúa con la comunidad", "Comparte experiencias auténticas"] },
  { name: 'Viajero Activo', description: 'Alcanzar nivel 2', criteria: { level: 2 }, iconUrl: '🏆', instructions: [] },
  { name: 'Guía Experto', description: 'Alcanzar nivel 3', criteria: { level: 3 }, iconUrl: '🎯', instructions: [] },
  { name: 'Maestro Viajero', description: 'Alcanzar nivel 4', criteria: { level: 4 }, iconUrl: '👑', instructions: [] },
  { name: 'Super Like', description: 'Recibir 10 likes en una sola reseña', criteria: { action_type: 'vote_received', per_review: 10 }, iconUrl: '🔥', instructions: [] },
];

export const POINTS_DATA = {
  'review_created': 10,
  'vote_received': 1,
  'profile_completed': 5,
  'comment_posted': 2,
  'media_upload': 5, // Bonus points for uploading media
  'place_added': 15, // Points for adding a new place
};

export default async function seedDatabase() {
  try {
    logger.info("Seeding database with gamification data, users, places, reviews, and media...");

    // Seed levels and badges first (always, regardless of places)
    logger.info("Seeding levels...");
    for (const levelData of LEVELS_DATA) {
      try {
        const existingLevel = await AppDataSource.getRepository("Level").findOne({ where: { levelNumber: levelData.levelNumber } });
        if (!existingLevel) {
          await AppDataSource.getRepository("Level").save(levelData);
          logger.info(`Seeded level: ${levelData.name}`);
        } else {
          logger.info(`Level ${levelData.name} already exists, skipping`);
        }
      } catch (error) {
        logger.error(`Failed to seed level ${levelData.name}:`, error.message);
      }
    }

    logger.info("Seeding badges...");
    for (const badgeData of BADGES_DATA) {
      try {
        const existingBadge = await AppDataSource.getRepository("Badge").findOne({ where: { name: badgeData.name } });
        if (!existingBadge) {
          await AppDataSource.getRepository("Badge").save(badgeData);
          logger.info(`Seeded badge: ${badgeData.name}`);
        } else {
          logger.info(`Badge ${badgeData.name} already exists, skipping`);
        }
      } catch (error) {
        logger.error(`Failed to seed badge ${badgeData.name}:`, error.message);
      }
    }

    // Check if places already exist
    const existingPlaces = await placeRepository.getRepository().count();
    if (existingPlaces > 0) {
      logger.info(
        `Database already has ${existingPlaces} places, skipping user/place/review seeding`
      );
      return;
    }
    const usersData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data/users.json"), "utf8"));
    const placesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data/places.json"), "utf8"));
    const reviewsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data/reviews.json"), "utf8"));

    // Seed users first
    logger.info(`Found ${usersData.length} users in seed data`);
    const createdUsers = [];
    const userRepo = new UserRepository();
    for (const userData of usersData) {
      logger.info(`Attempting to create user: ${userData.email}`);
      try {
        // Hash the password before creating user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        logger.info(`Password hashed for user: ${userData.email}`);
        const user = await userRepo.create({
          ...userData,
          password: hashedPassword
        });
        createdUsers.push(user);
        logger.info(`Seeded user: ${user.email} with ID: ${user.id}`);
      } catch (error) {
        logger.error(`Failed to seed user ${userData.email}:`, error.message);
        logger.error(`Error details:`, error);
        // Don't add to createdUsers array if creation failed
        continue;
      }
    }
    logger.info(`Total users created: ${createdUsers.length}`);
    logger.info(`Created users IDs: ${createdUsers.map(u => u.id).join(', ')}`);

    // Seed places
    const createdPlaces = [];
    for (const placeData of placesData) {
      try {
        const place = await placeRepository.create(placeData);
        createdPlaces.push(place);
        logger.info(`Seeded place: ${place.name}`);
      } catch (error) {
        logger.error(`Failed to seed place ${placeData.name}:`, error.message);
        // Don't add to createdPlaces array if creation failed
        continue;
      }
    }
    logger.info(`Total places created: ${createdPlaces.length}`);

    // Seed reviews and media
    for (const reviewData of reviewsData) {
      try {
        const { media, placeId: placeIndex, userId: userIndex, ...reviewFields } = reviewData;

        // Map indices to actual UUIDs (1-based indices in JSON map to 0-based array indices)
        const placeId = createdPlaces[placeIndex - 1]?.id;
        const userId = createdUsers[userIndex - 1]?.id;

        if (!placeId || !userId) {
          logger.error(`Invalid placeId (${placeIndex}) or userId (${userIndex}) for review - placeId: ${placeId}, userId: ${userId}`);
          continue;
        }

        const review = await reviewRepository.create({
          ...reviewFields,
          placeId,
          userId
        });
        logger.info(`Seeded review for place ${placeId} by user ${userId}`);

        // Seed media for this review
        if (media && media.length > 0) {
          for (const mediaData of media) {
            try {
              // Check if filePath exists and try to read actual file, otherwise use placeholder
              let fileData = mediaData.fileData;
              if (mediaData.filePath) {
                try {
                  const fullPath = path.join(process.cwd(), mediaData.filePath);
                  if (fs.existsSync(fullPath)) {
                    fileData = fs.readFileSync(fullPath);
                    logger.info(`Loaded actual file: ${mediaData.filePath}`);
                  } else {
                    logger.warn(`File not found: ${mediaData.filePath}, using placeholder`);
                    if (typeof fileData === 'string' && fileData.startsWith('PLACEHOLDER_')) {
                      fileData = Buffer.from(fileData, 'utf8');
                    } else {
                      fileData = Buffer.from(fileData, 'base64');
                    }
                  }
                } catch (fileError) {
                  logger.error(`Error reading file ${mediaData.filePath}:`, fileError.message);
                  if (typeof fileData === 'string' && fileData.startsWith('PLACEHOLDER_')) {
                    fileData = Buffer.from(fileData, 'utf8');
                  } else {
                    fileData = Buffer.from(fileData, 'base64');
                  }
                }
              } else if (typeof fileData === 'string') {
                if (fileData.startsWith('PLACEHOLDER_')) {
                  fileData = Buffer.from(fileData, 'utf8');
                } else {
                  fileData = Buffer.from(fileData, 'base64');
                }
              }

              const mediaRecord = await reviewMediaRepository.create({
                reviewId: review.id,
                filename: mediaData.filename,
                originalFilename: mediaData.originalFilename,
                fileSize: mediaData.fileSize,
                mimeType: mediaData.mimeType,
                fileData: fileData,
                filePath: null // Don't store filePath in database, only raw binary data
              });
              logger.info(`Seeded media ${mediaRecord.filename} for review ${review.id}`);
            } catch (mediaError) {
              logger.error(`Failed to seed media for review:`, mediaError.message);
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to seed review:`, error.message);
      }
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Database seeding failed:", error);
    throw error;
  }
}
