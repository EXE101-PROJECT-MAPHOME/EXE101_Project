const jwt = require("jsonwebtoken");
let ioInstance = null;

function initSocket(server) {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const envList = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
        const allowedOrigins = Array.from(new Set([process.env.FRONTEND_URL, ...envList].filter(Boolean)));
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        const isVercel = /^https?:\/\/.*\.vercel\.app$/.test(origin);
        const isRender = /^https?:\/\/.*\.onrender\.com$/.test(origin);
        
        if (allowedOrigins.includes(origin) || isLocalhost || isVercel || isRender) {
          return callback(null, true);
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
