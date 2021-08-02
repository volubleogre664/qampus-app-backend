import userResolvers from "./users.js";
import bookResolvers from "./books.js";
import messageResolvers from "./messages.js";

export default {
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
  Subscription: {
    ...messageResolvers.Subscription,
    ...userResolvers.Subscription,
  },
};
