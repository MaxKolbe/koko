import { successResponse } from "../../utils/responseHandler.util.js";
import { Request, Response, NextFunction } from "express";
import { askHealthQuestion } from "../../services/health.services.js";

//CONTROLLER

export const askHealthQuestionController = async (req: Request, res: Response, next: NextFunction) => {
  const { question } = req.body;
  try {
    const response = await askHealthQuestion(question, req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};
