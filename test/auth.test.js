process.env.NODE_ENV = 'test';

import request from "supertest";
import app from "../src/app.js"; // Ajusta la ruta según tu estructura
import { AppDataSource } from "../src/load/typeorm.loader.js";
import connectDB from "../src/load/database.loader.js";
import User from "../src/models/user.model.js";
import RevokedToken from "../src/models/revokedToken.model.js";

describe("Authentication Tests", () => {
  let server;
  let testUser = {
    email: "test@example.com",
    password: "TestPassword123!",
  };
  let confirmationToken;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    await connectDB();
    // Limpiar datos previos de test
    const userRepo = AppDataSource.getRepository(User);
    const revokedRepo = AppDataSource.getRepository(RevokedToken);
    await userRepo.delete({ email: testUser.email });
    await revokedRepo.clear();
    // Iniciar el servidor para pruebas
    server = app.listen(0); // Puerto aleatorio
  });

  afterAll(async () => {
    // Cerrar servidor y conexión a DB
    if (server) server.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Limpiar datos de test - commented out since tests are dependent
    // const userRepo = AppDataSource.getRepository(User);
    // const revokedRepo = AppDataSource.getRepository(RevokedToken);
    
    // await revokedRepo.clear();
    // await userRepo.delete({ email: testUser.email });
  });

  test("Should register a new user", async () => {
    const response = await request(server)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(testUser.email);
  });

  test("Should login and return tokens", async () => {
    const response = await request(server)
      .post("/api/auth/login")
      .send(testUser)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();

    accessToken = response.body.data.accessToken;
    refreshToken = response.body.data.refreshToken;
  });

  test("Should access protected route with valid token", async () => {
    const response = await request(server)
      .get("/api/auth/") // Asumiendo que esta ruta requiere auth
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test("Should refresh access token", async () => {
    const response = await request(server)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();

    accessToken = response.body.data.accessToken;
  });

  test("Should logout and revoke token", async () => {
    const response = await request(server)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test("Should reject access with revoked token", async () => {
    const response = await request(server)
      .get("/api/auth/")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("revoked");
  });

  test("Should reject too many login attempts", async () => {
    // Simular múltiples intentos fallidos
    for (let i = 0; i < 11; i++) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@example.com", password: "wrong" })
        .expect(i < 8 ? 401 : 429);
    }
  });
});