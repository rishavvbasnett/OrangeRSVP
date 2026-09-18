import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoMemoryServer: MongoMemoryServer;

const connect = async () => {
  mongoMemoryServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(mongoMemoryServer.getUri());
};

const disconnect = async () => {
  await mongoose.disconnect();
  await mongoMemoryServer.stop();
};

const mongoServer = {
  connect,
  disconnect,
};

export default mongoServer;
