import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import filesRouter from "./files.js";
import conversionsRouter from "./conversions.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(filesRouter);
router.use(conversionsRouter);

export default router;
