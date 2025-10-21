import { Router } from "express";
import authRoutes from "./auth.routes.js";
import placesRoutes from "./places.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/places", placesRoutes);

const apiRouter = Router();
apiRouter.use("/api", router);

export default apiRouter;
