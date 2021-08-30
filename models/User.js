const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  studentNumber: String,
  firstName: String,
  lastName: String,
  email: String,
  picture: String,
  degree: String,
  bio: String,
  contacts: [Schema.Types.ObjectId],
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
