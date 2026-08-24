import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import requestLogger from "./middleware/requestLogger.middleware.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import { connectRedis } from "./configs/cache.config.js";
import { bullBoardAdapter } from "./configs/bull-board.config.js";
import "./queues/workers/ingestion.worker.js";
import healthRouter from "./modules/health/health.routes.js";
import articleRouter from "./modules/articles/articles.routes.js";
import languageRouter from "./modules/languages/languages.routes.js";

const app = express();

const whitelist = [`http://localhost:${process.env.PORT}`, `http://localhost:5173`, `https://koko-frontend-theta.vercel.app`];
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allowed?: boolean) => void,
  ) {
    if (whitelist.indexOf(origin || "") !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true, //Allow cookies/auth headers
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // Cache preflight requests for 24 hours
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(requestLogger);

(async () => {
  await connectRedis();
})();

//ROUTES
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/languages", languageRouter);

// BULL BOARD DASHBOARD. (ADD AUTH N' AUTH IN PRODUCTION)
app.use("/api/v1/admin/queues", bullBoardAdapter.getRouter());

// INTRO ROUTE HANDLER
app.get("/api/v1", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to KoKo's API"
  });
});

// HANDLER FOR UNKNOWN ROUTES
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.path} not found` },
  });
});

//GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
