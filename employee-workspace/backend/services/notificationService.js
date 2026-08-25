import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipientId,
  type = "System",
  title,
  message,
  link = "",
}) => {
  return await Notification.create({
    recipientId,
    type,
    title,
    message,
    link,
  });
};