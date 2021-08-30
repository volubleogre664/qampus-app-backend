const userResolvers = require("./users.js");
const bookResolvers = require("./books.js");
const messageResolvers = require("./messages.js");

module.exports = {
  Query: {
    ...bookResolvers.Query,
    ...messageResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...bookResolvers.Mutation,
    ...messageResolvers.Mutation,
  },
};
