import { rule, shield, deny, allow } from "graphql-shield";

const isAuthenticated = rule()((parent, args, { req }) => {
  console.log(user);
  return req.user;
});

const permissions = shield({
  Query: {
    "*": allow,
    getUserData: isAuthenticated || deny,
    getMessages: isAuthenticated || deny,
  },
  Mutation: {
    "*": allow,
    uploadBook: isAuthenticated || deny,
    deleteBook: isAuthenticated || deny,
    editBook: isAuthenticated || deny,
    addMessage: isAuthenticated || deny,
    updateUser: isAuthenticated || deny,
  },
  "*": allow,
});

export { permissions };
