const { model, Schema } = require("mongoose");

const msgSchema = new Schema({
  to: Schema.Types.ObjectId,
  from: Schema.Types.ObjectId,
  time: String,
  attachment: String,
  textMsg: String,
  book: Schema.Types.ObjectId,
  expireAt: {
    type: Date,
    dafault: () => {
      let date = new Date();
      return date.setDate(date.getDate() + 90);
    },
  },
});

module.exports = model("Message", msgSchema);
