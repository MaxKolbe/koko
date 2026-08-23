import express from "express";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { listArticlesSchema, getArticleSchema, askArticleQuestionSchema, updateArticleStatusSchema } from "./articles.schema.js";
import { listArticlesController, getArticleController, askArticleQuestionController, updateArticleStatusController } from "./articles.controller.js";

const router = express.Router();

router.get("/", validateRequest(listArticlesSchema), listArticlesController);
router.get("/:id", validateRequest(getArticleSchema), getArticleController);
router.post("/:id/ask", validateRequest(askArticleQuestionSchema), askArticleQuestionController);
router.patch("/status/:id", validateRequest(updateArticleStatusSchema), updateArticleStatusController)
   
export default router;
