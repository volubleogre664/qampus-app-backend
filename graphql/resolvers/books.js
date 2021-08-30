const { UserInputError } = require("apollo-server-express");
const { Book } = require("../../models/index.js");
const { checkAuth, validators } = require("../../utils/index.js");
const { validateBookInput } = validators;

const bookResolvers = {
  Mutation: {
    async uploadBook(_, { bookInput }, context) {
      // Confirm the current logged in user
      const user = checkAuth(context);

      // Validate the Book data sent
      const { errors, valid } = validateBookInput(bookInput);

      // Throw errors if book data is not valid
      if (!valid) {
        throw new UserInputError("Error uploading book data", { errors });
      }

      // Check if the logged in user is the owner of the book  being uploaded
      if (bookInput.studentNumber !== user.studentNumber) {
        throw new UserInputError("Action not allowed", {
          errors: {
            studentNumber: "Cannot add book with another student Number",
          },
        });
      }

      // Check if user does not have this book already uploaded
      // In SQL
      // SELECT id FROM Book WHERE Book.isbn = bookInput.isbn AND
      // WHERE Book.studentNumber = bookInput.studentNumber
      const bookExist = await Book.findOne(
        {
          isbn: bookInput.isbn,
          studentNumber: bookInput.studentNumber,
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
        subtitle: bookInput.subtitle || "",
        authors: bookInput.authors,
        price: bookInput.price,
        description: bookInput.description || "",
        moduleCode: bookInput.moduleCode || "",
        studentNumber: bookInput.studentNumber,
        frontCover: bookInput.frontCover || "",
        backCover: bookInput.backCover || "",
      });

      // Save the book to database
      const res = await newBook.save();

      // Return the saved book back to the client
      return res;
    },

    async deleteBook(_, { bookId }, context) {
      // Confirm the logged in user
      const user = checkAuth(context);

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
        if (user.studentNumber !== book.studentNumber) {
          throw new Error("An error occured while deleting book", {
            errors: {
              book: "Cannot delete book a you do not own",
            },
          });
        }

        // If no error thrown then delete the book
        await book.delete();

        // return this... Still need to work on errors: like how to structure
        return `${book._id}`;
      } catch (err) {
        throw new Error("An error occured while deleting book", {
          errors: err,
        });
      }
    },

    async editBook(_, { bookId, price, isBought }, context) {
      checkAuth(context);

      // NOTE: Add some code to make sure that everyone who wants
      // this book is notified that this book has been sold,
      // Still need to find a way to actually do that

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

    async searchBook(_, { searchStr }) {
      try {
        // const query = {
        //   $text: { $search: searchStr },
        // };

        const res = await Book.aggregate([
          {
            $search: {
              text: {
                query: searchStr,
                path: ["title", "isbn", "moduleCode"],
              },
            },
          },
          {
            $limit: 10,
          },
        ]);

        return res.map((book) => ({ id: book._id, ...book }));
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

    async getBooks(_, { studentNumber }) {
      try {
        const books = await Book.find({ studentNumber });

        return books;
      } catch (err) {
        throw new Error("An error occured while getting the books", {
          errors: err,
        });
      }
    },

    async getBookTitles() {
      try {
        const bookTitles = await Book.find({}, { title: 1 });

        return bookTitles;
      } catch (err) {
        throw new Error("Could not find the book titles", {
          errors: err,
        });
      }
    },
  },
};

module.exports = bookResolvers;
