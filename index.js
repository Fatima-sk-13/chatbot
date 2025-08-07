//index.js

// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require("sharp"); // ⬅️ Add this at the top with other imports


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

app.post("/chat", async (req, res) => {
  const { message, images = [], history } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: "API key is missing in .env file." });
  }

  try {
    const resizeRegex = /resize\s+to\s+(\d+)\s*[x×]\s*(\d+)/i;
    const match = message?.match(resizeRegex);

    // ✅ If message contains "resize to WIDTHxHEIGHT"
    if (match && images.length > 0) {
      const width = parseInt(match[1]);
      const height = parseInt(match[2]);
      const resizedImages = [];

      for (const base64 of images) {
        const buffer = Buffer.from(base64, "base64");
        const resizedBuffer = await sharp(buffer)
          .resize(width, height)
          .toFormat("jpeg")
          .toBuffer();
        resizedImages.push(resizedBuffer.toString("base64"));
      }

      return res.json({
        reply: `Here's your resized image(s) to ${width}×${height}.`,
        resizedImages
      });
    }

    // 🔁 Otherwise, fallback to Gemini response
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chatHistory = history && Array.isArray(history)
      ? history
          .filter(msg => msg.role && msg.content)
          .map(msg => ({
            role: msg.role === "bot" ? "model" : "user",
            parts: [{ text: msg.content }]
          }))
      : [];

    const parts = [];

    if (Array.isArray(images) && images.length > 0) {
      images.forEach((base64) => {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64
          }
        });
      });
    }

    if (message) {
      parts.push({ text: message });
    }

    const contents = [...chatHistory, { role: "user", parts }];
    const result = await model.generateContent({ contents });

    const response = result.response;
    const reply = response.text();

    res.json({ reply });

  } catch (error) {
    console.error("Gemini API error:", error.message);
    const message = error.message || "";

    if (message.includes("503") || message.toLowerCase().includes("overloaded")) {
      res.status(503).json({ reply: "Gemini is currently overloaded. Please try again shortly." });
    } else if (message.includes("429")) {
      res.status(429).json({ reply: "Rate limit hit. Try again later." });
    } else {
      res.status(500).json({ reply: "Gemini error: " + message });
    }
  }
});
// ← Closing for app.post

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
