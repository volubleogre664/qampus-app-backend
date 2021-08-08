import pkg from "apollo-server-express";
const { ApolloServer } = pkg;
import { PubSub } from "graphql-subscriptions";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";

import mongoose from "mongoose";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer } from "http";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";

const schema = makeExecutableSchema({ typeDefs, resolvers });
const pubsub = new PubSub();
const PORT = process.env.PORT || 5000;
const URL = "https://qampus-app.herokuapp.com";
// const URL = "http://localhost";
const corsOptions = {
  origin: "*",
  credentials: true,
};

// const credentials = {
//   key: fs.readFileSync("./certificates/qampus-app.key"),
//   cert: fs.readFileSync("./certificates/certificate.crt"),
//   ca: fs.readFileSync("./certificates/ca_bundle.crt"),
//   passphrase: "",
// };

const app = express();
app.use(co);
// app.get(
//   "/.well-known/pki-validation/BD50D265FA690AB546CF754A60AF4C6D.txt",
//   async function (req, res) {
//     res.sendFile(path.resolve("./") + "/BD50D265FA690AB546CF754A60AF4C6D.txt");
//   }
// );
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
    console.log(`Server running at ${URL}:${PORT}${server.graphqlPath}`);
  })
  .catch((err) => console.log("Error: ", err));
