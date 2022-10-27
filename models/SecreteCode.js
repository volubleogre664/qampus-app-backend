const { model, Schema } = require("mongoose");

const codeSchema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: new Date() },
});

module.exports = model("SecreteCode", codeSchema);
