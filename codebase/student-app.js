/**
 * VLearn Student Portal - Official 3-Column Interactive Application (student.html)
 * Controls Slide Page rendering, Left Syllabus Accordion, Right VLearn Tutor Sidebar Toggle,
 * Text Selection Auto-Drafting, Context-Aware Question Answering, and Theme Switcher.
 */

// Slide Deck Dataset for PDF Viewer (day01_302.pdf)
const pdfSlides = [
  {
    page: 1,
    title: "COMP2010 — Generalist Product Builder & Course Overview",
    instructor: "Mai Anh Nguyen (Blue)",
    role: "Generalist Product Builder",
    bullets: [
      "2026: FPT Long Châu (PM · Healthcare Product)",
      "2025: Thongtincuho.org (Co-founder)",
      "2025: FPT Software AI Center (PM · AI Agent)",
      "2021-2025: Xantus (PM · On-chain Analytics, AI Agent)",
      "2016-2021: DYNO, Kalapa (PM · OCR, eKYC, Credit Scoring)"
    ],
    code: `// Day 1 Introduction:
const course = "COMP2010 AI Product Development";
const instructor = "Mai Anh Nguyen (Blue)";`
  },
  {
    page: 2,
    title: "Bài 4: Bất đồng bộ khi gọi API Key & Async await Header Injection",
    instructor: "Thầy Nguyễn Văn A — VLearn AI Course",
    role: "AI Lead Instructor",
    bullets: [
      "⚠️ Nỗi đau: Có đến 342 học viên bị kẹt lỗi 401 Unauthorized khi khởi tạo API Key trong hàm async.",
      "📌 Nguyên nhân: Quên nạp dotenv.config() trước khi truyền biến môi trường vào Authorization Header.",
      "💡 Giải pháp: Bắt buộc nạp cấu hình biến môi trường ở dòng đầu tiên của file entry point!"
    ],
    code: `import dotenv from 'dotenv';
dotenv.config(); // Nạp API Key trước khi gọi async call!

async function fetchAIResponse() {
  const apiKey = process.env.VLEARN_API_KEY;
  if (!apiKey) throw new Error("401 Unauthorized: Key bị undefined");
  return await fetch("https://api.vlearn.ai/v1/chat", {
    headers: { "Authorization": \`Bearer \${apiKey}\` }
  });
}`
  },
  {
    page: 3,
    title: "Bài 4 (Tiếp): Thiết lập File .env & Bảo mật API Key",
    instructor: "Thầy Nguyễn Văn A — VLearn AI Course",
    role: "AI Lead Instructor",
    bullets: [
      "1. Lưu file .env ở thư mục gốc (root directory).",
      "2. Thêm file .env vào .gitignore để tránh bị lộ API Key công khai trên GitHub.",
      "3. Reset key mới ngay lập tức nếu vô tình commit key cũ."
    ],
    code: `# File .env:
PORT=3000
VLEARN_API_KEY=sk-vlearn-live-998231-k3
DATABASE_URL=postgresql://localhost:5432/vlearn`
  },
  {
    page: 4,
    title: "Bài 5: Vector DB Indexing & Batch Chunking Strategy",
    instructor: "Việt Anh — Backend & AI Tech",
    role: "AI Infrastructure Specialist",
    bullets: [
      "⚠️ Tránh tràn bộ nhớ RAM (Memory Leak) khi ingest 100k chunk tài liệu.",
      "Chunk Size khuyến nghị: 512 tokens, Chunk Overlap: 50 tokens.",
      "Sử dụng FAISS hoặc ChromaDB index cho truy vấn Semantic Similarity nhanh."
    ],
    code: `const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 50
});
const docs = await textSplitter.createDocuments([chatlogsText]);`
  }
];

// State
let currentPageNum = 2; // Default starting page from screenshot
let isTutorOpen = true;

// DOM Elements
const pdfCanvasContainer = document.getElementById("pdf-canvas-container");
const slideMainContent = document.getElementById("slide-main-content");
const navPageIndicator = document.getElementById("nav-page-indicator");
const slidePageNumTop = document.getElementById("slide-page-num-top");
const btnPdfPrev = document.getElementById("btn-pdf-prev");
const btnPdfNext = document.getElementById("btn-pdf-next");

const vlearnTutorSidebar = document.getElementById("vlearn-tutor-sidebar");
const btnToggleTutor = document.getElementById("btn-toggle-tutor");
const slideContextBadge = document.getElementById("slide-context-badge");
const currentContextTxt = document.getElementById("current-context-txt");

const tutorChatStream = document.getElementById("tutor-chat-stream");
const tutorInputField = document.getElementById("tutor-input-field");
const btnSendTutor = document.getElementById("btn-send-tutor");
const btnResetChat = document.getElementById("btn-reset-chat");

// Theme Elements
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");

// Initialize App
function initApp() {
  initTheme();
  renderSlidePage(currentPageNum);
  setupNavigation();
  setupTutorChat();
  setupAccordion();
  setupTextSelectionAutoDraft();
}

// Theme Switcher Logic
function initTheme() {
  const savedTheme = localStorage.getItem("vlearn-theme") || "dark";
  applyTheme(savedTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("vlearn-theme", newTheme);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeIcon && themeText) {
    if (theme === "dark") {
      themeIcon.className = "ri-sun-line";
      themeText.textContent = "Light Mode";
    } else {
      themeIcon.className = "ri-moon-line";
      themeText.textContent = "Dark Mode";
    }
  }
}

// Render PDF Slide Page
function renderSlidePage(pageNum) {
  const slide = pdfSlides.find(s => s.page === pageNum) || pdfSlides[0];

  slidePageNumTop.textContent = `Trang ${slide.page} / 83`;
  navPageIndicator.innerHTML = `Trang <strong>${slide.page}</strong> / 83`;
  slideContextBadge.textContent = `Trang slide: ${slide.page}`;
  currentContextTxt.textContent = `slide trang ${slide.page} (${slide.title.substring(0, 35)}...)`;

  if (slide.page === 1) {
    slideMainContent.innerHTML = `
      <h2>${slide.title}</h2>
      <div class="instructor-card-mock">
        <div class="instructor-avatar-box">
          <i class="ri-user-star-line"></i>
        </div>
        <div class="instructor-info-txt">
          <h3>${slide.instructor}</h3>
          <p class="instructor-role">${slide.role}</p>
          <div class="instructor-bullets">
            ${slide.bullets.map(b => `<p>• ${b}</p>`).join("")}
          </div>
        </div>
      </div>
    `;
  } else {
    slideMainContent.innerHTML = `
      <h2>${slide.title}</h2>
      <div class="instructor-card-mock" style="flex-direction: column; align-items: flex-start;">
        <div class="instructor-role" style="font-size: 13px; font-weight: 700; color: #2563eb;">${slide.instructor} — ${slide.role}</div>
        <div class="instructor-bullets" style="font-size: 13px; line-height: 1.6; margin-bottom: 12px;">
          ${slide.bullets.map(b => `<p>${b}</p>`).join("")}
        </div>
        <div style="width: 100%; background: #0f172a; color: #38bdf8; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${escapeHtml(slide.code)}</div>
      </div>
    `;
  }
}

// Text Selection Auto-Drafting Feature
function setupTextSelectionAutoDraft() {
  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (selectedText && selectedText.length > 2) {
      // Auto draft the question into the tutor input box!
      tutorInputField.value = `Giải thích đoạn "${selectedText}"`;
    }
  });
}

// Setup Page & Drawer Navigation
function setupNavigation() {
  btnPdfPrev.addEventListener("click", () => {
    if (currentPageNum > 1) {
      currentPageNum--;
      renderSlidePage(currentPageNum);
    }
  });

  btnPdfNext.addEventListener("click", () => {
    if (currentPageNum < pdfSlides.length) {
      currentPageNum++;
      renderSlidePage(currentPageNum);
    }
  });

  // Toggle Right Tutor Sidebar Drawer
  btnToggleTutor.addEventListener("click", () => {
    isTutorOpen = !isTutorOpen;
    if (isTutorOpen) {
      vlearnTutorSidebar.classList.remove("closed");
      btnToggleTutor.querySelector(".arrow-icon").className = "ri-arrow-right-s-line arrow-icon";
    } else {
      vlearnTutorSidebar.classList.add("closed");
      btnToggleTutor.querySelector(".arrow-icon").className = "ri-arrow-left-s-line arrow-icon";
    }
  });
}

// Setup VLearn Tutor Chat
function setupTutorChat() {
  btnSendTutor.addEventListener("click", sendTutorMessage);
  tutorInputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendTutorMessage();
  });

  btnResetChat.addEventListener("click", () => {
    tutorChatStream.innerHTML = `
      <div class="tutor-msg-item ai">
        <div class="msg-box">
          Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide để hỏi hoặc gửi câu hỏi tự do nhé!
        </div>
      </div>
    `;
    showVlearnToast("Đã làm mới cuộc trò chuyện VLearn Tutor!");
  });
}

function sendTutorMessage() {
  const text = tutorInputField.value.trim();
  if (!text) return;

  appendTutorMsgItem("user", text);
  tutorInputField.value = "";

  setTimeout(() => {
    generateTutorResponse(text);
  }, 600);
}

function generateTutorResponse(userText) {
  const slide = pdfSlides.find(s => s.page === currentPageNum) || pdfSlides[0];
  let reply = "";

  const lower = userText.toLowerCase();
  if (lower.includes("giải thích đoạn")) {
    const excerpt = userText.replace(/giải thích đoạn/i, "").replace(/"/g, "").trim();
    reply = `💡 **VLearn Tutor giải thích đoạn trích dẫn:**
*Target text:* "${excerpt}"

Căn cứ vào Slide trang ${slide.page} (**${slide.title}**):
1. **Bản chất kiến thức:** Đoạn này đề cập đến việc xử lý biến môi trường và đồng bộ hóa header request khi kết nối API.
2. **Lỗi hay gặp:** Nếu không có \`await dotenv.config()\`, biến API Key bị \`undefined\` làm server trả về HTTP Status \`401 Unauthorized\`.
3. **Cách khắc phục:** Luôn đưa hàm nạp key lên ngay dòng đầu tiên của file ứng dụng!`;
  }
  else if (lower.includes("401") || lower.includes("api key") || lower.includes("async")) {
    reply = `🔴 **Giải đáp từ VLearn Tutor (Theo Slide ${slide.page}):**
Lỗi \`401 Unauthorized\` thường do biến môi trường chưa kịp nạp khi hàm \`async\` gọi đến API Header.
👉 *Cách sửa:* Thêm \`dotenv.config()\` lên dòng 1 trước hàm fetch!`;
  } else if (lower.includes(".env") || lower.includes("undefined")) {
    reply = `⚠️ **Giải đáp về .env:**
File \`.env\` phải nằm ở thư mục gốc của dự án. Không commit file này lên Git công khai để bảo vệ secret key!`;
  } else {
    reply = `📘 **VLearn Tutor (Ngữ cảnh Slide trang ${currentPageNum}):**
Căn cứ vào trang slide **"${slide.title}"**, bạn cần chú ý phần triển khai code thực hành. Bạn có thể bôi đen một câu cụ thể để mình giải thích thêm nhé!`;
  }

  appendTutorMsgItem("ai", reply);
}

function appendTutorMsgItem(sender, text) {
  const item = document.createElement("div");
  item.className = `tutor-msg-item ${sender}`;
  const formatted = text.replace(/\n/g, "<br>");

  item.innerHTML = `<div class="msg-box">${formatted}</div>`;
  tutorChatStream.appendChild(item);
  tutorChatStream.scrollTop = tutorChatStream.scrollHeight;
}

// Setup Left Accordion Selection
function setupAccordion() {
  const accHeaders = document.querySelectorAll(".accordion-header");
  accHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      item.classList.toggle("active");
    });
  });

  const docItems = document.querySelectorAll(".doc-item");
  docItems.forEach(doc => {
    doc.addEventListener("click", () => {
      docItems.forEach(d => d.classList.remove("active"));
      doc.classList.add("active");
      showVlearnToast(`Đã chọn tài liệu: ${doc.querySelector(".doc-name").textContent}`);
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showVlearnToast(msg) {
  const toast = document.getElementById("vlearn-toast");
  const msgSpan = document.getElementById("vlearn-toast-msg");
  if (!toast || !msgSpan) return;

  msgSpan.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Run App
document.addEventListener("DOMContentLoaded", initApp);
