class OnlineUsers {
  constructor() {
    this.users = new Map();
  }

  set setUser({ userId, socketId }) {
    if (!this.users.has(userId)) {
      this.users.set(userId, [socketId]);
    } else {
      this.users.get(userId).push(socketId);
    }

    console.log(this.users);
  }

  getUsers(userId) {
    if (userId) {
      return {
        userId,
        socketId: this.users.get(userId),
      };
    }
  }

  deleteUser(userId, socketId) {
    if (this.users.has(userId)) {
      let socketIds = this.users.get(userId);
      socketIds = socketIds.filter((items) => items === socketId);
      this.users.set(userId, socketIds);

      if (socketIds.length === 0) {
        this.users.delete(userId);
      }
    }
  }
}

export default OnlineUsers;
