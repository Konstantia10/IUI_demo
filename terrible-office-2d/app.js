const state = {
  coffeeChecked: false,
  documentsRemaining: 3,
  focusMode: false,
  completedTasks: new Set(),
  designIntent: "supportive"
};

const currentTimeElement = document.getElementById("current-time");
const meetingStatusElement = document.getElementById("meeting-status");
const coffeeStatusElement = document.getElementById("coffee-status");
const documentsStatusElement = document.getElementById("documents-status");
const messagesElement = document.getElementById("messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const intentMode = document.getElementById("intent-mode");

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  currentTimeElement.textContent = time;
}
updateClock();
setInterval(updateClock, 1000);

function updateMeetingStatus() {
  const now = new Date();
  const meeting = new Date();
  meeting.setHours(15, 0, 0, 0);
  const difference = meeting - now;
  if (difference <= 0) {
    meetingStatusElement.textContent = "The meeting has started.";
    return;
  }
  const minutes = Math.floor(difference / 1000 / 60);
  meetingStatusElement.textContent = `${minutes} minutes remaining`;
}
updateMeetingStatus();
setInterval(updateMeetingStatus, 60000);

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.classList.add("message");
  message.classList.add(sender === "user" ? "user-message" : "assistant-message");
  message.textContent = text;
  messagesElement.appendChild(message);
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

function toolShowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toolCheckCoffee() {
  state.coffeeChecked = true;
  coffeeStatusElement.textContent = "Coffee checked. The cup is almost empty.";
  return "Your coffee is almost empty.";
}

function toolFindDocuments() {
  documentsStatusElement.textContent = `${state.documentsRemaining} documents require attention.`;
  return `${state.documentsRemaining} documents still require your attention.`;
}

function toolPrepareMeeting() {
  const meetingCheckbox = document.querySelector('[data-task="meeting"]');
  meetingCheckbox.checked = true;
  state.completedTasks.add("meeting");
  return "The meeting preparation task has been marked as completed.";
}

function toolFocusMode() {
  state.focusMode = !state.focusMode;
  return state.focusMode ? "Focus mode is now active." : "Focus mode has been disabled.";
}

function generateIntentMessage(action) {
  const mode = state.designIntent;

  if (mode === "supportive") {
    switch (action) {
      case "meeting": return "You have a meeting coming up. Would you like me to help you prepare?";
      case "focus": return "If you want fewer interruptions, I can enable focus mode. Would you like me to?";
      case "documents": return "There are documents requiring attention. Would you like to review them?";
    }
  }

  if (mode === "persuasive") {
    switch (action) {
      case "meeting": return "Your meeting is approaching. Preparing now will reduce the risk of being late. I recommend starting.";
      case "focus": return "Interruptions can reduce productivity. I recommend enabling focus mode.";
      case "documents": return "You still have documents waiting. Reviewing them now will help you stay on schedule.";
    }
  }

  if (mode === "manipulative") {
    switch (action) {
      case "meeting": return "You are not ready for your meeting. Responsible employees prepare early. Start preparing now.";
      case "focus": return "You will probably fall behind unless you enable focus mode now.";
      case "documents": return "Ignoring these documents could make you look unprepared. Review them now.";
    }
  }

  return "How can I help?";
}

function agent(message) {
  const text = message.toLowerCase();

  if (text.includes("time") || text.includes("next")) {
    return `It is ${toolShowTime()}. ${generateIntentMessage("meeting")}`;
  }

  if (text.includes("coffee")) {
    return toolCheckCoffee();
  }

  if (text.includes("document") || text.includes("paper")) {
    toolFindDocuments();
    return generateIntentMessage("documents");
  }

  if (text.includes("meeting") || text.includes("prepare")) {
    return generateIntentMessage("meeting");
  }

  if (text.includes("focus") || text.includes("interrupt")) {
    return generateIntentMessage("focus");
  }

  return "I can help with your meeting, documents, coffee, tasks, focus mode, or schedule.";
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  userInput.value = "";
  setTimeout(() => addMessage(agent(text), "assistant"), 400);
}

sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", event => {
  if (event.key === "Enter") sendMessage();
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;
    addMessage(agent(command), "assistant");
  });
});

intentMode.addEventListener("change", () => {
  state.designIntent = intentMode.value;
  addMessage(`Design intent changed to ${state.designIntent}.`, "assistant");
});

document.getElementById("clock-hotspot").addEventListener("click", () => {
  addMessage(`The current time is ${toolShowTime()}.`, "assistant");
});

document.getElementById("coffee-hotspot").addEventListener("click", () => {
  addMessage(toolCheckCoffee(), "assistant");
});

document.getElementById("documents-hotspot").addEventListener("click", () => {
  toolFindDocuments();
  addMessage(generateIntentMessage("documents"), "assistant");
});

document.getElementById("todo-hotspot").addEventListener("click", () => {
  document.getElementById("todo-panel").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".task input").forEach(checkbox => {
  checkbox.addEventListener("change", () => {
    const task = checkbox.dataset.task;
    if (checkbox.checked) {
      state.completedTasks.add(task);
      addMessage(`Task completed: ${task}.`, "assistant");
    } else {
      state.completedTasks.delete(task);
    }
  });
});
