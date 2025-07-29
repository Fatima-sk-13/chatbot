// ✅ Check if script is properly connected
console.log("✅ script.js is connected");

// 🔍 Grab DOM elements from the HTML
const input = document.querySelector(".chat-input"); // User input box
const sendButton = document.querySelector(".send-btn"); // Send button
const chatBox = document.querySelector(".chat-box"); // Chat messages container

// 💬 Function to display a message in the chat box
function addMessage(text, sender = "user") {
  const message = document.createElement("div"); // Create a new <div> for the message
  message.classList.add("message"); // Add the "message" class for styling

  // If the message is from the bot, add an extra "bot" class
  if (sender === "bot") message.classList.add("bot");

  // Set the message text with emoji
  message.textContent = sender === "bot" ? `🤖 Bot: ${text}` : `👧 You: ${text}`;

  // Add the message to the chat box
  chatBox.appendChild(message);

  // Scroll to the bottom to show the latest message
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🚀 Handle click on the send button
sendButton.addEventListener("click", async () => {
  const userMessage = input.value.trim(); // Get and trim the user input
  if (!userMessage) return; // Don't send if input is empty

  addMessage(userMessage, "user"); // Show user's message in the chat
  input.value = ""; // Clear the input box

  try {
    // 📤 Send the message to the backend (/chat route)
    const res = await fetch("/chat", {
      method: "POST", // Use POST to send data
      headers: { "Content-Type": "application/json" }, // Sending JSON
      body: JSON.stringify({ message: userMessage }) // Convert message to JSON string
    });

    const data = await res.json(); // Wait for JSON reply
    addMessage(data.reply, "bot"); // Show bot's reply in chat

  } catch (err) {
    console.error(err); // Show error in console
    addMessage("Error: Could not reach server.", "bot"); // Show error message in chat
  }
});

// 🗑️ Clear chat button logic
const deleteChatBtn = document.querySelector(".delete-btn"); // Get the delete button

// When clicked, clear all messages from the chat box
deleteChatBtn.addEventListener("click", () => {
  chatBox.innerHTML = ""; // Clears everything inside the chatBox
});

