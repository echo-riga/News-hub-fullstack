import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js"; // Express app
import initLikeSockets from "./sockets/likeSockets.js";
import initCommentSockets from "./sockets/commentSockets.js";

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"],
  },
});

initLikeSockets(io);
initCommentSockets(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
});
