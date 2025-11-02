import { Router } from "express";
import authRoutes from "./auth.routes.js";
import placesRoutes from "./places.routes.js";
import mapsRoutes from "./maps.routes.js";
import debugRoutes from "./debug.routes.js";
import itineraryRoutes from "./itinerary.routes.js";
import mediaRoutes from "./media.routes.js";
import chatRoutes from "./chat.routes.js";
import gamificationRoutes from "./gamification.routes.js";
import cronRoutes from "./cron.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/places", placesRoutes);
router.use("/maps", mapsRoutes);
router.use("/debug", debugRoutes);
router.use("/itineraries", itineraryRoutes);
router.use("/media", mediaRoutes);
router.use("/chat", chatRoutes);
router.use("/users", usersRoutes);
router.use("", gamificationRoutes);
router.use("/cron", cronRoutes);

const apiRouter = Router();
apiRouter.use("/api", router);

export default apiRouter;
