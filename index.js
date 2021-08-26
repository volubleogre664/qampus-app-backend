import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import mongoose from "mongoose";
import express from "express";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createServer } from "http";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";
import { verifyEmail } from "./routes/index.js";
import dotenv from "dotenv";
dotenv.config();

// Setup some constants for the server
const schema = makeExecutableSchema({ typeDefs, resolvers });
const PORT = process.env.PORT;
const URL = process.env.SERVER_URL;

// Setup the cors options
const corsOptions = {
  origin: "https://qampus.co.za",
  credentials: true,
};

// Make an express app and apply the appropriate middlewares
const app = express();
// This middleware intercepts a token and try to get the user data from it
// If token is null it simply makes the default guest user
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    next();
    return;
  }

  let token = authHeader.split("Bearer ")[1];
  let user;
  if (!token) {
    user = undefined;
  } else {
    user = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
  }

  req.user = user;

  next();
});

// The route for verifying a user email after creating an account
app.get("/auth/verification/verify-email/:userId/:secreteCode", verifyEmail);

// Create the apollo-graphql server
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ req, io }),
});

// Start apollo-graphql server and apply the express app and cors as middlewares
(async () => {
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions });
})();

// Make httpServer from the express app
const httpServer = createServer(app);
// Make a Socket IO server from the httpServer
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Initiate Socket IO global events namely -> connection and disconnect
io.on("connection", (socket) => {
  const userId = socket.handshake.query.user;

  // When user connects make a SocketIO room with user id
  socket.join(userId);

  // When user disconnects end the SocketIO room of their id
  socket.on("disconnect", () => {
    socket.leave(userId);
  });
});

// Connect to MongoDB with mongoose
mongoose
  .connect(MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    // After connecting to Mongo start the httpServer on a certain port
    console.log("MongoDB Connected");
    return httpServer.listen({ port: PORT });
  })
  .then(() => {
    // After the server starts send a message to console that the server is running
    console.log(`Server running at ${URL}:${PORT}${server.graphqlPath}`);
  })
  .catch((err) => console.log("Error: ", err));
