import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/auth", authRoutes);

const apiRouter = Router();
apiRouter.use("/api", router);

export default apiRouter;
