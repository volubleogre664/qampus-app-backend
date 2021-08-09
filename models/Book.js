import mongoose from "mongoose";
const { model, Schema } = mongoose;

const bookSchema = new Schema({
  isbn: String,
  title: String,
  subtitle: String,
  authors: String,
  price: Number,
  description: String,
  moduleCode: String,
  studentNumber: String,
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

export default Book;
