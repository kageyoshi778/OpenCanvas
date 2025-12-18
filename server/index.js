const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();


const app=express();
const server= http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('welcome', 'Welcome to the chat server!');
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('server is runing!');
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
})

// AI generation endpoint

const axios = require('axios');
require('dotenv').config();


app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  // This is the system instruction that teaches the model to respond with JSON
  const systemInstruction = `
You are an AI assistant that helps control a collaborative whiteboard.
Your task is to generate JSON responses based on user commands.

Respond ONLY in valid JSON using this format:
{
  "action": "draw",
  "shape": "rectangle",
  "x": 120,
  "y": 150,
  "width": 80,
  "height": 60,
  "color": "#69B5BE"
}

Supported actions: draw, move, resize, delete  
Supported shapes: rectangle, circle, line, text  
Return only the JSON. Do not explain.
`;

  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'gemma3',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      stream: false
    });

    const reply = response.data.message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate structured response" });
  }
});
