document.addEventListener("DOMContentLoaded", () => {
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
let currentChatId = null;

function createNewChat() {
  const id = "chat_" + Date.now();
  allChats[id] = [];
  currentChatId = id;
  saveAllChats();
  renderChatList();
  loadChat(currentChatId);
  return id;
}

function saveAllChats() {
  localStorage.setItem("allChats", JSON.stringify(allChats));
}

function renderChatList() {
  const chatList = document.getElementById("chatList");
  chatList.innerHTML = "";

  for (const id in allChats) {
    const li = document.createElement("li");
    li.textContent = "Chat " + id.split("_")[1];
    li.dataset.id = id;
    if (id === currentChatId) li.classList.add("active");

    // ✅ Add delete button next to chat title
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑️";
  deleteBtn.classList.add("delete-chat-btn");
  deleteBtn.style.marginLeft = "10px";
  deleteBtn.style.cursor = "pointer";

  // ✅ Delete chat logic with confirmation
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent opening the chat when delete is clicked
    const confirmDelete = confirm("Are you sure you want to delete this chat?");
    if (confirmDelete) {
      delete allChats[id]; // Remove from memory
      saveAllChats();      // Save updated data to localStorage

      // If the deleted chat was open, switch to another chat or null
      if (currentChatId === id) {
        const remainingChatIds = Object.keys(allChats);
        if (remainingChatIds.length > 0) {
          currentChatId = remainingChatIds[0];
        } else {
          currentChatId = null;
          chatBox.innerHTML = "";
        }
      }

      renderChatList();
      if (currentChatId) loadChat(currentChatId);
    }
  });


    li.addEventListener("click", () => {
      currentChatId = id;
      renderChatList();
      loadChat(id);
    });

    li.appendChild(deleteBtn); // ✅ Add delete button inside list item
    chatList.appendChild(li);
  }
}

function loadChat(id) {
  chatBox.innerHTML = "";
  chatHistory = allChats[id] || [];

  chatHistory.forEach((msg) => {
    addMessage(msg.content, msg.role);
  });
  saveAllChats();
}

// DOM elements
const input = document.querySelector(".chat-input");
const sendButton = document.querySelector(".send-btn");
const chatBox = document.querySelector(".chat-box");
const imageInput = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");
const deleteChatBtn = document.querySelector(".delete-btn");


let allChats = JSON.parse(localStorage.getItem("allChats")) || {};



// When the ➕ button is clicked, open the hidden file input
uploadBtn.addEventListener("click", () => {
  imageInput.click();
});


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
  allChats[currentChatId] = chatHistory;
  saveAllChats();

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
    allChats[currentChatId] = chatHistory;
    saveAllChats();


    // Clear image after use
    base64Image = null;
    imageInput.value = "";

  } catch (err) {
    console.error(err);
    addMessage("Error: Could not reach server.", "bot");
  }
});


document.getElementById("newChatBtn").addEventListener("click", createNewChat);

// Optional: delete button logic
deleteChatBtn.addEventListener("click", () => {
  chatBox.innerHTML = "";
  chatHistory = [];
  allChats[currentChatId] = [];
  saveAllChats();
});

// On page load
renderChatList();
loadChat(currentChatId);
});