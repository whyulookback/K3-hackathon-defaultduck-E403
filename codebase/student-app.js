/**
 * VLearn Student Portal — local working demo.
 * Loads real PDFs from the backend and sends grounded questions to the Tutor API.
 */

function reportClientError(details) {
  fetch("/api/client-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      level: "error",
      page: window.location.href,
      ...details,
    }),
    keepalive: true,
  }).catch(() => {});
}

window.addEventListener("error", (event) => {
  reportClientError({
    kind: "window_error",
    message: event.message || "Unknown JavaScript error",
    source: event.filename || "",
    line: event.lineno || 0,
    column: event.colno || 0,
    stack: event.error?.stack || "",
  });
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  reportClientError({
    kind: "unhandled_promise_rejection",
    message: reason?.message || String(reason || "Unknown rejected promise"),
    stack: reason?.stack || "",
  });
});

const state = {
  slides: [],
  currentSlide: null,
  currentPage: 1,
  isTutorOpen: true,
  user: null,
  selectedText: "",
};

const syllabusAccordion = document.getElementById("syllabus-accordion");
const slideMainContent = document.getElementById("slide-main-content");
const navPageIndicator = document.getElementById("nav-page-indicator");
const pageJumpInput = document.getElementById("page-jump-input");
const pageTotal = document.getElementById("page-total");
const slidePageNumTop = document.getElementById("slide-page-num-top");
const slideDocTag = document.getElementById("slide-doc-tag");
const pageNoteLabel = document.getElementById("page-note-label");
const currentDocFilename = document.getElementById("current-doc-filename");
const currentDocSubcode = document.getElementById("current-doc-subcode");
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
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");
const loginOverlay = document.getElementById("demo-login-overlay");
const loginForm = document.getElementById("demo-login-form");
const userBadge = document.getElementById("student-user-badge");
let wheelNavigationLocked = false;

function initTheme() {
  const savedTheme = localStorage.getItem("vlearn-theme") || "dark";
  applyTheme(savedTheme);
  btnThemeToggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("vlearn-theme", next);
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (!themeIcon || !themeText) return;
  themeIcon.className = theme === "dark" ? "ri-sun-line" : "ri-moon-line";
  themeText.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function loadSavedUser() {
  try {
    state.user = JSON.parse(localStorage.getItem("vlearn-demo-user") || "null");
  } catch {
    state.user = null;
  }
  if (state.user) {
    loginOverlay?.classList.add("hidden");
    updateUserBadge();
  }
}

function updateUserBadge() {
  if (!state.user || !userBadge) return;
  userBadge.replaceChildren();
  const icon = document.createElement("i");
  icon.className = "ri-user-3-line";
  userBadge.append(icon, document.createTextNode(` ${state.user.name}`));
}

async function handleLogin(event) {
  event.preventDefault();
  const name = document.getElementById("demo-student-name").value.trim();
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role: "student" }),
    });
    if (!response.ok) throw new Error("Không đăng nhập được");
    const result = await response.json();
    state.user = result.user;
    localStorage.setItem("vlearn-demo-user", JSON.stringify(result.user));
    localStorage.setItem("vlearn-demo-token", result.token);
    loginOverlay.classList.add("hidden");
    updateUserBadge();
    showVlearnToast(`Xin chào ${result.user.name}!`);
  } catch (error) {
    showVlearnToast(`${error.message}. Hãy chạy server.py trước.`);
  }
}

async function loadSlides() {
  slideMainContent.innerHTML = '<div class="slide-loading"><i class="ri-loader-4-line ri-spin"></i><span>Đang đọc học liệu PDF...</span></div>';
  try {
    const response = await fetch("/api/slides");
    if (!response.ok) throw new Error("Không tải được danh sách slide");
    const result = await response.json();
    state.slides = result.slides || [];
    renderSlideList();
    if (state.slides.length) {
      await selectSlide(state.slides[0].id);
    } else {
      slideMainContent.innerHTML = '<div class="slide-empty">Giảng viên chưa upload PDF.</div>';
    }
  } catch (error) {
    syllabusAccordion.innerHTML = `<div class="api-error">${escapeHtml(error.message)}<br>Chạy <code>./run-local.ps1</code> rồi mở http://127.0.0.1:8000.</div>`;
    slideMainContent.innerHTML = '<div class="slide-empty">Backend local chưa chạy.</div>';
  }
}

function renderSlideList() {
  syllabusAccordion.replaceChildren();
  const group = document.createElement("div");
  group.className = "accordion-item active";

  const header = document.createElement("div");
  header.className = "accordion-header";
  header.innerHTML = `
    <div class="acc-title-group"><i class="ri-play-circle-line"></i><span class="acc-day-name">AI Product Development</span></div>
    <div class="acc-meta-group"><span class="acc-badge studying">ACTIVE</span><span class="acc-count">${state.slides.length} TÀI LIỆU</span><i class="ri-arrow-up-s-line acc-arrow"></i></div>
  `;
  header.addEventListener("click", () => group.classList.toggle("active"));

  const content = document.createElement("div");
  content.className = "accordion-content";
  state.slides.forEach((slide) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `doc-item ${state.currentSlide?.id === slide.id ? "active" : ""}`;
    item.dataset.slideId = slide.id;
    item.innerHTML = `
      <i class="ri-file-pdf-2-line doc-play-icon"></i>
      <span class="doc-item-info"><span class="doc-name">${escapeHtml(slide.title)}</span><span class="doc-pages">${slide.page_count} trang</span></span>
      <i class="ri-checkbox-circle-fill doc-check-icon"></i>
    `;
    item.addEventListener("click", () => selectSlide(slide.id));
    content.appendChild(item);
  });
  group.append(header, content);
  syllabusAccordion.appendChild(group);
}

async function selectSlide(slideId) {
  const slide = state.slides.find((item) => item.id === slideId);
  if (!slide) return;
  state.currentSlide = slide;
  state.currentPage = 1;
  state.selectedText = "";
  renderSlideList();
  await renderSlidePage();
}

async function renderSlidePage() {
  const slide = state.currentSlide;
  if (!slide) return;
  const page = Math.max(1, Math.min(slide.page_count, state.currentPage));
  state.currentPage = page;

  slidePageNumTop.textContent = `Trang ${page} / ${slide.page_count}`;
  pageJumpInput.value = String(page);
  pageJumpInput.max = String(slide.page_count);
  pageTotal.textContent = String(slide.page_count);
  slideContextBadge.textContent = `Trang slide: ${page}`;
  currentContextTxt.textContent = `${slide.title} · trang ${page} (Tutor có thể tìm toàn bộ học liệu)`;
  pageNoteLabel.textContent = `Trang ${page}`;
  slideDocTag.textContent = slide.filename;
  currentDocFilename.textContent = slide.title;
  currentDocSubcode.textContent = `${slide.filename} · ${slide.page_count} trang`;
  btnPdfPrev.disabled = page <= 1;
  btnPdfNext.disabled = page >= slide.page_count;

  const frame = document.createElement("iframe");
  frame.className = "pdf-slide-frame";
  frame.title = `${slide.title}, trang ${page}`;
  frame.src = `${slide.file_url}#page=${page}&toolbar=0&navpanes=0&view=FitH`;
  slideMainContent.replaceChildren(frame);
}

async function goToPage(pageNumber) {
  if (!state.currentSlide) return;
  const target = Math.max(
    1,
    Math.min(state.currentSlide.page_count, Number(pageNumber) || 1)
  );
  if (target === state.currentPage) {
    pageJumpInput.value = String(target);
    return;
  }
  state.currentPage = target;
  state.selectedText = "";
  await renderSlidePage();
}

function setupNavigation() {
  btnPdfPrev.addEventListener("click", async () => {
    await goToPage(state.currentPage - 1);
  });
  btnPdfNext.addEventListener("click", async () => {
    await goToPage(state.currentPage + 1);
  });
  pageJumpInput.addEventListener("change", async () => {
    await goToPage(pageJumpInput.value);
  });
  pageJumpInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await goToPage(pageJumpInput.value);
      pageJumpInput.blur();
    }
  });
  slideMainContent.addEventListener(
    "wheel",
    async (event) => {
      event.preventDefault();
      if (wheelNavigationLocked || Math.abs(event.deltaY) < 8) return;
      wheelNavigationLocked = true;
      await goToPage(state.currentPage + (event.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => {
        wheelNavigationLocked = false;
      }, 350);
    },
    { passive: false }
  );
  slideMainContent.addEventListener("keydown", async (event) => {
    if (event.key === "PageDown" || event.key === "ArrowDown") {
      event.preventDefault();
      await goToPage(state.currentPage + 1);
    } else if (event.key === "PageUp" || event.key === "ArrowUp") {
      event.preventDefault();
      await goToPage(state.currentPage - 1);
    }
  });
  btnToggleTutor.addEventListener("click", () => {
    state.isTutorOpen = !state.isTutorOpen;
    vlearnTutorSidebar.classList.toggle("closed", !state.isTutorOpen);
    btnToggleTutor.querySelector(".arrow-icon").className = state.isTutorOpen
      ? "ri-arrow-right-s-line arrow-icon"
      : "ri-arrow-left-s-line arrow-icon";
  });
}

function setupTutorChat() {
  btnSendTutor.addEventListener("click", sendTutorMessage);
  tutorInputField.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendTutorMessage();
    }
  });
  btnResetChat.addEventListener("click", () => {
    tutorChatStream.replaceChildren();
    appendTutorMessage(
      "ai",
      "Xin chào! Mình sẽ tìm trên toàn bộ học liệu và luôn dẫn nguồn theo đúng trang slide."
    );
  });
}

async function sendTutorMessage() {
  const question = tutorInputField.value.trim();
  if (!question || !state.currentSlide || btnSendTutor.disabled) return;
  const referencedPageMatch = question.match(
    /\b(?:trang|page)\s*(?:số\s*)?(\d{1,4})\b/i
  );
  if (referencedPageMatch) {
    await goToPage(Number(referencedPageMatch[1]));
  }
  appendTutorMessage("user", question);
  tutorInputField.value = "";
  btnSendTutor.disabled = true;
  const loading = appendTutorMessage("ai", "Đang tìm các trang liên quan...", true);

  try {
    const response = await fetch("/api/chat/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: state.user?.id || "DEMO-STUDENT",
        session_id: `SESSION-${state.user?.id || "ANON"}`,
        slide_id: state.currentSlide.id,
        page_number: state.currentPage,
        selected_text: state.selectedText,
        question,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Tutor chưa trả lời được");
    loading.remove();
    appendTutorMessage("ai", result.answer, false, result.citations || [], result.status);
  } catch (error) {
    loading.remove();
    appendTutorMessage("ai", `Có lỗi khi gọi Tutor: ${error.message}`);
  } finally {
    btnSendTutor.disabled = false;
    tutorInputField.focus();
  }
}

function appendTutorMessage(sender, text, loading = false, citations = [], status = "") {
  const item = document.createElement("div");
  item.className = `tutor-msg-item ${sender}${loading ? " loading" : ""}`;
  const box = document.createElement("div");
  box.className = "msg-box";
  const body = document.createElement("div");
  body.className = "tutor-answer-text";
  body.textContent = text;
  box.appendChild(body);

  if (sender === "ai" && status && status !== "answered") {
    const badge = document.createElement("span");
    badge.className = `answer-status ${status}`;
    badge.textContent = status === "out_of_scope" ? "Ngoài phạm vi" : "Chưa đủ ngữ cảnh";
    box.prepend(badge);
  }

  if (citations.length) {
    const sourceRow = document.createElement("div");
    sourceRow.className = "tutor-citations";
    citations.forEach((citation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${citation.title || "Slide"} · trang ${citation.page}`;
      button.addEventListener("click", async () => {
        if (citation.slide_id !== state.currentSlide?.id) {
          await selectSlide(citation.slide_id);
        }
        state.currentPage = citation.page;
        await renderSlidePage();
      });
      sourceRow.appendChild(button);
    });
    box.appendChild(sourceRow);
  }
  item.appendChild(box);
  tutorChatStream.appendChild(item);
  tutorChatStream.scrollTop = tutorChatStream.scrollHeight;
  return item;
}

function showVlearnToast(message) {
  const toast = document.getElementById("vlearn-toast");
  const span = document.getElementById("vlearn-toast-msg");
  if (!toast || !span) return;
  span.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function initApp() {
  initTheme();
  loadSavedUser();
  loginForm?.addEventListener("submit", handleLogin);
  setupNavigation();
  setupTutorChat();
  await loadSlides();
}

document.addEventListener("DOMContentLoaded", initApp);
