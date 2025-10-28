import { Router } from "express";
import { getMediaFile } from "../controllers/media.controller.js";

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
router.get("/:id", getMediaFile);

export default router;