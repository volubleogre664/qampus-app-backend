// Mongo Password --> g5BtqXEHBmEucmWD
module.exports.MONGO_DB =
  "mongodb+srv://app-admin:g5BtqXEHBmEucmWD@cluster0.nton2.mongodb.net/qampus-db?retryWrites=true&w=majority";

// The local mongodb connection string
// module.exports.MONGO_DB = "mongodb://localhost:27017/qampus-db";
module.exports.SECRET_KEY = "**QampusApp**Welcome to the new era";

module.exports.permissions = {
  read: ["public_content", "own_content", "related_content"],
  write: ["own_content", "new_content"],
};
