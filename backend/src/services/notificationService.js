const Notification = require("../models/Notification");

let io = null;

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

exports.createNotification = async (userId, title, message, type = "info", meta = {}) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    meta,
  });
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
  return notification;
};

exports.notifySlotUpdate = (doctorId, date) => {
  if (io) {
    io.emit("slots_updated", { doctorId, date });
  }
};

exports.notifyAppointmentsUpdate = (userId) => {
  if (io) {
    io.to(`user:${userId}`).emit("appointments_updated");
    io.emit("appointments_updated");
  }
};

exports.notifyQueueUpdate = (doctorId, date, time) => {
  if (io) {
    io.emit("queue_updated", { doctorId, date, time });
  }
};
