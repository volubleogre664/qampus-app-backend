import Pusher from "pusher";

const pusher = new Pusher({
  appId: "1246122",
  key: "f523c38f2bbdfcdad753",
  secret: "a389515476d5a1439694",
  cluster: "ap2",
  useTLS: true,
});

export default pusher;
