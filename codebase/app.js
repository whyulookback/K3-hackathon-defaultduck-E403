/**
 * VLearn Topic Interest Map — working admin dashboard.
 * Reads continuous clustering results from the local backend.
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

let clustersData = [];
let selectedClusterId = null;
let currentViewMode = "grid";
let currentWindow = "7d";
const requestedScope = new URLSearchParams(window.location.search).get("scope");
let currentScope = requestedScope === "slides" ? "slides" : "dataset";
let pollTimer = null;
let lastGeneratedAt = null;

const heatmapGrid = document.getElementById("heatmap-grid");
const topicChartView = document.getElementById("chart-view-container");
const chartBarsList = document.getElementById("chart-legend-list");
const btnModeGrid = document.getElementById("btn-mode-grid");
const btnModeChart = document.getElementById("btn-mode-chart");
const clusterSeverity = document.getElementById("cluster-severity");
const clusterTitle = document.getElementById("cluster-title");
const clusterStats = document.getElementById("cluster-stats");
const recBody = document.getElementById("rec-body");
const chatlogList = document.getElementById("chatlog-list");
const chatlogCount = document.getElementById("chatlog-count");
const btnRecluster = document.getElementById("btn-recluster");
const btnAddSlide = document.getElementById("btn-add-slide");
const btnEditTitle = document.getElementById("btn-edit-title");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");
const uploadInput = document.getElementById("slide-upload-input");
const btnUploadSlide = document.getElementById("btn-upload-slide");
const adminLoginOverlay = document.getElementById("admin-login-overlay");
const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginError = document.getElementById("admin-login-error");
const adminLogoutBtn = document.getElementById("admin-logout-btn");

async function restoreAdminSession() {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) throw new Error("No active session");
    const result = await response.json();
    if (result.user?.role !== "admin") {
      if (adminLoginError) {
        adminLoginError.textContent =
          "Bạn đang đăng nhập bằng vai trò Học viên. Nhập access code để chuyển sang Admin.";
        adminLoginError.classList.remove("hidden");
        adminLoginError.classList.add("role-switch-notice");
      }
      adminLoginOverlay?.classList.remove("hidden");
      return false;
    }
    adminLoginOverlay?.classList.add("hidden");
    return true;
  } catch {
    adminLoginOverlay?.classList.remove("hidden");
    return false;
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  adminLoginError?.classList.add("hidden");
  adminLoginError?.classList.remove("role-switch-notice");
  const name = document.getElementById("admin-display-name").value.trim();
  const accessCode = document.getElementById("admin-access-code").value.trim();
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        role: "admin",
        access_code: accessCode,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không đăng nhập được");
    if (result.user?.role !== "admin") {
      throw new Error("Tài khoản không có quyền Admin");
    }
    window.location.reload();
  } catch (error) {
    if (adminLoginError) {
      adminLoginError.textContent = error.message;
      adminLoginError.classList.remove("hidden");
    }
  }
}

async function logoutAdmin() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.replace("/admin");
}

async function ensureAdminAccess(response) {
  if (response.status === 401 || response.status === 403) {
    await logoutAdmin();
    return false;
  }
  return true;
}

function initTheme() {
  const saved = localStorage.getItem("vlearn-theme") || "dark";
  applyTheme(saved);
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
  themeIcon.className = theme === "light" ? "ri-moon-line" : "ri-sun-line";
  themeText.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
}

async function loadClusters(showLoader = true) {
  if (showLoader) renderProcessingState();
  try {
    const response = await fetch(
      `/api/admin/clusters?window=${currentWindow}&scope=${currentScope}`
    );
    if (!(await ensureAdminAccess(response))) return;
    const result = await response.json();
    if (response.status === 202 || result.status === "processing") {
      schedulePoll();
      return;
    }
    if (!response.ok || result.status === "error") {
      throw new Error(result.error || "Không tải được kết quả clustering");
    }
    if (result.refreshing) {
      schedulePoll(1800);
    } else {
      schedulePoll(15000); // Poll every 15s to get continuous updates
    }
    
    // Check if data actually changed to avoid flickering
    if (result.generated_at === lastGeneratedAt && !result.refreshing && clustersData.length > 0) {
      return; 
    }
    lastGeneratedAt = result.generated_at;

    clustersData = result.clusters || [];
    selectedClusterId = clustersData.some((item) => item.id === selectedClusterId)
      ? selectedClusterId
      : clustersData[0]?.id || null;
    updateOverview(result);
    renderHeatmap();
    renderTopicDonutChart(result.total_pairs);
    if (selectedClusterId) selectCluster(selectedClusterId);
  } catch (error) {
    heatmapGrid.innerHTML = `<div class="cluster-error"><i class="ri-error-warning-line"></i><strong>Chưa kết nối được backend</strong><span>${escapeHtml(error.message)}</span><code>./run-local.ps1</code></div>`;
  }
}

function schedulePoll(delay = 1800) {
  clearTimeout(pollTimer);
  pollTimer = window.setTimeout(() => loadClusters(false), delay);
}

function renderProcessingState() {
  heatmapGrid.innerHTML = `
    <div class="cluster-processing">
      <i class="ri-loader-4-line ri-spin"></i>
      <strong>Đang vector hóa hội thoại...</strong>
      <span>Voyage xử lý QUESTION + TUTOR_ANSWER, sau đó OpenRouter đặt tên cụm.</span>
    </div>
  `;
}

function updateOverview(result) {
  document.getElementById("class-meta").textContent =
    `${result.unique_users.toLocaleString("vi-VN")} học viên · ${result.total_pairs.toLocaleString("vi-VN")} lượt hỏi–đáp`;
  document.getElementById("kpi-total-pairs").textContent =
    result.total_pairs.toLocaleString("vi-VN");
  document.getElementById("kpi-unique-users").textContent =
    result.unique_users.toLocaleString("vi-VN");
  document.getElementById("chart-total").textContent =
    `Tổng số: ${result.total_pairs.toLocaleString("vi-VN")} lượt hỏi–đáp`;
  document.getElementById("analysis-desc").textContent =
    currentScope === "slides"
      ? `Dữ liệu synthetic từ 2 PDF · ${result.total_pairs.toLocaleString("vi-VN")} cặp question + tutor answer · có mapping trang`
      : `Chatlog thật · ${result.total_pairs.toLocaleString("vi-VN")} cặp question + tutor answer · ${labelWindow(currentWindow)}`;
  const top = result.clusters[0];
  document.getElementById("kpi-top-topic").textContent = top?.name || "Chưa có dữ liệu";
  document.getElementById("kpi-top-topic-sub").textContent = top
    ? `${top.question_count} lượt hỏi · ${top.percentage}% hội thoại`
    : "Chưa có hội thoại";
  document.getElementById("kpi-provider").textContent =
    result.embedding_provider?.startsWith("voyage") ? "Voyage + LLM" : "Local fallback";
  document.getElementById("kpi-generated-at").textContent =
    result.generated_at
      ? `Cập nhật ${new Date(result.generated_at).toLocaleTimeString("vi-VN")}`
      : "Đang chờ lần chạy đầu";
}

function renderHeatmap() {
  heatmapGrid.replaceChildren();
  clustersData.forEach((cluster) => {
    const block = document.createElement("button");
    block.type = "button";
    block.className = `heatmap-block ${cluster.id === selectedClusterId ? "active-block" : ""}`;
    block.style.setProperty("--block-color", cluster.color);
    block.style.setProperty("--block-glow", cluster.glow);
    const pageSignal = currentScope === "slides" && cluster.top_pages?.length
      ? `<span class="slide-page-signal"><i class="ri-slideshow-line"></i> ${escapeHtml(cluster.top_pages[0].slide_filename)} · trang ${cluster.top_pages[0].page_number}</span>`
      : "";
    block.innerHTML = `
      <div class="block-header">
        <h3 class="block-name">${escapeHtml(cluster.name)}</h3>
        <span class="block-count">${cluster.question_count} lượt</span>
      </div>
      ${pageSignal}
      <p class="block-summary">${escapeHtml(cluster.summary || "")}</p>
      <div class="block-metrics">
        <div style="width:100%">
          <div class="block-footer-txt"><span><strong>${cluster.unique_users}</strong> học viên duy nhất</span><span>${cluster.percentage}%</span></div>
          <div class="pct-bar-bg"><div class="pct-bar-fill" style="width:${Math.min(100, cluster.percentage)}%"></div></div>
        </div>
      </div>
    `;
    block.addEventListener("click", () => selectCluster(cluster.id));
    heatmapGrid.appendChild(block);
  });
}

function renderTopicDonutChart(totalPairs = 0) {
  chartBarsList.replaceChildren();
  if (!clustersData.length) return;
  let cumulative = 0;
  const stops = clustersData
    .map((cluster) => {
      const start = cumulative;
      cumulative += cluster.percentage;
      return `${cluster.color} ${start}% ${cumulative}%`;
    })
    .join(", ");

  const layout = document.createElement("div");
  layout.className = "donut-chart-layout";
  const visual = document.createElement("div");
  visual.className = "donut-visual-box";
  visual.innerHTML = `<div class="donut-circle" style="background:conic-gradient(${stops})"><div class="donut-hole"><span class="donut-center-val">${totalPairs.toLocaleString("vi-VN")}</span><span class="donut-center-lbl">Lượt hỏi–đáp</span></div></div>`;

  const legend = document.createElement("div");
  legend.className = "donut-legend-list";
  clustersData.forEach((cluster) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `donut-legend-item ${cluster.id === selectedClusterId ? "active-legend" : ""}`;
    item.innerHTML = `
      <span class="legend-dot" style="background:${cluster.color}"></span>
      <span class="legend-info"><span class="legend-title">${escapeHtml(cluster.name)}</span><span class="legend-sub">${cluster.question_count} lượt · <strong>${cluster.percentage}%</strong></span></span>
    `;
    item.addEventListener("click", () => selectCluster(cluster.id));
    legend.appendChild(item);
  });
  layout.append(visual, legend);
  chartBarsList.appendChild(layout);
}

function selectCluster(clusterId) {
  selectedClusterId = clusterId;
  const cluster = clustersData.find((item) => item.id === clusterId);
  if (!cluster) return;
  document.querySelectorAll(".heatmap-block").forEach((block, index) => {
    block.classList.toggle("active-block", clustersData[index]?.id === clusterId);
  });
  document.querySelectorAll(".donut-legend-item").forEach((item, index) => {
    item.classList.toggle("active-legend", clustersData[index]?.id === clusterId);
  });
  clusterSeverity.textContent = cluster.out_of_scope
    ? "NGOÀI PHẠM VI"
    : `QUAN TÂM ${cluster.interest_level || cluster.severity}`;
  clusterSeverity.className = `severity-badge ${cluster.out_of_scope ? "LOW" : cluster.severity}`;
  clusterTitle.textContent = cluster.name;
  clusterStats.textContent =
    `${cluster.question_count} lượt hỏi–đáp · ${cluster.unique_users} học viên duy nhất · ${cluster.percentage}%`
    + (currentScope === "slides" && cluster.top_pages?.length
      ? ` · Trang nổi bật: ${cluster.top_pages.slice(0, 3).map((item) => `${item.page_number}`).join(", ")}`
      : "");
  recBody.textContent = cluster.ai_recommendation;
  renderEvidence(cluster.evidence || []);
}

function renderEvidence(evidence) {
  chatlogCount.textContent = evidence.length;
  chatlogList.replaceChildren();
  evidence.forEach((log) => {
    const item = document.createElement("article");
    item.className = "chatlog-item evidence-pair";
    const meta = document.createElement("div");
    meta.className = "chat-meta";
    const user = document.createElement("span");
    user.className = "chat-user";
    user.textContent = log.user;
    const time = document.createElement("span");
    time.className = "chat-time";
    time.textContent = log.slide_filename && log.page_number
      ? `${log.slide_filename} · trang ${log.page_number}`
      : formatDate(log.time);
    meta.append(user, time);

    const questionLabel = document.createElement("span");
    questionLabel.className = "evidence-label question";
    questionLabel.textContent = "Học viên hỏi";
    const question = document.createElement("p");
    question.className = "chat-text";
    question.textContent = log.question;
    const answerLabel = document.createElement("span");
    answerLabel.className = "evidence-label answer";
    answerLabel.textContent = "Tutor trả lời";
    const answer = document.createElement("p");
    answer.className = "chat-text tutor-evidence-answer";
    answer.textContent = log.answer;
    item.append(meta, questionLabel, question, answerLabel, answer);
    if (log.slide_id && log.page_number) {
      const openSlide = document.createElement("button");
      openSlide.type = "button";
      openSlide.className = "btn-open-evidence-slide";
      openSlide.innerHTML = `<i class="ri-external-link-line"></i> Mở PDF tại trang ${log.page_number}`;
      openSlide.addEventListener("click", () => {
        window.open(
          `/api/slides/${encodeURIComponent(log.slide_id)}/file#page=${log.page_number}`,
          "_blank",
          "noopener"
        );
      });
      item.appendChild(openSlide);
    }
    chatlogList.appendChild(item);
  });
}

function setupViewSwitcher() {
  btnModeGrid.addEventListener("click", () => {
    currentViewMode = "grid";
    btnModeGrid.classList.add("active");
    btnModeChart.classList.remove("active");
    heatmapGrid.classList.remove("hidden");
    topicChartView.classList.add("hidden");
  });
  btnModeChart.addEventListener("click", () => {
    currentViewMode = "chart";
    btnModeChart.classList.add("active");
    btnModeGrid.classList.remove("active");
    topicChartView.classList.remove("hidden");
    heatmapGrid.classList.add("hidden");
  });
}

function setupFiltersAndActions() {
  document.querySelectorAll(".time-filter .filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      currentWindow = button.dataset.time;
      selectedClusterId = null;
      loadClusters();
    });
  });

  document.querySelectorAll("[data-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-scope]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      currentScope = button.dataset.scope;
      selectedClusterId = null;
      loadClusters();
    });
  });

  btnRecluster.addEventListener("click", async () => {
    btnRecluster.disabled = true;
    btnRecluster.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Đang chạy...';
    try {
      const response = await fetch("/api/admin/clusters/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ window: currentWindow, scope: currentScope }),
      });
      if (!(await ensureAdminAccess(response))) return;
      renderProcessingState();
      showToast("Đã yêu cầu chạy lại clustering trên dữ liệu mới nhất.");
      window.setTimeout(() => loadClusters(false), 2200);
    } finally {
      window.setTimeout(() => {
        btnRecluster.disabled = false;
        btnRecluster.innerHTML = '<i class="ri-refresh-line"></i> AI Re-Cluster';
      }, 1500);
    }
  });

  btnAddSlide.addEventListener("click", () => {
    const cluster = clustersData.find((item) => item.id === selectedClusterId);
    if (cluster) showToast(`Đã đưa “${cluster.name}” vào agenda buổi sau.`);
  });

  btnEditTitle.addEventListener("click", async () => {
    const cluster = clustersData.find((item) => item.id === selectedClusterId);
    if (!cluster) return;
    const nextName = window.prompt("Sửa tên cụm chủ đề:", cluster.name);
    if (!nextName?.trim()) return;
    const response = await fetch(`/api/admin/clusters/${cluster.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName.trim(), window: currentWindow, scope: currentScope }),
    });
    if (!(await ensureAdminAccess(response))) return;
    if (!response.ok) return showToast("Không lưu được tên cụm.");
    cluster.name = nextName.trim();
    renderHeatmap();
    renderTopicDonutChart(
      clustersData.reduce((sum, item) => sum + item.question_count, 0)
    );
    selectCluster(cluster.id);
    showToast("Đã lưu tên cụm do giảng viên chỉnh sửa.");
  });
}

function setupUpload() {
  btnUploadSlide.addEventListener("click", () => uploadInput.click());
  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    if (!file) return;
    btnUploadSlide.disabled = true;
    btnUploadSlide.querySelector("span").textContent = "Đang đọc PDF...";
    try {
      const response = await fetch(
        `/api/admin/slides?filename=${encodeURIComponent(file.name)}&title=${encodeURIComponent(file.name.replace(/\.pdf$/i, ""))}`,
        { method: "POST", headers: { "Content-Type": "application/pdf" }, body: file }
      );
      if (!(await ensureAdminAccess(response))) return;
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload thất bại");
      showToast(`Đã upload ${result.title} (${result.page_count} trang).`);
    } catch (error) {
      showToast(error.message);
    } finally {
      uploadInput.value = "";
      btnUploadSlide.disabled = false;
      btnUploadSlide.querySelector("span").textContent = "Upload slide";
    }
  });
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function labelWindow(value) {
  if (value === "24h") return "24 giờ gần nhất";
  if (value === "all") return "toàn bộ dữ liệu";
  return "7 ngày gần nhất";
}

function showToast(message) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
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

async function initDashboard() {
  initTheme();
  adminLoginForm?.addEventListener("submit", handleAdminLogin);
  adminLogoutBtn?.addEventListener("click", logoutAdmin);
  const authenticated = await restoreAdminSession();
  if (!authenticated) return;
  document.querySelectorAll("[data-scope]").forEach((button) => {
    button.classList.toggle("active", button.dataset.scope === currentScope);
  });
  setupViewSwitcher();
  setupFiltersAndActions();
  setupUpload();
  initChatbot();
  await loadClusters();
}

document.addEventListener("DOMContentLoaded", initDashboard);

// ── Admin Chatbot Agent ──────────────────────────────────────────────────────

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const chatbotFab = document.getElementById("chatbot-fab");
const chatbotPanel = document.getElementById("chatbot-panel");
const chatbotClose = document.getElementById("chatbot-close");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotSend = document.getElementById("chatbot-send");
const chatbotSuggestions = document.getElementById("chatbot-suggestions");

let chatbotHistory = [];
let chatbotBusy = false;

const TOOL_LABELS = {
  query_student_stats: { icon: "ri-bar-chart-line", label: "Thống kê học viên" },
  query_topic_distribution: { icon: "ri-pie-chart-line", label: "Phân bố chủ đề" },
  query_most_asked_questions: { icon: "ri-question-line", label: "Câu hỏi phổ biến" },
  search_knowledge_base: { icon: "ri-search-eye-line", label: "Tìm kiến thức" },
  query_student_struggles: { icon: "ri-error-warning-line", label: "Vướng mắc học sinh" },
  generate_quiz: { icon: "ri-questionnaire-line", label: "Tạo quiz" },
  scan_runtime_logs: { icon: "ri-terminal-box-line", label: "Quét log hệ thống" },
};

function initChatbot() {
  if (!chatbotFab || !chatbotPanel) return;
  chatbotFab.addEventListener("click", toggleChatbotPanel);
  chatbotClose?.addEventListener("click", () => setChatbotOpen(false));
  chatbotSend?.addEventListener("click", sendChatbotMessage);
  chatbotInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatbotMessage();
    }
  });
  chatbotInput?.addEventListener("input", autoResizeInput);
  chatbotSuggestions?.querySelectorAll(".chatbot-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.dataset.prompt;
      if (prompt && chatbotInput) {
        chatbotInput.value = prompt;
        sendChatbotMessage();
      }
    });
  });
}

function toggleChatbotPanel() {
  const isOpen = chatbotPanel.classList.contains("chatbot-panel-open");
  setChatbotOpen(!isOpen);
}

function setChatbotOpen(open) {
  chatbotPanel.classList.toggle("chatbot-panel-open", open);
  chatbotFab.classList.toggle("chatbot-fab-hidden", open);
  if (open) {
    chatbotInput?.focus();
    scrollChatToBottom();
  }
}

function autoResizeInput() {
  if (!chatbotInput) return;
  chatbotInput.style.height = "auto";
  chatbotInput.style.height = Math.min(chatbotInput.scrollHeight, 120) + "px";
}

function scrollChatToBottom() {
  if (chatbotMessages) {
    requestAnimationFrame(() => {
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    });
  }
}

function appendChatMessage(role, content, toolCalls) {
  // Hide welcome on first message
  const welcome = chatbotMessages?.querySelector(".chatbot-welcome");
  if (welcome) welcome.style.display = "none";

  const msgEl = document.createElement("div");
  msgEl.className = `chatbot-msg chatbot-msg-${role}`;

  if (role === "user") {
    msgEl.innerHTML = `
      <div class="chatbot-msg-bubble chatbot-msg-user-bubble">
        <p>${escapeHtml(content)}</p>
      </div>
    `;
  } else {
    // Tool badges
    let toolBadgesHtml = "";
    if (toolCalls && toolCalls.length > 0) {
      const badges = toolCalls.map((tc) => {
        const info = TOOL_LABELS[tc.tool] || { icon: "ri-tools-line", label: tc.tool };
        return `<span class="chatbot-tool-badge"><i class="${info.icon}"></i> ${escapeHtml(info.label)}</span>`;
      }).join("");
      toolBadgesHtml = `<div class="chatbot-tool-badges">${badges}</div>`;
    }

    msgEl.innerHTML = `
      <div class="chatbot-msg-avatar"><i class="ri-robot-2-line"></i></div>
      <div class="chatbot-msg-content">
        ${toolBadgesHtml}
        <div class="chatbot-msg-bubble chatbot-msg-assistant-bubble">
          ${formatChatbotContent(content)}
        </div>
      </div>
    `;
  }

  chatbotMessages?.appendChild(msgEl);
  scrollChatToBottom();
  return msgEl;
}

function appendThinkingIndicator() {
  const el = document.createElement("div");
  el.className = "chatbot-msg chatbot-msg-assistant chatbot-thinking";
  el.id = "chatbot-thinking";
  el.innerHTML = `
    <div class="chatbot-msg-avatar"><i class="ri-robot-2-line"></i></div>
    <div class="chatbot-msg-content">
      <div class="chatbot-thinking-indicator">
        <div class="chatbot-thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="chatbot-thinking-text">Đang phân tích dữ liệu...</span>
      </div>
    </div>
  `;
  chatbotMessages?.appendChild(el);
  scrollChatToBottom();
  return el;
}

function removeThinkingIndicator() {
  document.getElementById("chatbot-thinking")?.remove();
}

function formatChatbotContent(text) {
  if (!text) return "<p>—</p>";
  let html = escapeHtml(text);
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Inline code: `text`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Numbered lists
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, "<li>$2</li>");
  // Bullet lists
  html = html.replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>");
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, "<ul>$1</ul>");
  // Line breaks to paragraphs
  html = html.split(/\n{2,}/).map((p) => p.trim() ? `<p>${p.trim()}</p>` : "").join("");
  // Single newlines to <br>
  html = html.replace(/\n/g, "<br>");
  return html || "<p>—</p>";
}

async function sendChatbotMessage() {
  if (chatbotBusy || !chatbotInput) return;
  const text = chatbotInput.value.trim();
  if (!text) return;

  chatbotInput.value = "";
  chatbotInput.style.height = "auto";
  chatbotBusy = true;
  chatbotSend?.classList.add("chatbot-send-disabled");

  // Hide suggestions after first message
  if (chatbotSuggestions) chatbotSuggestions.style.display = "none";

  // Add user message
  chatbotHistory.push({ role: "user", content: text });
  appendChatMessage("user", text);

  // Show thinking
  appendThinkingIndicator();

  try {
    const response = await fetch("/api/admin/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatbotHistory }),
    });
    if (!(await ensureAdminAccess(response))) return;
    const data = await response.json();

    removeThinkingIndicator();

    const assistantContent = data.content || data.error || "Không có phản hồi.";
    chatbotHistory.push({ role: "assistant", content: assistantContent });
    appendChatMessage("assistant", assistantContent, data.tool_calls_log || []);
  } catch (err) {
    removeThinkingIndicator();
    appendChatMessage("assistant", `Lỗi kết nối: ${err.message}`, []);
  } finally {
    chatbotBusy = false;
    chatbotSend?.classList.remove("chatbot-send-disabled");
    chatbotInput?.focus();
  }
}
