const { model, Schema } = require("mongoose");

const passwordSchema = new Schema({
  owner: String,
  current: String,
  secure: String,
  secureUsed: { type: Boolean, default: false },
  resetRequest: { type: Boolean, default: true },
});

const PasswordSchema = model("PasswordReset", passwordSchema);

module.exports = PasswordSchema;
