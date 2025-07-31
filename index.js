// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000; // You can change the port if needed

// Middleware to handle CORS, JSON requests, and serve static files
app.use(cors()); // Allow cross-origin requests
app.use(express.json({ limit: '10mb' }));  // Parse incoming JSON requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// Initialize Gemini API client using API key from .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST endpoint to handle chat messages
app.post('/chat', async (req, res) => {
  const { message, image,history } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: "API key is missing in .env file." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

     // ✅ Format chat history (if available) to keep context
    const chatHistory = history && Array.isArray(history)
    ? history
        .filter(msg => msg.role && msg.content)
        .map(msg => ({
          role: msg.role === "bot" ? "model" : "user", // Convert "bot" to "model"
          parts: [{ text: msg.content }]
        }))
    : [];


    const parts = [];

      if (image) {
        parts.push({
          inlineData: {
            mimeType: "image/png", // Or image/jpeg
            data: image
          }
        });
      }

      if (message) {
      parts.push({ text: message });
    }

    const contents = [
      ...chatHistory,
      { role: "user", parts }
    ];


      const result = await model.generateContent({ contents });

      const response = result.response;
      const reply = response.text();

      res.json({ reply });

    } catch (error) {
      console.error("Gemini API error:", error.message);
      const statusCode = error.status || error.response?.status;
      if (statusCode === 429) {
        res.status(429).json({ reply: "Rate limit hit. Try again later." });
      } else {
        res.status(500).json({ reply: "Gemini error: " + error.message });
      }
    }
  });// ← Closing for app.post

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
