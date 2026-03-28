import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { logger } from "./lib/logger";

type ExpressError = Error & { status?: number; statusCode?: number };

const app: Express = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        url: req.url?.split("?")[0],
        statusCode: res.statusCode,
        duration: Date.now() - start,
      },
      "request"
    );
  });
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: ExpressError, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";
  logger.error({ err, method: req.method, url: req.url }, "unhandled error");
  res.status(status).json({ error: "Internal Server Error", message });
});

export default app;
