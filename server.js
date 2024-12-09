const path = require("path");
const cors = require("cors");
const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
// const socketio = require("socket.io");
const { Server } = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Your Live Server URL
    methods: ["GET", "POST"], // HTTP methods to allow
  })
);


const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500", // Allow Live Server
    methods: ["GET", "POST"], // Allowed HTTP methods
  },
});

// socketio(server, {
//     cors: {
//       origin: 'http://localhost:5500',  // Change to your Live Server URL or frontend URL
//       methods: ['GET', 'POST']
//     }
//   });

app.use(express.static(path.join(__dirname, "public")));

// app.get('/', (req,res)=>{
//     res.sendFile(path.join(__dirname, 'public'));
// })

// use(express.static(path.join(__dirname, 'public')))

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    const robotName = "ChatCord Bot";
    socket.emit("message", formatMessage(robotName, "Welcome to ChatCord"));

    // Broadcast when a user connects to everyone except for user connecting
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(robotName, `${user.username}   has joined the chat`)
      );

    io.to(user.room).emit('roomUsers', {
      room : user.room,
      users: getRoomUsers(user.room)
    })
  });
  // console.log('A user connected');

  // Example event
  // socket.on('chatMessage', (message) => {
  //   console.log('Message received:', message);
  //   io.emit('message', message);
  // });

  // socket.on('disconnect', () => {
  //   console.log('A user disconnected');
  // });
  // single client emitting

  // // Broadcast to everyone including user
  const robotName = "ChatCord Bot";
  // io.emit();
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    console.log(msg);
    io.to(user.room).emit("message", formatMessage(`${user.username}`, msg));
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
    io.to(user.room).emit("message", formatMessage(robotName, `${user.username}  has left the chat`));

    io.to(user.room).emit('roomUsers', {
      room : user.room,
      users: getRoomUsers(user.room)
    })
    }
  });

  // Listen for chatmessage
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
