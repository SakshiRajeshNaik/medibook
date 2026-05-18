const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async (uri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("MongoDB connected");
};

module.exports = connectDB;
