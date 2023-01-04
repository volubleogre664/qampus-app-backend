const dayjs = require("dayjs");
const { ForbiddenError, UserInputError } = require("apollo-server-express");

const { Book, User, Message } = require("../../models/index.js");
const { sendEmail } = require("../../utils/index.js");
const isTokenValid = require("../../utils/validateToken.js");

const getBookDataForMessages = (messages) => {
  // To store the final array of messages to be sent to client side
  const messagesBooks = [];

  // Small function to get books by ID from DB
  // In SQL ->
  // SELECT * FROM Book WHERE Book.id = bookId
  const getBook = async (bookId) => await Book.findById(bookId);

  // Go through messages and find messages with books.
  // Messages with books have the ID of a book in them
  // Simply use the ID to get book Object and push to messagesBooks
  messages.forEach((msg) => {
    if (msg?.book) {
      let { book, ...newMsg } = { ...msg._doc, id: msg._id };
      newMsg.book = getBook(msg.book);
      messagesBooks.push(newMsg);
    } else {
      messagesBooks.push({ ...msg._doc, id: msg._id, book: null });
    }
  });

  messages = null;

  return messagesBooks;
};

const messageResolvers = {
  Query: {
    async getMessages(_, { to, from, messagesLength }, { req }) {
      try {
        const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
        if (error) {
          console.log(error);
          throw new ForbiddenError("Not Authorized", {
            errors: "not_auth",
          });
        }

        const docCount = await Message.countDocuments([
          {
            to: to,
            from: from,
          },
          {
            to: from,
            from: to,
          },
        ]);
        if (messagesLength >= docCount) {
          return [];
        }

        // Get messages from database.
        // In SQL ->
        // SELECT * FROM Message WHERE (Message.to=to AND Message.from=from) OR
        // (Message.to=from AND Message.from=to)
        let messages = await Message.find({}).or([
          {
            to: to,
            from: from,
          },
          {
            to: from,
            from: to,
          },
        ]);

        // Filter messages for only those that we need
        // Client side may have 10 Messages and database with 20
        // So only return 10 more to client and not all 20.
        messages =
          messages.length === messagesLength
            ? []
            : messages.slice(messagesLength);

        return getBookDataForMessages(messages);
      } catch (err) {
        throw new Error("Errors getting your messages", {
          errors: err,
        });
      }
    },

    async getAllUserMessages(_, { userId }, { req }) {
      try {
        const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
        if (error) {
          console.log(error);
          throw new ForbiddenError("Not Authorized", {
            errors: "not_auth",
          });
        }

        // Get all the user's messages from database
        // In SQL ->
        // SELECT * FROM Message WHERE to=userId OR from=userId
        let messages = await Message.find({}).or([
          { to: userId },
          { from: userId },
        ]);

        return getBookDataForMessages(messages);
      } catch (err) {}
    },
  },
  Mutation: {
    async addMessage(_, { to, from, textMsg, attachment, book }, { req, io }) {
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      console.log(book);

      try {
        // Get user data from database. toUser is message receiver
        // In SQL
        // SELECT * FROM User WHERE User.id = (to | user.id) -> For both user and toUser
        const toUser = await User.findById(to);
        const user = await User.findById(from);

        // If toUser does not exist then throw error that user does not exist
        if (!toUser) {
          throw new UserInputError(
            "Cannot find the person you are sending message to."
          );
        }

        // Create message object and save it in a mongoDB schema object
        const msgObject = {
          to,
          from: user.id,
          time: dayjs().toISOString(),
          attachment: attachment || "",
          textMsg,
          book,
        };

        // Here we create message document or Row Relational Tables
        const message = new Message(msgObject);

        // Find the check if two people are connected and update their data accordingly
        updateUserContacts(user, toUser, io);

        // Save the message to the database

        // Check if message contains a book
        // Gets the book from the database if it's available in message
        let bookObj = null;
        if (book) {
          bookObj = await Book.findById(book);

          if (!bookObj.bookBuyers.includes(user.id)) {
            bookObj.bookBuyers.push(user.id);
          }

          // Save the updated book to the database
          bookObj = await bookObj.save();

          // Send an email to bookOwner that someone wants their book
          if (bookObj) {
            sendEmail("BOOK_SALE", {
              buyer: {
                firstName: user.firstName,
                lastName: user.lastName,
              },
              seller: {
                firstName: toUser.firstName,
                lastName: toUser.lastName,
                email: toUser.email,
              },
              book: {
                title: bookObj.title,
                price: bookObj.price,
                frontCover: bookObj.frontCover,
              },
            });
          }
        }

        // Update the book to add people interested to it

        // Save the message to the database
        const res = await message.save();

        // Invoke a Socket.IO NEW_MESSAGE event to notify the message receiver
        io.to(to).emit("NEW_MESSAGE", {
          newMessage: { ...res._doc, id: res._id, book: bookObj },
        });

        // Return message to the client side
        return {
          ...res._doc,
          id: res._id,
          book: bookObj,
        };
      } catch (err) {
        throw new Error("Error sending message", {
          errors: err,
        });
      }
    },
  },
};

// Connect both users by adding their contacts to each other
async function updateUserContacts(user, toUser, io) {
  if (!user.contacts.includes(toUser.id)) {
    user.contacts.push(toUser.id);
    await user.save();
  }

  if (!toUser.contacts.includes(user.id)) {
    toUser.contacts.push(user.id);
    io.to(toUser.id).emit("USER_CONTACT_UPDATE", {
      contact: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
      },
    });

    await toUser.save();
  }
}

module.exports = messageResolvers;
