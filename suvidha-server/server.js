const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // In production, limit this to your kiosk URL
});

io.on('connection', (socket) => {
  console.log('Device connected:', socket.id);

  // Kiosk joins a room using the Application ID
  socket.on('join_kiosk_room', (appId) => {
    socket.join(appId);
    console.log(`Kiosk joined room: ${appId}`);
  });

  // Mobile phone sends this when an upload is successful
  socket.on('document_uploaded', (data) => {
    // data = { appId: 'GAS-123', docType: 'Aadhaar', status: 'UPLOADED' }
    io.to(data.appId).emit('sync_update', data);
    console.log(`Sync update sent to Kiosk ${data.appId} for ${data.docType}`);
  });

  socket.on('disconnect', () => console.log('Device disconnected'));
});

server.listen(3001, () => console.log('Suvidha Sync Server running on port 3001'));