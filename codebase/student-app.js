/**
 * VLearn Student Portal - Slide Viewer & AI Student Tutor Application Script
 * Enables Interactive Slide Navigation, Document Excerpt Copy & Explain workflow,
 * and Student Question Answering.
 */

// Slide Deck Dataset
const slidesData = [
  {
    id: 1,
    title: "Slide 1: Bất đồng bộ khi gọi API Key & Async await Header",
    subtitle: "Khóa học AI Product Development (K3) — Bài 4: Integration",
    body: "Khi tích hợp LLM API trong Web Backend, biến môi trường API Key cần được nạp trước khi khởi tạo client. Nếu thực thi hàm async trước khi nạp key, ứng dụng sẽ báo lỗi 401 Unauthorized do Header request trống.",
    code: `// Slide Code Example 1:
import dotenv from 'dotenv';
dotenv.config(); // Bắt buộc gọi trước async call!

async function callGeminiAPI() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("401 Unauthorized: Missing API Key");
  return await fetch("https://api.vlearn.ai/v1/chat", {
    headers: { "Authorization": \`Bearer \${apiKey}\` }
  });
}`
  },
  {
    id: 2,
    title: "Slide 2: Nạp biến môi trường từ File .env",
    subtitle: "Khóa học AI Product Development (K3) — Bài 4: Environment Setup",
    body: "File `.env` phải được lưu tại thư mục gốc (root) của dự án. Không commit file `.env` lên GitHub công khai để tránh bị leak lộ API Key ra ngoài.",
    code: `# Slide Code Example 2 (.env):
PORT=3000
VLEARN_API_KEY=sk-vlearn-live-998231-k3
DATABASE_URL=postgresql://localhost:5432/vlearn`
  },
  {
    id: 3,
    title: "Slide 3: Vector DB Indexing & Batch Chunking Strategy",
    subtitle: "Khóa học AI Product Development (K3) — Bài 5: RAG System",
    body: "Khi ingest dataset văn bản lớn (>100.000 dòng), cần chia nhỏ tài liệu thành từng Chunk Size (ví dụ 512 tokens, overlap 50 tokens) để tránh bị đè bộ nhớ RAM (Memory Leak) trong ChromaDB hoặc FAISS.",
    code: `// Slide Code Example 3:
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 50
});
const docs = await textSplitter.createDocuments([rawChatlogText]);`
  },
  {
    id: 4,
    title: "Slide 4: Prompt Chaining & LangChain LCEL Syntax",
    subtitle: "Khóa học AI Product Development (K3) — Bài 6: Prompt Engineering",
    body: "Prompt Chaining giúp kết nối đầu ra của Step 1 làm đầu vào cho Step 2 thông qua LangChain Expression Language (LCEL). Sử dụng RunnablePassthrough() để giữ nguyên context giữa các bước.",
    code: `// Slide Code Example 4 (LCEL):
const chain = RunnableSequence.from([
  { question: new RunnablePassthrough() },
  promptTemplate,
  model,
  new StringOutputParser()
]);`
  }
];

// State Variables
let currentSlideIdx = 0;
let attachedContextText = "";

// DOM Elements
const slideIndexBadge = document.getElementById("slide-index-badge");
const slideTitle = document.getElementById("slide-title");
const slideCanvas = document.getElementById("slide-canvas");
const btnPrevSlide = document.getElementById("btn-prev-slide");
const btnNextSlide = document.getElementById("btn-next-slide");
const btnCopySlideDoc = document.getElementById("btn-copy-slide-doc");
const docContextBox = document.getElementById("doc-context-box");
const contextPreviewText = document.getElementById("context-preview-text");
const btnClearContext = document.getElementById("btn-clear-context");

const tutorChatMessages = document.getElementById("tutor-chat-messages");
const studentChatInput = document.getElementById("student-chat-input");
const btnStudentSend = document.getElementById("btn-student-send");
const studentToast = document.getElementById("student-toast");
const studentToastMsg = document.getElementById("student-toast-msg");

// Initialize Application
function initStudentApp() {
  renderSlide(currentSlideIdx);
  setupSlideControls();
  setupStudentChat();
}

// Render Slide Content
function renderSlide(idx) {
  const slide = slidesData[idx];
  if (!slide) return;

  slideIndexBadge.textContent = `SLIDE ${slide.id} / ${slidesData.length}`;
  slideTitle.textContent = slide.title;

  slideCanvas.innerHTML = `
    <div class="slide-content-header">
      <p class="slide-subtitle">${slide.subtitle}</p>
    </div>
    <div class="slide-body-box">
      <p style="margin-bottom: 12px;">${slide.body}</p>
      <div class="code-snippet-box">${escapeHtml(slide.code)}</div>
    </div>
  `;

  // Update nav button states
  btnPrevSlide.disabled = (idx === 0);
  btnNextSlide.disabled = (idx === slidesData.length - 1);
}

// Slide Navigation Setup
function setupSlideControls() {
  btnPrevSlide.addEventListener("click", () => {
    if (currentSlideIdx > 0) {
      currentSlideIdx--;
      renderSlide(currentSlideIdx);
    }
  });

  btnNextSlide.addEventListener("click", () => {
    if (currentSlideIdx < slidesData.length - 1) {
      currentSlideIdx++;
      renderSlide(currentSlideIdx);
    }
  });

  // Copy Slide Document Action
  btnCopySlideDoc.addEventListener("click", () => {
    const slide = slidesData[currentSlideIdx];
    attachedContextText = `[Trích từ Slide ${slide.id}: ${slide.title}]\n"${slide.body}"\nCode:\n${slide.code}`;

    contextPreviewText.textContent = `📄 Attached: ${slide.title} (${slide.body.substring(0, 60)}...)`;
    studentChatInput.value = `AI hãy giải thích giúp em đoạn tài liệu trong Slide ${slide.id} này với ạ?`;

    showStudentToast(`📋 Đã trích dẫn tài liệu Slide ${slide.id} vào Chatbot AI!`);
  });

  btnClearContext.addEventListener("click", () => {
    attachedContextText = "";
    contextPreviewText.textContent = "Chưa dán tài liệu. Hãy chọn Slide và bấm \"Copy đoạn tài liệu\" để gửi cho AI Tutor.";
  });
}

// Student Chatbot Setup
function setupStudentChat() {
  btnStudentSend.addEventListener("click", sendStudentMsg);
  studentChatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendStudentMsg();
  });

  // Student Quick Chips
  const studentChips = document.querySelectorAll(".student-chip");
  studentChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const type = chip.getAttribute("data-q");
      handleStudentChip(type);
    });
  });
}

function sendStudentMsg() {
  const text = studentChatInput.value.trim();
  if (!text) return;

  let fullPrompt = text;
  if (attachedContextText) {
    fullPrompt = `${text}\n\n📌 TÀI LIỆU TRÍCH DẪN:\n${attachedContextText}`;
  }

  appendTutorMsg("student-user", text);
  studentChatInput.value = "";

  setTimeout(() => {
    generateTutorAnswer(text);
  }, 600);
}

function handleStudentChip(type) {
  const slide = slidesData[currentSlideIdx];

  if (type === "explain") {
    const q = `AI hãy giải thích khái niệm trong Slide ${slide.id} giúp em với ạ?`;
    appendTutorMsg("student-user", q);
    setTimeout(() => {
      const ans = `📘 **Giải thích chi tiết Slide ${slide.id}:**
Nội dung này hướng dẫn bạn cách **${slide.title}**.
- **Điểm cốt lõi:** ${slide.body}
- **Lưu ý quan trọng:** Đảm bảo nạp cấu hình trước khi gọi hàm thực thi async để tránh bị ngắt kết nối!`;
      appendTutorMsg("ai-tutor", ans);
    }, 600);
  }
  else if (type === "401") {
    const q = "Sao em bị lỗi 401 Unauthorized khi gọi API Key ạ?";
    appendTutorMsg("student-user", q);
    setTimeout(() => {
      const ans = `🔴 **Nguyên nhân lỗi 401 Unauthorized:**
1. Bạn chưa gọi \`dotenv.config()\` trước khi lấy \`process.env.API_KEY\`.
2. Hàm \`async\` chạy trước khi biến môi trường kịp load khiến header Authorization bị \`undefined\`.
3. Reset API Key mới nhưng quên cập nhật file \`.env\`.`;
      appendTutorMsg("ai-tutor", ans);
    }, 600);
  }
  else if (type === "env") {
    const q = "File .env bị undefined thì sửa thế nào ạ?";
    appendTutorMsg("student-user", q);
    setTimeout(() => {
      const ans = `⚠️ **Cách sửa lỗi .env undefined:**
1. Đảm bảo file tên chính xác là \`.env\` (nằm ở root directory, cùng cấp với package.json).
2. Thêm dòng \`require('dotenv').config()\` hoặc \`import 'dotenv/config'\` ở ngay **DÒNG ĐẦU TIÊN** của file main.js/app.js.`;
      appendTutorMsg("ai-tutor", ans);
    }, 600);
  }
}

function generateTutorAnswer(userQuestion) {
  const slide = slidesData[currentSlideIdx];
  let answer = "";

  if (attachedContextText) {
    answer = `💡 **Giải thích đoạn tài liệu trích dẫn:**\nCăn cứ vào tài liệu Slide ${slide.id}, đoạn kiến thức này giải thích về cơ chế **${slide.title}**.\n\nKhi bạn chạy code:\n- Cần kiểm tra kĩ biến môi trường và cú pháp async/await.\n- Đảm bảo header request không bị bỏ trống!`;
  } else {
    answer = `🤖 **VLearn AI Tutor:** Tôi đã nhận câu hỏi của bạn về bài giảng. Bạn có thể chọn nút **"📋 Copy đoạn tài liệu trong slide"** để tôi giải thích chính xác đoạn văn bản đó nhé!`;
  }

  appendTutorMsg("ai-tutor", answer);
}

function appendTutorMsg(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `tutor-msg ${sender}-msg`;

  const icon = sender === "ai-tutor" ? "ri-robot-line" : "ri-user-3-line";
  const formattedText = text.replace(/\n/g, "<br>");

  msgDiv.innerHTML = `
    <div class="msg-avatar"><i class="${icon}"></i></div>
    <div class="msg-content">${formattedText}</div>
  `;

  tutorChatMessages.appendChild(msgDiv);
  tutorChatMessages.scrollTop = tutorChatMessages.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showStudentToast(msg) {
  studentToastMsg.textContent = msg;
  studentToast.classList.add("show");
  setTimeout(() => {
    studentToast.classList.remove("show");
  }, 3000);
}

// Run Student App
document.addEventListener("DOMContentLoaded", initStudentApp);
