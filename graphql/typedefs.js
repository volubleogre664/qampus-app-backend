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
  }

  type Book {
    id: ID!
    isbn: String!
    title: String!
    authors: String!
    price: Float!
    moduleCode: String
    bookOwner: ID!
    frontCover: String
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
    picture: String
    university: String
    degree: String
    campus: String
    gender: String
  }

  input BookInput {
    isbn: String!
    title: String!
    moduleCode: String
    authors: String
    price: Float!
    frontCover: String!
    bookOwner: ID!
  }

  input UpdateInput {
    id: ID!
    firstName: String
    lastName: String
    picture: String
    degree: String
    university: String
    campus: String
    gender: String
  }

  type Query {
    getUserData(id: ID!): User!
    getBook(bookId: ID!): Book!
    getBooks(bookOwner: ID!): [Book]
    getMessages(to: ID!, from: ID!, messagesLength: Float!): [Message]
    getAllUserMessages(userId: ID!): [Message]
  }

  type Mutation {
    register(registerInput: RegisterInput!): User!
    login(email: String!, password: String!): User!
    updateUser(updateInput: UpdateInput!): User!
    uploadBook(bookInput: BookInput!): Book!
    deleteBook(bookId: ID!, bookOwner: ID!): String!
    searchBook(searchStr: String!): [Book]
    deleteContact(contactId: ID!, userId: ID!): String!
    blockContact(contactId: ID!, userId: ID!): String!
    unblockContact(contactId: ID!, userId: ID!): String!
    editBook(bookId: ID!, price: Float, isBought: Boolean): Book!
    addMessage(
      to: ID!
      from: ID!
      textMsg: String
      attachment: String
      book: ID
    ): Message!
    forgotPassword(email: String!): String!
  }
`;
