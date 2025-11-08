import { Router } from "express";
import { getMediaFile, getRecentMedia } from "../controllers/media.controller.js";

const router = Router();

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get media file by ID
 *     description: Retrieves a media file (image/video) stored in the database by its ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the media file
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Media file retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Media file not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Archivo multimedia no encontrado."
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/media/recent:
 *   get:
 *     summary: Get paginated list of recent public images from all users' reviews
 *     description: Retrieves a paginated list of recent public images from all users' reviews, ordered by creation date descending
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of images per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Recent media retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "img_123"
 *                       filename:
 *                         type: string
 *                         example: "beach_sunset.jpg"
 *                       originalFilename:
 *                         type: string
 *                         example: "IMG_001.jpg"
 *                       fileSize:
 *                         type: integer
 *                         example: 2048576
 *                       mimeType:
 *                         type: string
 *                         example: "image/jpeg"
 *                       url:
 *                         type: string
 *                         example: "/api/media/img_123"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-11-08T16:30:00.000Z"
 *       400:
 *         description: Invalid page/limit parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "El parámetro 'page' debe ser un número entero mayor o igual a 1."
 *       500:
 *         description: Internal server error
 */
router.get("/recent", getRecentMedia);

router.get("/:id", getMediaFile);

export default router;