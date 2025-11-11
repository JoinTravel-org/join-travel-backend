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
import groupRoutes from "./group.routes.js";
import groupMessageRoutes from "./groupMessage.routes.js";
import directMessageRoutes from "./directMessage.routes.js";
import expenseRoutes from "./expense.routes.js";
import questionRoutes from "./question.routes.js";
import answerRoutes from "./answer.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/places", placesRoutes);
router.use("/maps", mapsRoutes);
router.use("/debug", debugRoutes);
router.use("/itineraries", itineraryRoutes);
router.use("/media", mediaRoutes);
router.use("/chat", chatRoutes);
router.use("/users", usersRoutes);
router.use("/direct-messages", directMessageRoutes);
router.use("", gamificationRoutes);
router.use("/cron", cronRoutes);
router.use("/groups", groupRoutes);
router.use("", expenseRoutes);
router.use("/groups", groupMessageRoutes);
router.use("", questionRoutes);
router.use("", answerRoutes);

const apiRouter = Router();
apiRouter.use("/api", router);

export default apiRouter;
