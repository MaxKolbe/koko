import { successResponse } from "../../utils/responseHandler.util.js";
import { Request, Response, NextFunction } from "express";
import { getArticles, getArticleById, askArticleQuestion, updateArticleStatus } from "../../services/articles.services.js";

export const listArticlesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await getArticles(req.qtransformed, req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};

export const getArticleController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const language: string = req.qtransformed?.language ?? "en";
  try {
    const response = await getArticleById(id, language, req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};

export const askArticleQuestionController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;
  const { question } = req.body;
  const language: string = req.qtransformed?.language ?? "en";
  try {
    const response = await askArticleQuestion(id, language, question, req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};


export const updateArticleStatusController = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id as string;

  try {
    const response = await updateArticleStatus(id, req.correlationId!);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};