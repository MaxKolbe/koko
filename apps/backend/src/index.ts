import app from "./app.js";
import { connectDatabase } from "./db/db.js";
import logger from "./configs/logger.config.js";

const port = process.env.PORT || 3000;

(async () => {
  await connectDatabase();
})();

app.listen(port, () => {
  logger.info(`Server running on port: ${port}`);
});
