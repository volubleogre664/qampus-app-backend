const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1246971",
  key: "41d4fac173171c8b65aa",
  secret: "7b85ba1d87bad5d16c54",
  cluster: "ap2",
  useTLS: true,
});

module.exports = pusher;
