import pkg from "apollo-server-express";
const { ApolloServer } = pkg;
import { PubSub } from "apollo-server";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";

import mongoose from "mongoose";
import express from "express";
import { createServer } from "http";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";
import { verifyEmail, verifySSL } from "./routes/index.js";
import dotenv from "dotenv";
dotenv.config();

const schema = makeExecutableSchema({ typeDefs, resolvers });
const pubsub = new PubSub();
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
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ req, pubsub }),
});

(async () => {
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions });
})();

const subscriptionServer = SubscriptionServer.create(
  { schema, execute, subscribe },
  {
    server: httpServer,
    path: "wss:://server.qampus.co.za" + server.graphqlPath + "/subscriptions",
  }
);

// Shut down in the case of interrupt and termination signals
// We expect to handle this more cleanly in the future. See (#5074)[https://github.com/apollographql/apollo-server/issues/5074] for reference.
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => subscriptionServer.close());
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
