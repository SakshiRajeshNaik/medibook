const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/database");
const env = require("./config/env");
const logger = require("./config/logger");
const initSocket = require("./socket");

const start = async () => {
  await connectDB(env.mongoUri);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientUrl, methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  initSocket(io);

  server.listen(env.port, () => {
    logger.info(`API listening on port ${env.port}`);
  });
};

start().catch((err) => {
  logger.error({ err, message: "Failed to start server" });
  process.exit(1);
});
