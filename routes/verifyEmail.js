import { User, SecreteCode } from "../models/index.js";

async function verifyEmail(req, res) {
  const { userId, secreteCode } = req.params;

  const user = await User.findById(userId);

  if (!user || user?.status !== "pending") {
    // Do something here or show the user something
    return;
  }

  const secret = await SecreteCode.find({ email: user.email });
  if (!secret || secreteCode !== secret.code) {
    // Do something like show the user some error or something
    return;
  }

  user.status = "confirmed";
  await user.save();

  // Show the user something here or simply redirect them
  res.redirect(process.env.CLIENT_URL);
}

export default verifyEmail;
