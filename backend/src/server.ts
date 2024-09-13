import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer'; 
import path from 'path'; 
import cors from 'cors'

const BUFFER: Record<string, ArrayBuffer[]> = {}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*"
}))

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// File storage setup using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Handle incoming stream data
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('stream:join', (roomId) => {
    socket.join(roomId)
  });

  socket.on('stream-data', (roomId, data: ArrayBuffer) => {
    let key = `${roomId}-${socket.id}`
    BUFFER[key] ??= []
    BUFFER[key].push(data)
    socket.broadcast.to(roomId).emit('stream', data, BUFFER[key]); // Send stream to other clients
  });

  socket.on('stop-stream', () => {
    console.log('Stream stopped');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Endpoint for saving the video
app.post('/save-video', upload.single('video'), (req, res) => {
// @ts-ignore
  res.send({ message: 'Video saved successfully', filename: req.file.filename });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
