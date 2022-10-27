const { model, Schema } = require("mongoose");

const bookSchema = new Schema({
  isbn: String,
  title: String,
  authors: String,
  price: Number,
  moduleCode: String,
  bookOwner: Schema.Types.ObjectId,
  frontCover: String,
  bookBuyers: [Schema.Types.ObjectId],
  isBought: {
    type: Boolean,
    default: false,
  },
  expireAt: {
    type: Date,
    default: () => {
      let date = new Date();
      return date.setDate(date.getDate() + 180);
    },
  },
});

const Book = model("Book", bookSchema);

module.exports = Book;
