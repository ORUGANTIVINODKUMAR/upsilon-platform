import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import { verifyWebsiteMailer } from "./config/websiteMail.js";
import { startDailyLeaveSummaryScheduler } from "./services/dailyLeaveSummaryScheduler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await verifyWebsiteMailer();
  startDailyLeaveSummaryScheduler();
  console.log("NODE_ENV =", process.env.NODE_ENV);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed", { message: error.message, stack: error.stack });
  process.exit(1);
});
