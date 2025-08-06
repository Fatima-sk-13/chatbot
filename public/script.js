 document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("doggle-theme");
  
    const isDoggle = document.body.classList.contains("doggle-theme");
    localStorage.setItem("theme", isDoggle ? "doggle" : "default");
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "doggle") {
      document.body.classList.add("doggle-theme");
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js is connected");

  // 🔹 DOM Elements
  const input = document.querySelector(".chat-input textarea");
  const sendButton = document.querySelector(".send-btn");
  const chatBox = document.querySelector(".chat-box");
  const imageInput = document.getElementById("imageInput");
  const uploadBtn = document.getElementById("uploadBtn");

  // 🔹 Chat data and state
  let currentChatId = localStorage.getItem("currentChatId");
  let allChats = JSON.parse(localStorage.getItem("allChats")) || {};
  let chatHistory = loadChatFromLocalStorage(); // Load temporary history (optional)
  let base64Images = []; // Store images uploaded for next message

  // 🔹 ENTER/SHIFT+ENTER handling for input
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        // SHIFT + ENTER = newline
        event.preventDefault();
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.slice(0, start) + "\n" + input.value.slice(end);
        input.selectionStart = input.selectionEnd = start + 1;
      } else {
        // ENTER = send
        event.preventDefault();
        sendMessage();
      }
    }
  });

  // 🔹 Make input box auto-expand as user types
  function autoResizeTextarea() {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  }

  // 🔹 Format bot response (Markdown, numbered lists, paragraphs)
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

  // 🔹 Save/load from localStorage
  function saveChatToLocalStorage(messages) {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }

  function loadChatFromLocalStorage() {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  }

  function saveAllChats() {
    // Remove empty chats
    for (const id in allChats) {
      if (!allChats[id] || allChats[id].length === 0) {
        delete allChats[id];
      }
    }
    localStorage.setItem("allChats", JSON.stringify(allChats));
  }

  // 🔹 Create new chat
  function createNewChat() {
    const id = "chat_" + Date.now(); // Unique ID
    allChats[id] = [];
    currentChatId = id;
    localStorage.setItem("currentChatId", currentChatId);
    saveAllChats();
    renderChatList();
    loadChat(currentChatId);
    return id;
  }

  // 🔹 Sidebar chat list
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

      // 🔹 Naming logic
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

      // 🔹 Delete chat button
      const deleteBtn = document.createElement("button");
      const trashImg = document.createElement("img");
      trashImg.src ="images/trash.png" ; // Path relative to /public
      trashImg.alt = "Delete";
      trashImg.classList.add("trash-icon"); // Optional: you can style it in CSS
      deleteBtn.appendChild(trashImg);
      deleteBtn.classList.add("delete-chat-btn");
      deleteBtn.style.cursor = "pointer";

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Don’t trigger open
        const confirmDelete = confirm("Are you sure you want to delete this chat?");
        if (confirmDelete) {
          delete allChats[id];
          saveAllChats();

          if (currentChatId === id) {
            const remaining = Object.keys(allChats);
            currentChatId = remaining.length > 0 ? remaining[0] : null;
            chatBox.innerHTML = "";
          }

          renderChatList();
          if (currentChatId) loadChat(currentChatId);
        }
      });

      // 🔹 Load chat on click
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

  // 🔹 Load messages of a specific chat
  function loadChat(id) {
    chatBox.innerHTML = "";
    chatHistory = allChats[id] || [];
    chatHistory.forEach((msg) => {
      addMessage(msg.content, msg.role, msg.images || []);
    });
    saveAllChats();
  }

  // 🔹 Add message to UI
  function addMessage(text, sender = "user", images = []) {
    const message = document.createElement("div");
    message.classList.add("message");
    message.classList.add(sender === "bot" ? "bot" : "user");

    const messageContent = document.createElement("div");

    if (sender === "bot") {
      messageContent.innerHTML = formatBotResponse(marked.parse(text));
    } else {
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

  // 🔹 Send button click
 async function sendMessage() {
  const userMessage = input.value.trim();
  if (!userMessage && base64Images.length === 0) return;

  const messageToSend = userMessage || "[Image only]";
  addMessage(userMessage, "user", base64Images);

  // Show typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("message", "bot");

  const typingContent = document.createElement("div")
  typingContent.textContent = "...";
  typingIndicator.appendChild(typingContent);
  chatBox.appendChild(typingIndicator);
  chatBox.scrollTop = chatBox.scrollHeight;

  chatHistory.push({ role: "user", content: userMessage, images: base64Images });
  allChats[currentChatId] = chatHistory;
  saveAllChats();
  renderChatList();
  input.value = "";

  try {
    // 🔹 Force the browser to paint the DOM before fetch starts
    await new Promise(requestAnimationFrame);

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

    // Replace the typing text with actual response
    typingContent.innerHTML = formatBotResponse(marked.parse(data.reply));

    chatHistory.push({ role: "bot", content: data.reply, images: [] });
    allChats[currentChatId] = chatHistory;
    saveAllChats();

    base64Images = [];
    imageInput.value = "";
    document.getElementById("imagePreview").innerHTML = "";
  } catch (err) {
    console.error(err);
    typingContent.textContent = "Error: Could not reach server.";
  }
}


  sendButton.addEventListener("click", sendMessage);

  // 🔹 Image Upload logic
  uploadBtn.addEventListener("click", () => {
    imageInput.click();
  });

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

  // 🔹 New chat button
  document.getElementById("newChatBtn").addEventListener("click", createNewChat);


  // 🔹 Initial load logic
  if (!currentChatId || !allChats[currentChatId]) {
    createNewChat(); // Create if none
  }

  renderChatList();
  loadChat(currentChatId);
});
