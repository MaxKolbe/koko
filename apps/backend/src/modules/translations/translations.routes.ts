import express from "express";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { editTranslationSchema } from "./translations.schema.js";
import { editTranslationController } from "./translations.controller.js";

const router = express.Router();

router.patch("/:id", validateRequest(editTranslationSchema), editTranslationController);

export default router;
