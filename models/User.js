const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  picture: String,
  degree: String,
  university: String,
  campus: String,
  gender: String,
  contacts: [Schema.Types.ObjectId],
  blockedContacts: [Schema.Types.ObjectId],
  password: String,
  status: {
    type: String,
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports = model("User", userSchema);
