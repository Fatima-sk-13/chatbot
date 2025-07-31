console.log("script.js is connected");

// Save chat history to localStorage
function saveChatToLocalStorage(messages) {
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

// Load chat history from localStorage
function loadChatFromLocalStorage() {
  const saved = localStorage.getItem("chatHistory");
  return saved ? JSON.parse(saved) : [];
}

// DOM elements
const input = document.querySelector(".chat-input");
const sendButton = document.querySelector(".send-btn");
const chatBox = document.querySelector(".chat-box");
const imageInput = document.getElementById("imageInput");


let base64Image = null; // To hold image in base64 format
let chatHistory = loadChatFromLocalStorage(); // Load saved chat on start

// Show previous messages when page loads
chatHistory.forEach((msg) => {
  addMessage(msg.content, msg.role);
});

// Handle image upload and convert to base64
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  const reader = new FileReader();

  reader.onloadend = () => {
    base64Image = reader.result.split(',')[1]; // Remove base64 header
    console.log("Image converted to base64");
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});

// Function to add a message to the chat box
function addMessage(text, sender = "user") {
  const message = document.createElement("div");
  message.classList.add("message");
  if (sender === "bot") message.classList.add("bot");
  message.textContent = sender === "bot" ? `🤖 Bot: ${text}` : `👧 You: ${text}`;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

  // When Enter is pressed in the input field
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents form from refreshing the page
      sendButton.click();     // Triggers the send button's click event
    }
  });
  
// Handle send button click
sendButton.addEventListener("click", async () => {
  const userMessage = input.value.trim();

  if (!userMessage && !base64Image) return; // Do nothing if both are empty

  // Add user message to UI and history
  addMessage(userMessage || "[Image only]", "user");
  chatHistory.push({ role: "user", content: userMessage || "[Image only]" });
  saveChatToLocalStorage(chatHistory); // Save updated chat to localStorage
  input.value = ""; // Clear text input

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        image: base64Image,
        history: chatHistory, // Send full history to server
      })
    });

    const data = await res.json();

    // Add bot reply to UI and history
    addMessage(data.reply, "bot");
    chatHistory.push({ role: "bot", content: data.reply });
    saveChatToLocalStorage(chatHistory); // Save again

    // Clear image after use
    base64Image = null;
    imageInput.value = "";

  } catch (err) {
    console.error(err);
    addMessage("Error: Could not reach server.", "bot");
  }
});

// Delete button clears chat box and localStorage
const deleteChatBtn = document.querySelector(".delete-btn");
deleteChatBtn.addEventListener("click", () => {
  chatBox.innerHTML = "";
  localStorage.removeItem("chatHistory"); // Remove from local storage
  chatHistory = []; // Reset memory
});
