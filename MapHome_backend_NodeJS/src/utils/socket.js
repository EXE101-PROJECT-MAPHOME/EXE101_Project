const jwt = require("jsonwebtoken");
let ioInstance = null;

function initSocket(server) {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
          const userId =
            decoded.id || decoded._id || decoded.userId || decoded.id;
          const role = decoded.role;
          if (userId) {
            socket.join(`user_${userId}`);
          }
          if (role) {
            socket.join(`role_${role}`);
          }
        } catch (err) {
          // token verification failed; continue without user rooms
        }
      }

      socket.on("disconnect", () => {
        // no-op for now
      });
    } catch (err) {
      console.error("Socket connection error:", err);
    }
  });

  ioInstance = io;
  return io;
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };
