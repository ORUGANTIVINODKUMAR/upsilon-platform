import "./config/env.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import { verifyWebsiteMailer } from "./config/websiteMail.js";
import { startDailyLeaveSummaryScheduler } from "./services/dailyLeaveSummaryScheduler.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const mailReady = await verifyWebsiteMailer();
  if (mailReady) {
    startDailyLeaveSummaryScheduler();
  } else {
    console.warn(
      "[daily-leave-summary] Scheduler paused because SMTP verification failed. Fix the email provider configuration and restart the server."
    );
  }
  console.log("NODE_ENV =", process.env.NODE_ENV);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed", { message: error.message, stack: error.stack });
  process.exit(1);
});
