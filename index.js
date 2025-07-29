const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
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

    const reply = response.data.candidates[0].content.parts[0].text;
    res.json({ reply });

  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({ reply: "Error from Gemini API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
