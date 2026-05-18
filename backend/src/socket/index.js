const jwt = require("jsonwebtoken");
const env = require("../config/env");
const notificationService = require("../services/notificationService");
const logger = require("../config/logger");

function initSocket(io) {
  notificationService.setSocketIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.info({ event: "socket_connected", userId: socket.userId });
    }

    socket.on("join_doctor_slots", ({ doctorId, date }) => {
      socket.join(`slots:${doctorId}:${date}`);
    });

    socket.on("disconnect", () => {
      logger.info({ event: "socket_disconnected", socketId: socket.id });
    });
  });
}

module.exports = initSocket;
