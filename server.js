// install socket.io using 'npm i socket.io'
// run the server using 'node server.js'

const PORT = 5000;
const IO = require("socket.io")(PORT, {
  cors: {
    origin: "*",
  },
});

IO.on("connection", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on("emit-SDP", (obj) => {
    console.log("exchanging SDP...");
    socket.broadcast.emit("get-SDP", obj); // broadcast doesn't send the sender
  });

  socket.on("line-busy", () => {
    socket.broadcast.emit("line-busy", null);
  });

  socket.on("view-video", (videoType) => {
    socket.broadcast.emit("view-video", videoType);
  });

  socket.on("share-state", (state) => {
    socket.broadcast.emit("share-state", state);
  });
});

IO.on("error", (err) => {
  console.log(err);
});
