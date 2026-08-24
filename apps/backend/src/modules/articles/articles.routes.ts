import express from "express";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { listArticlesSchema, getArticleSchema, askArticleQuestionSchema, updateArticleStatusSchema, createArticleSchema, createTranslationSchema, editArticleSchema } from "./articles.schema.js";
import { listArticlesController, getArticleController, askArticleQuestionController, updateArticleStatusController, createArticleController, createTranslationController, editArticleController } from "./articles.controller.js";

const router = express.Router();

router.get("/", validateRequest(listArticlesSchema), listArticlesController);
router.post("/", validateRequest(createArticleSchema), createArticleController);
router.get("/:id", validateRequest(getArticleSchema), getArticleController);
router.post("/:id/ask", validateRequest(askArticleQuestionSchema), askArticleQuestionController);
router.patch("/:id/publish", validateRequest(updateArticleStatusSchema), updateArticleStatusController);
router.post("/:id/translations", validateRequest(createTranslationSchema), createTranslationController);
router.patch("/:id", validateRequest(editArticleSchema), editArticleController);
   
export default router;
