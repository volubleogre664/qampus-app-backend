import dayjs from "dayjs";
import pkg from "apollo-server";
const { AuthenticationError, UserInputError, withFilter } = pkg;

import { Book, User, Message } from "../../models/index.js";
import { sendEmail, checkAuth } from "../../utils/index.js";

const messageResolvers = {
  Query: {
    async getMessages(_, { to, from, messagesLength }, context) {
      const user = checkAuth(context);

      try {
        if (from !== user.id) {
          throw new AuthenticationError("Cannot get other users messages", {
            errors: {
              user: "Cannot query data you don't own",
            },
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
          if (msg.book) {
            let { book, ...newMsg } = { ...msg._doc, id: msg._id };
            newMsg.book = getBook(msg.book);
            messagesBooks.push(newMsg);
          } else {
            messagesBooks.push(msg);
          }
        });

        messages = null;

        return messagesBooks;
      } catch (err) {
        throw new Error("Errors getting your messages", {
          errors: err,
        });
      }
    },
  },
  Mutation: {
    async addMessage(_, { to, textMsg, book }, context) {
      // Check user priviledge for doing this
      let user = checkAuth(context);
      const { io } = context;

      try {
        // Get user data from database. toUser is message receiver
        // In SQL
        // SELECT * FROM User WHERE User.id = (to | user.id) -> For both user and toUser
        const toUser = await User.findById(to);
        user = await User.findById(user.id);

        // console.log(toUser);
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
          textMsg,
          book,
        };

        // Here we create message document or Row Relational Tables
        const message = new Message(msgObject);

        // Find the check if two people are connected and update their data accordingly
        updateUserContacts(user, toUser);

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

        console.log("this means emit ran");

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
  Subscription: {
    newMessage: {
      // Where data is sent in Realtime to the client of the message Receiver
      // Makes sure the message is only sent to the required client and not everyone
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("NEW_MESSAGE"),
        ({ newMessage: message }, variables) => {
          console.log(variables);
          return variables.to === message.to && variables.to !== message.from;
        }
      ),
    },
  },
};

// Connect both users by adding their contacts to each other
async function updateUserContacts(user, toUser) {
  if (!user.contacts.includes(toUser.id)) {
    user.contacts.push(toUser.id);
    await user.save();
  }

  if (!toUser.contacts.includes(user.id)) {
    toUser.contacts.push(user.id);

    await toUser.save();
  }
}

export default messageResolvers;
