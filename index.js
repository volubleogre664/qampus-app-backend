// import { ApolloServer, PubSub } from "apollo-server";
import pkg from "apollo-server";
const { ApolloServer, PubSub } = pkg;

import mongoose from "mongoose";

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

mongoose
  .connect(MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
    return server.listen({ port: PORT || 5000 });
  })
  .then((res) => {
    console.log(`Server running at ${res.url}`);
  })
  .catch((err) => console.log("Error: ", err));
