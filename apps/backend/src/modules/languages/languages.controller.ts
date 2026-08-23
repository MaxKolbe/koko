import { successResponse } from "../../utils/responseHandler.util.js";
import { Request, Response, NextFunction } from "express";
import { getLanguages } from "../../services/languages.services.js";

//CONTROLLER

export const listLanguagesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getLanguages(req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};
