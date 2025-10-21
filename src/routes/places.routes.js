import { Router } from "express";
import { addPlace, checkPlace } from "../controllers/place.controller.js";

const router = Router();

/**
 * @route POST /api/places
 * @desc Agregar un nuevo lugar desde Google Maps
 * @access Public (considerar autenticación según requerimientos)
 */
router.post("/", addPlace);

/**
 * @route GET /api/places/check
 * @desc Verificar si un lugar ya existe
 * @access Public (considerar autenticación según requerimientos)
 * @query {string} name - Nombre del lugar (requerido)
 * @query {number} latitude - Latitud (requerido)
 * @query {number} longitude - Longitud (requerido)
 */
router.get("/check", checkPlace);

export default router;