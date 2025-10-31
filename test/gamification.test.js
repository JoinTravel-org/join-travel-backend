import request from "supertest";
import app from "../src/app.js";
import { AppDataSource } from "../src/load/typeorm.loader.js";
import gamificationService from "../src/services/gamification.service.js";

describe("Gamification API", () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Initialize database connection if not already done
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create a test user
    const userRepository = AppDataSource.getRepository("User");
    testUser = await userRepository.save({
      email: "gamification-test@example.com",
      password: "hashedpassword",
      isEmailConfirmed: true,
      points: 0,
      level: 1,
      levelName: "Explorador",
      badges: [],
    });

    // Mock JWT token for testing (in real scenario, you'd login to get token)
    authToken = "mock-jwt-token-for-testing";
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await AppDataSource.getRepository("User").delete({ id: testUser.id });
      await AppDataSource.getRepository("UserAction").delete({ userId: testUser.id });
    }
  });

  describe("GET /api/users/:userId/stats", () => {
    it("should return user stats", async () => {
      // Mock the authenticateToken middleware for this test
      app.use((req, res, next) => {
        req.user = { id: testUser.id };
        next();
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("points");
      expect(response.body.data).toHaveProperty("level");
      expect(response.body.data).toHaveProperty("levelName");
      expect(response.body.data).toHaveProperty("badges");
    });

    it("should return 403 for unauthorized access", async () => {
      const response = await request(app)
        .get(`/api/users/different-user-id/stats`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/users/:userId/points", () => {
    it("should award points for review creation", async () => {
      // Mock the authenticateToken middleware
      app.use((req, res, next) => {
        req.user = { id: testUser.id };
        next();
      });

      const response = await request(app)
        .post(`/api/users/${testUser.id}/points`)
        .send({
          action: "review_created",
          metadata: { review_id: "test-review-id" }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.points).toBe(10); // 10 points for review_created
      expect(response.body.data.level).toBe(1);
    });

    it("should return 400 for invalid action", async () => {
      const response = await request(app)
        .post(`/api/users/${testUser.id}/points`)
        .send({ action: "invalid_action" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/levels", () => {
    it("should return all levels", async () => {
      const response = await request(app)
        .get("/api/levels")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty("level_number");
      expect(response.body.data[0]).toHaveProperty("name");
    });
  });

  describe("GET /api/badges", () => {
    it("should return all badges", async () => {
      const response = await request(app)
        .get("/api/badges")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("criteria");
    });
  });
});

describe("Gamification Service", () => {
  let testUser;

  beforeAll(async () => {
    const userRepository = AppDataSource.getRepository("User");
    testUser = await userRepository.save({
      email: "service-test@example.com",
      password: "hashedpassword",
      isEmailConfirmed: true,
      points: 0,
      level: 1,
      levelName: "Explorador",
      badges: [],
    });
  });

  afterAll(async () => {
    if (testUser) {
      await AppDataSource.getRepository("User").delete({ id: testUser.id });
      await AppDataSource.getRepository("UserAction").delete({ userId: testUser.id });
    }
  });

  describe("getPointsForAction", () => {
    it("should return correct points for each action", () => {
      expect(gamificationService.getPointsForAction("review_created")).toBe(10);
      expect(gamificationService.getPointsForAction("vote_received")).toBe(1);
      expect(gamificationService.getPointsForAction("profile_completed")).toBe(5);
      expect(gamificationService.getPointsForAction("comment_posted")).toBe(2);
      expect(gamificationService.getPointsForAction("unknown_action")).toBe(0);
    });
  });

  describe("awardPoints", () => {
    it("should award points and update user stats", async () => {
      const result = await gamificationService.awardPoints(testUser.id, "review_created", { review_id: "test" });

      expect(result.points).toBe(10);
      expect(result.level).toBe(1);

      // Verify user was updated in database
      const userRepository = AppDataSource.getRepository("User");
      const updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.points).toBe(10);
    });

    it("should throw error for invalid action", async () => {
      await expect(gamificationService.awardPoints(testUser.id, "invalid_action")).rejects.toThrow();
    });

    it("should level up user when conditions are met", async () => {
      const userRepository = AppDataSource.getRepository("User");

      // Start with level 1 (default)
      let updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.level).toBe(1);
      expect(updatedUser.levelName).toBe("Explorador");

      // Add profile_completed action (should stay at level 1)
      await gamificationService.awardPoints(testUser.id, "profile_completed");
      updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.level).toBe(1);
      expect(updatedUser.levelName).toBe("Explorador");

      // Add 2 reviews (should still be level 1 - needs 3 reviews for level 2)
      await gamificationService.awardPoints(testUser.id, "review_created", { review_id: "test-review-1" });
      await gamificationService.awardPoints(testUser.id, "review_created", { review_id: "test-review-2" });
      updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.level).toBe(1);
      expect(updatedUser.levelName).toBe("Explorador");

      // Add 1 more review to reach level 2 (now has profile + 3 reviews)
      await gamificationService.awardPoints(testUser.id, "review_created", { review_id: "test-review-3" });
      updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.level).toBe(2);
      expect(updatedUser.levelName).toBe("Viajero Activo");

      // Add 9 more votes (should still be level 2 - needs 10 votes for level 3)
      for (let i = 0; i < 9; i++) {
        await gamificationService.awardPoints(testUser.id, "vote_received", { review_id: "test-review" });
      }
      updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.level).toBe(2);
      expect(updatedUser.levelName).toBe("Viajero Activo");

      // Add 1 more vote to reach level 3 (now has profile + 3 reviews + 10 votes)
      await gamificationService.awardPoints(testUser.id, "vote_received", { review_id: "test-review" });
      updatedUser = await userRepository.findOne({ where: { id: testUser.id } });
      expect(updatedUser.level).toBe(3);
      expect(updatedUser.levelName).toBe("Guía Experto");
    });
  });

  describe("getUserStats", () => {
    it("should return user statistics", async () => {
      const stats = await gamificationService.getUserStats(testUser.id);

      expect(stats).toHaveProperty("points");
      expect(stats).toHaveProperty("level");
      expect(stats).toHaveProperty("levelName");
      expect(stats).toHaveProperty("badges");
      expect(stats).toHaveProperty("progressToNext");
    });
  });
});