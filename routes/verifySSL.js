const path = require("path");

module.exports = (req, res) => {
  res.sendFile(path.resolve("./") + "/ssl-confirm.txt");
};
