const { gql } = require("apollo-server-express");

module.exports = gql`
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    picture: String
    degree: String
    university: String
    campus: String
    gender: String
    contacts: [User]
    token: String
  }

  type Book {
    id: ID!
    isbn: String!
    title: String!
    subtitle: String
    authors: String!
    price: Float!
    description: String
    moduleCode: String
    bookOwner: ID!
    frontCover: String
    backCover: String
  }

  type Message {
    id: ID!
    time: String!
    from: String!
    to: String!
    textMsg: String
    attachment: String
    book: Book
  }

  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    confirmPassword: String!
  }

  input BookInput {
    isbn: String!
    title: String!
    subtitle: String
    moduleCode: String
    authors: String
    price: Float!
    description: String
    frontCover: String
    backCover: String
  }

  input UpdateInput {
    firstName: String
    lastName: String
    picture: String
    degree: String
    university: String
    campus: String
    gender: String
    newPassword: String
    confirmNewPassword: String
    password: String
  }

  type Query {
    getUserData(id: ID!): User!
    getBook(bookId: ID!): Book!
    getBooks(bookOwner: ID!): [Book]
    getMessages(to: ID!, from: ID!, messagesLength: Float!): [Message]
  }

  type Mutation {
    register(registerInput: RegisterInput!): User!
    login(email: String!, password: String!): User!
    updateUser(updateInput: UpdateInput!): User!
    uploadBook(bookInput: BookInput!): Book!
    deleteBook(bookId: ID!): String!
    searchBook(searchStr: String!): [Book]
    editBook(bookId: ID!, price: Float, isBought: Boolean): Book!
    addMessage(to: ID!, textMsg: String, attachment: String, book: ID): Message!
    forgotPassword(email: String!): String!
  }
`;
