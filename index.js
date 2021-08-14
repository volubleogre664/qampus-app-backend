import pkg from "apollo-server-express";
const { ApolloServer } = pkg;
import { makeExecutableSchema } from "@graphql-tools/schema";

import mongoose from "mongoose";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { buildContext } from "graphql-passport";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";
import { verifyEmail, verifySSL } from "./routes/index.js";
import dotenv from "dotenv";
dotenv.config();

const schema = makeExecutableSchema({ typeDefs, resolvers });
const PORT = process.env.PORT;
const URL = process.env.SERVER_URL;

const corsOptions = {
  origin: "http://127.0.0.1:3000",
  credentials: true,
};

const app = express();

app.use(
  session({
    secret: process.env.MONGO_STORE_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_SESSION_STORE_URL,
      collectionName: "sessions",
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
    cookie: {
      maxAge: 60 * 60 * 24 * 2 * 1000, // Max age for the cookie is set to 2 days
      sameSite: "none",
      secure: "auto",
      path: "/graphql",
      domain: "none",
    },
  })
);

import "./utils/passport.js";
app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  schema,
  context: ({ req, res }) =>
    buildContext({
      req,
      res,
      io,
    }),
});

(async () => {
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions });
})();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.user;

  socket.join(userId);

  socket.on("disconnect", () => {
    socket.leave(userId);
  });
});

app.get("/auth/verification/verify-email/:userId/:secreteCode", verifyEmail);
app.get(
  "/.well-known/acme-challenge/LqLTlFHkdOHfdUUtdJ9xYK9ij2Ne7b4wBAY73dBrVZc",
  verifySSL
);

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
