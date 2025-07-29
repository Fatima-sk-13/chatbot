// Import the required libraries
const express = require('express');      // Web framework for building the server
const axios = require('axios');          // Used to make HTTP requests (e.g., to Gemini API)
const dotenv = require('dotenv');        // Loads environment variables from a .env file
const path = require('path');            // Helps work with file and directory paths

// Load environment variables from the .env file
dotenv.config();

// Create an instance of an Express app
const app = express();

// Define the port number your server will run on
const PORT = 3000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to serve static files from the "public" folder (HTML, CSS, JS files)
app.use(express.static(path.join(__dirname, 'public')));

// Define a POST endpoint at "/chat" to handle chat messages
app.post('/chat', async (req, res) => {
  // Extract the user's message from the request body
  const userMessage = req.body.message;

  try {
    // Get the API key from the environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    // Send a request to Gemini API with the user's message
    const response = await axios.post(
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ]
      }
    );

    // Extract the bot's reply from the response
    const reply = response.data.candidates[0].content.parts[0].text;

    // Send the reply back to the frontend as JSON
    res.json({ reply });

  } catch (error) {
    // If there's an error (e.g., bad API key or quota exceeded), print the error
    console.error('Gemini API Error:', error.response?.data || error.message);

    // Respond with a 500 (Internal Server Error) and a message
    res.status(500).json({ reply: "Error from Gemini API" });
  }
});

// Start the server and listen for requests on the specified port
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
