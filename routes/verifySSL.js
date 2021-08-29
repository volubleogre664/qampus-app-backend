const path = require("path");

module.exports = function verifySSL(req, res) {
  res.sendFile(path.resolve("./") + "/ssl-confirm.txt");
};
