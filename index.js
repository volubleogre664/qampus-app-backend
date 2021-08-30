const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const mongoose = require("mongoose");
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const { buildContext } = require("graphql-passport");

const { MONGO_DB } = require("./config.js");
const typeDefs = require("./graphql/typedefs.js");
const resolvers = require("./graphql/resolvers/index.js");
const { verifyEmail, verifySSL } = require("./routes/index.js");

require("dotenv").config();

const schema = makeExecutableSchema({ typeDefs, resolvers });
const PORT = process.env.PORT;
const URL = process.env.SERVER_URL;

const corsOptions = {
  origin: "https://studio.apollographql.com",
  credentials: true,
};

require("./utils/passport.js");

const app = express();
const httpServer = createServer(app);

app.use(cookieParser());
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

// const io = new Server(httpServer, {
//   cors: {
//     origin: "*",
//   },
// });

// io.on("connection", (socket) => {
//   const userId = socket.handshake.query.user;

//   socket.join(userId);

//   socket.on("disconnect", () => {
//     socket.leave(userId);
//   });
// });

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
