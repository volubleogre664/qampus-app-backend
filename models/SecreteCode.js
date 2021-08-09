import mongoose from "mongoose";
const { model, Schema } = mongoose;

const codeSchema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

export default model("SecreteCode", codeSchema);
