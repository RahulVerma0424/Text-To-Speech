let sentences = [];
let currentIndex = 0;
let isSpeaking = false;
let utterance = new SpeechSynthesisUtterance();

const textContainer = document.getElementById("text-container");
const languageSelect = document.getElementById("language-select");
const speedSelect = document.getElementById("speed-select");
const playPauseBtn = document.getElementById("play-pause");

document.getElementById("file-upload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileType = file.name.split('.').pop();

  let fullText = "";

  if (fileType === "pdf") {
    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + " ";
      }

      handleText(fullText);
    };
    reader.readAsArrayBuffer(file);
  } else if (fileType === "docx") {
    const reader = new FileReader();
    reader.onload = async () => {
      const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
      handleText(result.value);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Only PDF and Word files are supported.");
  }
});

function handleText(text) {
  sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  currentIndex = 0;
  displaySentences();
  speakSentence(currentIndex);
}

function displaySentences() {
  textContainer.innerHTML = "";
  sentences.forEach((sentence, i) => {
    const span = document.createElement("span");
    span.id = `sentence-${i}`;
    span.textContent = sentence + " ";
    textContainer.appendChild(span);
  });
}

async function speakSentence(index) {
  if (index >= sentences.length || index < 0) return;
  const original = sentences[index];
  const translated = await translateText(original, languageSelect.value);

  utterance.text = translated;
  utterance.lang = languageSelect.value;
  utterance.rate = parseFloat(speedSelect.value);

  highlight(index, -1);
  let words = translated.split(" ");
  let wordIdx = 0;

  utterance.onboundary = (event) => {
    if (event.name === "word") {
      highlight(index, wordIdx++);
    }
  };

  utterance.onend = () => {
    currentIndex++;
    if (currentIndex < sentences.length) {
      speakSentence(currentIndex); // 🔄 Auto-continue
    } else {
      isSpeaking = false;
      playPauseBtn.textContent = "▶️";
    }
  };

  window.speechSynthesis.speak(utterance);
  isSpeaking = true;
  playPauseBtn.textContent = "⏸️";
}

function highlight(sentenceIdx, wordIdx) {
  sentences.forEach((_, i) => {
    const el = document.getElementById(`sentence-${i}`);
    if (i === sentenceIdx) {
      el.className = "highlight-sentence";
      if (wordIdx >= 0) {
        const words = el.textContent.trim().split(" ");
        el.innerHTML = words.map((word, idx) =>
          idx === wordIdx ? `<span class="highlight-word">${word}</span>` : word
        ).join(" ") + " ";
      }
    } else {
      el.className = "";
    }
  });
}

playPauseBtn.addEventListener("click", () => {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    playPauseBtn.textContent = "▶️";
  } else {
    speakSentence(currentIndex);
  }
});

document.getElementById("prev").addEventListener("click", () => {
  if (currentIndex > 0) {
    window.speechSynthesis.cancel();
    currentIndex--;
    speakSentence(currentIndex);
  }
});

document.getElementById("next").addEventListener("click", () => {
  if (currentIndex < sentences.length - 1) {
    window.speechSynthesis.cancel();
    currentIndex++;
    speakSentence(currentIndex);
  }
});

document.getElementById("toggle-theme").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const themeBtn = document.getElementById("toggle-theme");
  themeBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

async function translateText(text, targetLang) {
  if (targetLang === "en") return text;

  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: "en",
        target: targetLang,
        format: "text"
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
}
