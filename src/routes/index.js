import { Router } from "express";
import authRoutes from "./auth.routes.js";
import placesRoutes from "./places.routes.js";
import mapsRoutes from "./maps.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/places", placesRoutes);
router.use("/maps", mapsRoutes);

const apiRouter = Router();
apiRouter.use("/api", router);

export default apiRouter;
