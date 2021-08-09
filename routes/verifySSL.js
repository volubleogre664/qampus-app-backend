import path from "path";

export default function verifySSL(req, res) {
  res.sendFile(path.resolve("./") + "/ssl-confirm.txt");
}
