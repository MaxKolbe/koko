import winston from "winston";
import { Logtail } from "@logtail/node";
// import { LogtailTransport } from "@logtail/winston";

// Create a Logtail client
// const logtail = new Logtail(process.env.SOURCE_TOKEN!, {
//   endpoint: `https://${process.env.INGESTING_HOST}`,
// });

const { combine, timestamp, json, errors, align, colorize, printf } = winston.format;
const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    errors({ stack: true }),
    isProduction
      ? combine(json(), align())
      : combine(
          colorize(),
          printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
            return `${timestamp} ${level}: ${message}${metaStr}`;
          }),
        ),
  ),
  defaultMeta: { service: "template-service" },
  transports: [new winston.transports.Console() /*, new LogtailTransport(logtail)*/],
});

export default logger;
