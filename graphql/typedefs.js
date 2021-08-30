const gql = require("graphql-tag");

module.exports = gql`
  type User {
    id: ID!
    studentNumber: String!
    firstName: String!
    lastName: String!
    email: String
    picture: String
    degree: String
    bio: String
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
    studentNumber: String!
    frontCover: String
    backCover: String
  }

  type Message {
    id: ID!
    time: String!
    from: String!
    to: String!
    textMsg: String!
    book: Book
  }

  type BookTitle {
    id: ID!
    title: String!
  }

  input RegisterInput {
    studentNumber: String!
    firstName: String!
    lastName: String!
    email: String
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
    studentNumber: String!
    frontCover: String
    backCover: String
  }

  input UpdateInput {
    firstName: String
    lastName: String
    email: String
    picture: String
    degree: String
    bio: String
    newPassword: String
    confirmNewPassword: String
    password: String
  }

  type Query {
    getUserData(studentNumber: String!): User!
    getBook(bookId: ID!): Book!
    getBooks(studentNumber: String!): [Book]
    getBookTitles: [BookTitle]
    getMessages(to: ID!, from: ID!, messagesLength: Float!): [Message]
  }

  type Mutation {
    register(registerInput: RegisterInput!): User!
    login(studentNumber: String!, password: String!): User!
    updateUser(updateInput: UpdateInput!): User!
    uploadBook(bookInput: BookInput!): Book!
    deleteBook(bookId: ID!): String!
    searchBook(searchStr: String!): [Book]
    editBook(bookId: ID!, price: Float!, isBought: Boolean): Book!
    addMessage(to: ID!, textMsg: String!, book: ID): Message!
  }

  type Subscription {
    newMessage(to: ID!): Message!
    userUpdated(id: ID!): User!
  }
`;
