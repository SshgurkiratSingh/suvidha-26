require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { app } = require("./app");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected to Socket:", socket.id);

  // Kiosk joins a room using the Application ID
  socket.on("join_kiosk_room", (appId) => {
    socket.join(appId);
    console.log(`Socket ${socket.id} joined room: ${appId}`);
  });

  // Mobile phone sends this when an upload is successful
  socket.on("document_uploaded", (data) => {
    // Forward the event to the kiosk in the specific room
    // Mapping 'document_uploaded' (from phone) to 'file_uploaded' (to kiosk)
    io.to(data.appId).emit("file_uploaded", {
      docType: data.docType,
      fileUrl: data.fileUrl || "uploaded_via_mobile",
      status: data.status || "UPLOADED" 
    });
    console.log(`Relayed upload event for AppID: ${data.appId}, DocType: ${data.docType}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`API & Socket listening on ${HOST}:${PORT}`);
});
