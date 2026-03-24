import { Router, type IRouter } from "express";
import healthRouter from "./health";
import filesRouter from "./files";
import conversionsRouter from "./conversions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(filesRouter);
router.use(conversionsRouter);

export default router;
