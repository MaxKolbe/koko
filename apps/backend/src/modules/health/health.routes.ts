import express from "express";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { askHealthQuestionSchema } from "./health.schema.js";
import { askHealthQuestionController } from "./health.controller.js";

const router = express.Router();

router.post("/ask", validateRequest(askHealthQuestionSchema), askHealthQuestionController);

export default router;
