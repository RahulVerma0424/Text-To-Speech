const textInput = document.getElementById("inputText");
const highlightContainer = document.getElementById("highlightContainer");
const playPauseBtn = document.getElementById("playPause");
const speedControl = document.getElementById("speedControl");
const themeToggle = document.getElementById("themeToggle");
const historyList = document.getElementById("historyList");

let utterance;
let sentences = [];
let currentSentenceIndex = 0;
let isPaused = true;
let fullText = "";
let isSpeaking = false;

function splitIntoSentences(text) {
  return text.match(/[^.!?]+[.!?]*[\])'"`’”]*|.+/g) || [];
}

function updateHistory(text) {
  if (text.trim()) {
    const li = document.createElement("li");
    li.textContent = text.substring(0, 80) + (text.length > 80 ? "..." : "");
    historyList.prepend(li);
  }
}

function highlightText() {
  highlightContainer.innerHTML = "";

  sentences.forEach((sentence, index) => {
    const span = document.createElement("span");
    span.textContent = sentence + " ";
    if (index === currentSentenceIndex) {
      span.classList.add("highlight-sentence");
    }
    highlightContainer.appendChild(span);
  });
}

function speakSentence(index) {
  if (index >= sentences.length) {
    isSpeaking = false;
    isPaused = true;
    playPauseBtn.textContent = "▶️";
    return;
  }

  highlightText();
  utterance = new SpeechSynthesisUtterance(sentences[index]);
  utterance.rate = parseFloat(speedControl.value);
  utterance.lang = "en-US";

  utterance.onend = () => {
    if (!isPaused) {
      currentSentenceIndex++;
      speakSentence(currentSentenceIndex);
    }
  };

  isSpeaking = true;
  speechSynthesis.speak(utterance);
}

playPauseBtn.addEventListener("click", () => {
  const input = textInput.value.trim();
  if (!input) {
    alert("Please enter some text.");
    return;
  }

  if (isPaused) {
    if (!isSpeaking || fullText !== input) {
      fullText = input;
      sentences = splitIntoSentences(fullText);
      currentSentenceIndex = 0;
      updateHistory(fullText);
    }
    isPaused = false;
    playPauseBtn.textContent = "⏸️";
    speakSentence(currentSentenceIndex);
  } else {
    isPaused = true;
    playPauseBtn.textContent = "▶️";
    speechSynthesis.cancel();
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});
