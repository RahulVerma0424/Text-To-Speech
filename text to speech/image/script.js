const fileInput = document.getElementById("imageInput");
const textContainer = document.getElementById("highlightContainer");
const playPauseBtn = document.getElementById("playPause");
const prevBtn = document.getElementById("prevSentence");
const nextBtn = document.getElementById("nextSentence");
const speedControl = document.getElementById("speedControl");
const themeToggle = document.getElementById("themeToggle");
const historyList = document.getElementById("historyList");

let utterance = new SpeechSynthesisUtterance();
let sentences = [];
let currentSentence = 0;
let currentWordIndex = 0;
let isPaused = false;
let isSpeaking = false;

// Load OCR and extract text from image
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  updateHistory(file.name);
  const imageUrl = URL.createObjectURL(file);
  textContainer.textContent = "🔍 Extracting text...";

  const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
    logger: m => console.log(m)
  });

  prepareText(text);
});

// Prepare English text only (no translation)
function prepareText(text) {
  sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  currentSentence = 0;
  currentWordIndex = 0;
  isPaused = false;
  highlightCurrent(sentences[0], 0);
}

// Highlight sentence and word
function highlightCurrent(sentence, wordIndex) {
  const words = sentence.trim().split(" ");
  const html = words.map((word, i) =>
    i === wordIndex
      ? `<span class="highlight-word">${word}</span>`
      : word
  ).join(" ");
  textContainer.innerHTML = `<span class="highlight-sentence">${html}</span>`;
}

// Speak current sentence
function speakSentence(index) {
  if (index >= sentences.length) return;

  const sentence = sentences[index].trim();
  currentWordIndex = 0;
  highlightCurrent(sentence, currentWordIndex);

  utterance.text = sentence;
  utterance.rate = parseFloat(speedControl.value);
  utterance.lang = "en-US";

  utterance.onboundary = (event) => {
    if (event.name === "word") {
      currentWordIndex++;
      highlightCurrent(sentence, currentWordIndex);
    }
  };

  utterance.onend = () => {
    if (!isPaused) {
      currentSentence++;
      if (currentSentence < sentences.length) {
        speakSentence(currentSentence);
      } else {
        isSpeaking = false;
        playPauseBtn.textContent = "▶️";
      }
    }
  };

  isSpeaking = true;
  window.speechSynthesis.speak(utterance);
}

// Play/Pause button
playPauseBtn.addEventListener("click", () => {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isPaused = true;
    isSpeaking = false;
    playPauseBtn.textContent = "▶️";
  } else {
    if (!sentences.length) return;
    isPaused = false;
    playPauseBtn.textContent = "⏸️";
    speakSentence(currentSentence);
  }
});

// Backward
prevBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  currentSentence = Math.max(currentSentence - 1, 0);
  isPaused = false;
  speakSentence(currentSentence);
});

// Forward
nextBtn.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  currentSentence = Math.min(currentSentence + 1, sentences.length - 1);
  isPaused = false;
  speakSentence(currentSentence);
});

// Speed control
speedControl.addEventListener("change", () => {
  utterance.rate = parseFloat(speedControl.value);
});

// Dark/Light mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Upload history
function updateHistory(name) {
  const li = document.createElement("li");
  li.textContent = name;
  historyList.prepend(li);
}
