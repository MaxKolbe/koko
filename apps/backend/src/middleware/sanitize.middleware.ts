import xss from "xss";
import { Request, Response, NextFunction } from "express";

const sanitizeValue = (value: any): any => {
  if (typeof value === "string") {
    return xss(value, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ["script", "style"],
    });
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const clean: any = {};
    for (const key of Object.keys(value)) {
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }

  return value;
};

// should be mounted before validation
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeValue(req.body);
//   if (req.query) req.qtransformed = sanitizeValue(req.query); 
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};
