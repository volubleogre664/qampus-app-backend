import mongoose from "mongoose";
const { model, Schema } = mongoose;

const msgSchema = new Schema({
  to: Schema.Types.ObjectId,
  from: Schema.Types.ObjectId,
  time: String,
  textMsg: String,
  book: Schema.Types.ObjectId,
});

export default model("Message", msgSchema);
