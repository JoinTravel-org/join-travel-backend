import { Router } from "express";
import authRoutes from "./auth.routes.js";
import placesRoutes from "./places.routes.js";
import mapsRoutes from "./maps.routes.js";
import debugRoutes from "./debug.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/places", placesRoutes);
router.use("/maps", mapsRoutes);
router.use("/debug", debugRoutes);

const apiRouter = Router();
apiRouter.use("/api", router);

export default apiRouter;
