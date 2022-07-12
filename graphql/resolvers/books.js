const { ForbiddenError, UserInputError } = require("apollo-server-express");
const { Book } = require("../../models/index.js");
const { validateBookInput } = require("../../utils/index.js").validators;

const bookResolvers = {
  Mutation: {
    async uploadBook(_, { bookInput }, { req }) {
      if (!req.user) {
        throw new ForbiddenError("Not Authorized", {
          error: "not_auth",
        });
      }

      // Validate the Book data sent
      const { errors, valid } = validateBookInput(bookInput);

      // Throw errors if book data is not valid
      if (!valid) {
        throw new UserInputError("Error uploading book data", { errors });
      }

      // Check if the logged in user is the owner of the book  being uploaded

      // Check if user does not have this book already uploaded
      // In SQL
      // SELECT id FROM Book WHERE Book.isbn = bookInput.isbn AND
      // WHERE Book.studentNumber = bookInput.studentNumber
      const bookExist = await Book.findOne(
        {
          isbn: bookInput.isbn,
          bookOwner: req.user.sub,
        },
        { id: 1 }
      );

      // throw error if book already exist
      if (bookExist) {
        throw new UserInputError("You already have this book uploaded", {
          errors: {
            book: "Book already exist in your collection",
          },
        });
      }

      // I no error has been throw the create the document or Row in Book table
      const newBook = new Book({
        isbn: bookInput.isbn,
        title: bookInput.title,
        authors: bookInput.authors,
        price: bookInput.price,
        moduleCode: bookInput.moduleCode,
        bookOwner: req.user.sub,
        frontCover: bookInput.frontCover,
      });

      // Save the book to database
      const res = await newBook.save();

      // Return the saved book back to the client
      return res;
    },

    async deleteBook(_, { bookId }, { req }) {
      if (!req.user) {
        throw new ForbiddenError("Not Authorized", {
          error: "not_auth",
        });
      }

      try {
        // Find the book to delete based with ID
        const book = await Book.findById(bookId);

        // If we find nothing throw an error
        if (!book) {
          throw new Error("An error occured while deleting book", {
            errors: {
              book: "Requested boook does not exist.",
            },
          });
        }

        // If user does not own the found book throw error
        if (req.user.sub != book?.bookOwner) {
          throw new Error("An error occured while deleting book", {
            errors: {
              book: "Cannot delete book a you do not own",
            },
          });
        }

        // If no error thrown then delete the book
        await book.delete();

        // return this... Still need to work on errors: like how to structure
        return `${bookId}`;
      } catch (err) {
        throw new Error("An error occured while deleting book", {
          errors: err,
        });
      }
    },

    async editBook(_, { bookId, price, isBought }, { req }) {
      // NOTE: Add some code to make sure that everyone who wants
      // this book is notified that this book has been sold,
      // Still need to find a way to actually do that
      if (!req.user.sub) {
        throw new ForbiddenError("Not Authorized", {
          error: "not_auth",
        });
      }

      try {
        const book = await Book.findById(bookId);

        if (!book) {
          throw new Error("Could not find the book you're looking for.");
        }

        if (book.price !== price) {
          book.price = price;
        }
        if (!book.isBought && isBought) {
          book.isBought = isBought;

          // TODO: Need to send message to everyone and let them know that the book has been sold
          // This will be achieved with the help of everyone that is interested in this book
        }

        return await book.save();
      } catch (err) {
        throw new UserInputError("Error finding your book", err);
      }
    },

    async searchBook(_, { searchStr }, { req }) {
      // console.log(searchStr);
      try {
        let res;
        if (searchStr === "") {
          res = await Book.find({}).limit(12);
        } else {
          res = await Book.find({ $text: { $search: searchStr } });
        }

        if (!!req?.user?.sub)
          res = res.filter((book) => book.bookOwner !== req.user.sub);

        return res
          .map((book) => ({
            id: book._id,
            isbn: book.isbn,
            title: book.title,
            price: book.price,
            bookOwner: book.bookOwner,
            moduleCode: book.moduleCode,
            authors: book.authors,
            frontCover: book.frontCover,
          }))
          .reverse();
      } catch (err) {
        throw new Error("Failed to search for the books");
      }
    },
  },
  Query: {
    async getBook(_, { bookId }) {
      try {
        const book = await Book.findById(bookId);
        if (!book) {
          throw new Error("Could not find required book", {
            errors: {
              book: "Requested book does not exist",
            },
          });
        }

        return book;
      } catch (err) {
        throw new Error("Could not find required book", {
          errors: err,
        });
      }
    },

    async getBooks(_, { bookOwner }) {
      try {
        const books = await Book.find({ bookOwner });

        return books;
      } catch (err) {
        throw new Error("An error occured while getting the books", {
          errors: err,
        });
      }
    },
  },
};

module.exports = bookResolvers;
