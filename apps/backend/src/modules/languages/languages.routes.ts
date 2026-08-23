import express from "express";
import { listLanguagesController } from "./languages.controller.js";

const router = express.Router();

router.get("/", listLanguagesController);

export default router;
