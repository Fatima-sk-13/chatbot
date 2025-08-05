//script.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js is connected");

  // 🔹 DOM Elements
  const input = document.querySelector(".chat-input textarea");
  const sendButton = document.querySelector(".send-btn");
  const chatBox = document.querySelector(".chat-box");
  const imageInput = document.getElementById("imageInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const deleteChatBtn = document.querySelector(".delete-btn");

  // 🔹 Chat data and state
  let currentChatId = localStorage.getItem("currentChatId");
  let allChats = JSON.parse(localStorage.getItem("allChats")) || {}; // All chat sessions
  let base64Image = null; // To store image as base64 string
  let chatHistory = loadChatFromLocalStorage(); // Load last-used session (optional)

  let base64Images = [];

  input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    if (event.shiftKey) {
      // Insert newline
      event.preventDefault();
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = input.value.slice(0, start) + "\n" + input.value.slice(end);
      input.selectionStart = input.selectionEnd = start + 1;
    } else {
      // Send message
      event.preventDefault();
      sendMessage();
    }
  }
});

  function autoResizeTextarea() {
    input.style.height = "auto";            // Reset height
    input.style.height = input.scrollHeight + "px"; // Set to actual content height
  }

  function formatBotResponse(content) {
  if (!content.startsWith("<h2>")) {
    content = "<p>" + content + "</p>";
  }

  const lines = content.split('\n');
  let inList = false;
  let formatted = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        inList = true;
        formatted.push("<ol>");
      }
      formatted.push("<li>" + trimmed.replace(/^\d+\.\s/, '') + "</li>");
    } else if (trimmed === "" && inList) {
      inList = false;
      formatted.push("</ol>");
    } else {
      formatted.push("<p>" + line + "</p>");
    }
  });

  if (inList) {
    formatted.push("</ol>");
  }

  return formatted.join('');
}

  // ✅ Save one session's messages to localStorage
  function saveChatToLocalStorage(messages) {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }

  // ✅ Load one session's messages from localStorage
  function loadChatFromLocalStorage() {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  }

  // ✅ Save all chats to localStorage
  function saveAllChats() {
  // Remove chats with no messages
  for (const id in allChats) {
    if (!allChats[id] || allChats[id].length === 0) {
      delete allChats[id];
    }
  }
  localStorage.setItem("allChats", JSON.stringify(allChats));
}


  // ✅ Create a new chat session
  function createNewChat() {
    const id = "chat_" + Date.now(); // Unique ID for chat
    allChats[id] = [];                // Start with empty array
    currentChatId = id;
    localStorage.setItem("currentChatId", currentChatId);
    saveAllChats();
    renderChatList();
    loadChat(currentChatId);
    return id;
  }

  // ✅ Render sidebar chat list
  function renderChatList() {
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";

    for (const id in allChats) {
      const li = document.createElement("li");
      li.dataset.id = id;
      if (id === currentChatId) li.classList.add("active");

      const chatLabel = document.createElement("span");
      let firstMessage = allChats[id]?.[0];
      let previewText = "New Chat";

      if (firstMessage) {
        if (firstMessage.content && firstMessage.content !== "[Image only]") {
          previewText = firstMessage.content;
        } else if (firstMessage.images && firstMessage.images.length > 0) {
          previewText = "Image message";
        }
      }

      const preview = previewText.length > 30 ? previewText.slice(0, 30) + "..." : previewText;
      chatLabel.textContent = preview;
      chatLabel.title = previewText;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.classList.add("delete-chat-btn");
      deleteBtn.style.cursor = "pointer";

      // ✅ Delete a chat
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent opening chat
        const confirmDelete = confirm("Are you sure you want to delete this chat?");
        if (confirmDelete) {
          delete allChats[id];
          saveAllChats();

          if (currentChatId === id) {
            const remainingChatIds = Object.keys(allChats);
            currentChatId = remainingChatIds.length > 0 ? remainingChatIds[0] : null;
            chatBox.innerHTML = "";
          }

          renderChatList();
          if (currentChatId) loadChat(currentChatId);
        }
      });

      // ✅ Switch to chat on click
      li.addEventListener("click", () => {
        currentChatId = id;
        localStorage.setItem("currentChatId", currentChatId);
        renderChatList();
        loadChat(id);
      });

      li.appendChild(deleteBtn);
      li.appendChild(chatLabel);
      chatList.appendChild(li);
    }
  }

  // ✅ Load all messages for a specific chat session
  function loadChat(id) {
    chatBox.innerHTML = "";
    chatHistory = allChats[id] || [];
    chatHistory.forEach((msg) => {
  addMessage(msg.content, msg.role, msg.images || []);
});
    saveAllChats();
  }

// ✅ Add one message (bot or user) to UI
function addMessage(text, sender = "user", images = []) {
  const message = document.createElement("div");
  message.classList.add("message");
  message.classList.add(sender === "bot" ? "bot" : "user");

  const messageContent = document.createElement("div");

  if (sender === "bot") {
    // ✅ Convert Markdown to HTML for Gemini's response (no "Bot:" label)
   messageContent.innerHTML = formatBotResponse(marked.parse(text));
  } else {
    // ✅ Just the user's message text (no "You:" label)
    messageContent.textContent = text;
  }

  message.appendChild(messageContent);

  if (images && images.length > 0) {
    images.forEach((imgBase64) => {
      const img = document.createElement("img");
      img.src = `data:image/jpeg;base64,${imgBase64}`;
      img.alt = "uploaded image";
      img.classList.add("preview-image");
      message.appendChild(img);
    });
  }

  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}


input.addEventListener("input", autoResizeTextarea);

   // ✅ Click send button
async function sendMessage() {
  const userMessage = input.value.trim();
  if (!userMessage && base64Images.length === 0) return;

  const messageToSend = userMessage || "[Image only]";
  addMessage(userMessage, "user", base64Images);

  chatHistory.push({ role: "user", content: userMessage, images: base64Images });
  allChats[currentChatId] = chatHistory;
  saveAllChats();
  renderChatList(); // 💡 Refresh chat names in sidebar
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageToSend,
        images: base64Images,
        history: chatHistory
      })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");

    chatHistory.push({ role: "bot", content: data.reply, images: [] });
    allChats[currentChatId] = chatHistory;
    saveAllChats();

    base64Images = [];
    imageInput.value = "";
    document.getElementById("imagePreview").innerHTML = "";
  } catch (err) {
    console.error(err);
    addMessage("Error: Could not reach server.", "bot");
  }
}

sendButton.addEventListener("click", sendMessage);

  // ✅ Upload image button triggers file input
  uploadBtn.addEventListener("click", () => {
    imageInput.click();
  });

  // ✅ Convert uploaded image to base64
  imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);
  const preview = document.getElementById("imagePreview");
  preview.innerHTML = "";
  base64Images = [];

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      base64Images.push(base64);

      const img = document.createElement("img");
      img.src = reader.result;
      img.alt = "preview";
      img.classList.add("preview-image");
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

  // ✅ Create a new chat session when ➕ is clicked
  document.getElementById("newChatBtn").addEventListener("click", createNewChat);

  // ✅ Clear current chat content manually
  deleteChatBtn.addEventListener("click", () => {
    chatBox.innerHTML = "";
    chatHistory = [];
    delete allChats[currentChatId];
    currentChatId = null;
    saveAllChats();
    renderChatList()
    createNewChat()
    });

  if (!currentChatId|| !allChats[currentChatId]) {
  createNewChat(); // ✅ Automatically create a chat if none
}

  // ✅ On page load: render sidebar + load active chat
  renderChatList();
  loadChat(currentChatId);
});
