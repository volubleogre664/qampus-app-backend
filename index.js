// import { ApolloServer, PubSub } from "apollo-server";
import pkg from "apollo-server-express";
const { ApolloServer } = pkg;
import { PubSub } from "graphql-subscriptions";
import { execute, subscribe } from "graphql";
import { createServer } from "http";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";

import mongoose from "mongoose";
import express from "express";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";

const pubsub = new PubSub();
const PORT = process.env.PORT;
const schema = makeExecutableSchema({ typeDefs, resolvers });
const URL = "https://qampus-app.herokuapp.com";
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

await server.start();
server.applyMiddleware({ app, cors: corsOptions });

const subscriptionServer = SubscriptionServer.create(
  {
    // This is the `schema` we just created.
    schema,
    // These are imported from `graphql`.
    execute,
    subscribe,
  },
  {
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // This `server` is the instance returned from `new ApolloServer`.
    path: server.graphqlPath + "/subscriptions",
  }
);

console.log(server.graphqlPath);

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
    return httpServer.listen({ port: PORT || 5000 });
  })
  .then((res) => {
    console.log(`Server running at ${URL}${server.graphqlPath}`);
  })
  .catch((err) => console.log("Error: ", err));
