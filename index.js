// import { ApolloServer, PubSub } from "apollo-server";
import pkg from "apollo-server-express";
import pkg2 from "apollo-server";
const { ApolloServer } = pkg;
const { PubSub } = pkg2;

import mongoose from "mongoose";
import express from "express";

import { MONGO_DB } from "./config.js";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers/index.js";

const pubsub = new PubSub();
const PORT = process.env.PORT;

const server = new ApolloServer({
  subscriptions: { path: "/subscriptions" },
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req, pubsub }),
});

const URL = "https://qampus-app.herokuapp.com";

const app = express();

var corsOptions = {
  origin: "https://qampus-app.web.app",
  credentials: true,
};

await server.start();
server.applyMiddleware({ app, cors: corsOptions });

mongoose
  .connect(MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    return app.listen({ port: PORT || 5000 });
  })
  .then((res) => {
    console.log(`Server running at ${URL}${server.graphqlPath}`);
  })
  .catch((err) => console.log("Error: ", err));
