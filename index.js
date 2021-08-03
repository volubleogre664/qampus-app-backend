// import { ApolloServer, PubSub } from "apollo-server";
import pkg from "apollo-server-express";
// import fs from "fs";
// import path from "path";
const { ApolloServer } = pkg;
import { PubSub } from "graphql-subscriptions";
import { execute, subscribe } from "graphql";
import { createServer } from "https";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";

import mongoose from "mongoose";
import express from "express";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";

const schema = makeExecutableSchema({ typeDefs, resolvers });
const pubsub = new PubSub();
const PORT = process.env.PORT || 5500;
const URL = "https://qampus-app.herokuapp.com";
// const URL = "http://localhost";
const corsOptions = {
  origin: "https://qampus-app.web.app",
  credentials: true,
};

const app = express();
const httpServer = createServer(app);
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({ req, pubsub }),
});

app.get(
  "/.well-known/pki-validation/9846C84BCF4D037C7AEC39D28E98CB88.txt",
  async function (req, res) {
    res.sendFile("./9846C84BCF4D037C7AEC39D28E98CB88.txt", { root: "/" });
  }
);

await server.start();
server.applyMiddleware({ app, cors: corsOptions });

const subscriptionServer = SubscriptionServer.create(
  { schema, execute, subscribe },
  {
    server: httpServer,
    path: server.graphqlPath + "/subscriptions",
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
    console.log(`Server running at ${URL}${server.graphqlPath}:${PORT}`);
  })
  .catch((err) => console.log("Error: ", err));
