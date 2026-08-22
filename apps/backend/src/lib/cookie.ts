const isProduction = process.env.NODE_ENV === "production";
const sameSite = isProduction ? "none" : "lax";

export const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction, // should browser send the cookie over https?
  sameSite,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), 
  partitioned: isProduction,
} as const;

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction, // should browser send the cookie over https?
  sameSite,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), 
  partitioned: isProduction,
} as const;
