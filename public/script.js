console.log("✅ script.js is connected");

const input = document.querySelector(".chat-input");
const sendButton = document.querySelector(".send-btn");
const chatBox = document.querySelector(".chat-box");

function addMessage(text, sender = "user") {
  const message = document.createElement("div");
  message.classList.add("message");
  if (sender === "bot") message.classList.add("bot");
  message.textContent = sender === "bot" ? `🤖 Bot: ${text}` : `👧 You: ${text}`;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendButton.addEventListener("click", async () => {
  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();
    addMessage(data.reply, "bot");
  } catch (err) {
    console.error(err);
    addMessage("Error: Could not reach server.", "bot");
  }
});


const deleteChatBtn = document.querySelector(".delete-btn");

deleteChatBtn.addEventListener("click", () => {
  chatBox.innerHTML = ""; // Clears all messages inside the chat box
});


