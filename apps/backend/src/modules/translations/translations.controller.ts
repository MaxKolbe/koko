import { successResponse } from "../../utils/responseHandler.util.js";
import { Request, Response, NextFunction } from "express";
import { editTranslation } from "../../services/translations.services.js";

export const editTranslationController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  try {
    const response = await editTranslation(id, req.body, req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};
