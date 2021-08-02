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
  isBought: {
    type: Boolean,
    default: false,
  },
  bookBuyers: [Schema.Types.ObjectId],
  expireAt: {
    type: Date,
    default: new Date("July 27, 2021 14:14:00"),
  },
});

const Book = model("Book", bookSchema);

// Book.createIndexes({ expireAt: 1, expireAfterSeconds: 0 }, (err) => {
//   if (err) {
//     console.log("Error creating expiredAt index for Book: \n", err);
//   }
// });

export default Book;
