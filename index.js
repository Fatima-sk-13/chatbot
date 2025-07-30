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
app.use(express.json()); // Parse incoming JSON requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// Initialize Gemini API client using API key from .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST endpoint to handle chat messages
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  // Check if API key is missing
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: "API key is missing in .env file." });
  }

  try {
    // Get the generative model (1.5-flash is free tier)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Send user message to Gemini API
    const result = await model.generateContent(userMessage);

    // Get the text reply from the response
    const response = result.response;
    const reply = response.text();

    // Send the reply back to the frontend
    res.json({ reply });

  } catch (error) {
    // Log the error to the server console
    console.error("Gemini API error:", error.message);

    // Try to extract a status code from the error
    const statusCode = error.status || error.response?.status;

    // Handle specific known errors
    if (statusCode === 429) {
      res.status(429).json({ reply: "Too many requests — you've hit the rate limit. Try again in a few minutes." });
    } else if (statusCode === 503) {
      res.status(503).json({ reply: "Gemini API is overloaded or temporarily unavailable. Try again later." });
    } else if (statusCode === 401 || statusCode === 403) {
      res.status(403).json({ reply: "Unauthorized or billing required. Check your API key and billing settings." });
    } else {
      // Catch-all error message
      res.status(500).json({ reply: "Unknown error from Gemini API. Please try again." });
    }
  }
}); // ← Closing for app.post

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
