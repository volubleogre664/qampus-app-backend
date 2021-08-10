import pkg from "apollo-server-express";
const { ApolloServer } = pkg;
import { makeExecutableSchema } from "@graphql-tools/schema";

import mongoose from "mongoose";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";
import { verifyEmail, verifySSL } from "./routes/index.js";
import dotenv from "dotenv";
dotenv.config();

const schema = makeExecutableSchema({ typeDefs, resolvers });
const PORT = process.env.PORT || 5000;
const URL = process.env.SERVER_URL;

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};

const app = express();
app.get("/auth/verification/verify-email/:userId/:secreteCode", verifyEmail);
app.get(
  "/.well-known/acme-challenge/LqLTlFHkdOHfdUUtdJ9xYK9ij2Ne7b4wBAY73dBrVZc",
  verifySSL
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ req, io }),
});

(async () => {
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions });
})();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.user;

  socket.join(userId);

  socket.on("disconnect", () => {
    socket.leave(userId);
  });
});

mongoose
  .connect(MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    return httpServer.listen({ port: PORT });
  })
  .then(() => {
    console.log(`Server running at ${URL}:${PORT}${server.graphqlPath}`);
  })
  .catch((err) => console.log("Error: ", err));
