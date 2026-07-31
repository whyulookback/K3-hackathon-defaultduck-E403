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

const heatmapGrid = document.getElementById("heatmap-grid");
const topicChartView = document.getElementById("chart-view-container") || document.getElementById("topic-chart-view");
const chartBarsList = document.getElementById("chart-legend-list") || document.getElementById("chart-bars-list");
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
const btnOpenChat = document.getElementById("btn-open-chat");
const btnCloseChat = document.getElementById("btn-close-chat");
const chatDrawer = document.getElementById("chat-drawer");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const btnSendChat = document.getElementById("btn-send-chat");
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");
const uploadInput = document.getElementById("slide-upload-input");
const btnUploadSlide = document.getElementById("btn-upload-slide");

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
    const result = await response.json();
    if (response.status === 202 || result.status === "processing") {
      schedulePoll();
      return;
    }
    if (!response.ok || result.status === "error") {
      throw new Error(result.error || "Không tải được kết quả clustering");
    }
    if (result.refreshing) {
      schedulePoll();
    } else {
      clearTimeout(pollTimer);
    }
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

function schedulePoll() {
  clearTimeout(pollTimer);
  pollTimer = window.setTimeout(() => loadClusters(false), 1800);
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
  const classMeta = document.getElementById("class-meta");
  if (classMeta) classMeta.textContent = `${result.unique_users.toLocaleString("vi-VN")} học viên · ${result.total_pairs.toLocaleString("vi-VN")} lượt hỏi–đáp`;
  const kpiTotalPairs = document.getElementById("kpi-total-pairs");
  if (kpiTotalPairs) kpiTotalPairs.textContent = result.total_pairs.toLocaleString("vi-VN");
  const kpiUniqueUsers = document.getElementById("kpi-unique-users");
  if (kpiUniqueUsers) kpiUniqueUsers.textContent = result.unique_users.toLocaleString("vi-VN");
  const chartTotal = document.getElementById("chart-total");
  if (chartTotal) chartTotal.textContent = `Tổng số: ${result.total_pairs.toLocaleString("vi-VN")} lượt hỏi–đáp`;
  const analysisDesc = document.getElementById("analysis-desc");
  if (analysisDesc) {
    analysisDesc.textContent = currentScope === "slides"
      ? `Dữ liệu synthetic từ 2 PDF · ${result.total_pairs.toLocaleString("vi-VN")} cặp question + tutor answer · có mapping trang`
      : `Chatlog thật · ${result.total_pairs.toLocaleString("vi-VN")} cặp question + tutor answer · ${labelWindow(currentWindow)}`;
  }
  const top = result.clusters?.[0];
  const kpiTopTopic = document.getElementById("kpi-top-topic");
  if (kpiTopTopic) kpiTopTopic.textContent = top?.name || "Chưa có dữ liệu";
  const kpiTopTopicSub = document.getElementById("kpi-top-topic-sub");
  if (kpiTopTopicSub) {
    kpiTopTopicSub.textContent = top
      ? `${top.question_count} lượt hỏi · ${top.percentage}% hội thoại`
      : "Chưa có hội thoại";
  }
  const kpiProvider = document.getElementById("kpi-provider");
  if (kpiProvider) {
    kpiProvider.textContent = result.embedding_provider?.startsWith("voyage") ? "Voyage + LLM" : "Local fallback";
  }
  const kpiGeneratedAt = document.getElementById("kpi-generated-at");
  if (kpiGeneratedAt) {
    kpiGeneratedAt.textContent = result.generated_at
      ? `Cập nhật ${new Date(result.generated_at).toLocaleTimeString("vi-VN")}`
      : "Đang chờ lần chạy đầu";
  }
}

function renderHeatmap() {
  if (!heatmapGrid) return;
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
  if (!chartBarsList) return;
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
  if (clusterSeverity) {
    clusterSeverity.textContent = cluster.out_of_scope
      ? "NGOÀI PHẠM VI"
      : `QUAN TÂM ${cluster.interest_level || cluster.severity}`;
    clusterSeverity.className = `severity-badge ${cluster.out_of_scope ? "LOW" : cluster.severity}`;
  }
  if (clusterTitle) clusterTitle.textContent = cluster.name;
  if (clusterStats) {
    clusterStats.textContent =
      `${cluster.question_count} lượt hỏi–đáp · ${cluster.unique_users} học viên duy nhất · ${cluster.percentage}%`
      + (currentScope === "slides" && cluster.top_pages?.length
        ? ` · Trang nổi bật: ${cluster.top_pages.slice(0, 3).map((item) => `${item.page_number}`).join(", ")}`
        : "");
  }
  if (recBody) recBody.textContent = cluster.ai_recommendation || "";
  renderEvidence(cluster.evidence || []);
}

function renderEvidence(evidence) {
  if (chatlogCount) chatlogCount.textContent = evidence.length;
  if (!chatlogList) return;
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
  btnModeGrid?.addEventListener("click", () => {
    currentViewMode = "grid";
    btnModeGrid.classList.add("active");
    btnModeChart?.classList.remove("active");
    heatmapGrid?.classList.remove("hidden");
    topicChartView?.classList.add("hidden");
  });
  btnModeChart?.addEventListener("click", () => {
    currentViewMode = "chart";
    btnModeChart.classList.add("active");
    btnModeGrid?.classList.remove("active");
    topicChartView?.classList.remove("hidden");
    heatmapGrid?.classList.add("hidden");
  });
}

function setupFiltersAndActions() {
  document.querySelectorAll(".time-filter .filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".time-filter .filter-btn").forEach((item) => item.classList.remove("active"));
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

  btnRecluster?.addEventListener("click", async () => {
    if (!btnRecluster) return;
    btnRecluster.disabled = true;
    btnRecluster.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Đang chạy...';
    try {
      await fetch("/api/admin/clusters/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ window: currentWindow, scope: currentScope }),
      });
      renderProcessingState();
      showToast("Đã yêu cầu chạy lại clustering trên dữ liệu mới nhất.");
      window.setTimeout(() => loadClusters(false), 2200);
    } finally {
      window.setTimeout(() => {
        if (btnRecluster) {
          btnRecluster.disabled = false;
          btnRecluster.innerHTML = '<i class="ri-refresh-line"></i> AI Re-Cluster';
        }
      }, 1500);
    }
  });

  btnAddSlide?.addEventListener("click", () => {
    const cluster = clustersData.find((item) => item.id === selectedClusterId);
    if (cluster) showToast(`Đã đưa “${cluster.name}” vào agenda buổi sau.`);
  });

  btnEditTitle?.addEventListener("click", async () => {
    const cluster = clustersData.find((item) => item.id === selectedClusterId);
    if (!cluster) return;
    const nextName = window.prompt("Sửa tên cụm chủ đề:", cluster.name);
    if (!nextName?.trim()) return;
    const response = await fetch(`/api/admin/clusters/${cluster.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName.trim(), window: currentWindow, scope: currentScope }),
    });
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

function setupChatbot() {
  btnOpenChat.addEventListener("click", () => chatDrawer.classList.toggle("active"));
  btnCloseChat.addEventListener("click", () => chatDrawer.classList.remove("active"));
  document.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const cluster = clustersData.find((item) => item.id === selectedClusterId);
      if (!cluster) return;
      const type = chip.dataset.prompt;
      const answers = {
        miss: `Không có slide đối chứng nên hệ thống chưa kết luận bài giảng “miss”. Tín hiệu chắc chắn hiện có: chủ đề “${cluster.name}” chiếm ${cluster.percentage}% hội thoại và liên quan ${cluster.unique_users} học viên duy nhất.`,
        "top-questions": `Các hội thoại đại diện của “${cluster.name}” đang hiển thị ở Inspector. Cụm có ${cluster.question_count} lượt hỏi–đáp. ${cluster.summary}`,
        quiz: `Đề xuất: dùng các câu hỏi đại diện trong cụm “${cluster.name}” để soạn 3 câu kiểm tra đầu buổi; giảng viên cần duyệt lại vì hiện chưa có slide chuẩn để đối chứng.`,
        summary: clustersData.slice(0, 3).map((item, index) => `${index + 1}. ${item.name}: ${item.percentage}%`).join("\n"),
      };
      appendAdminMessage("user", chip.textContent.trim());
      appendAdminMessage("ai", answers[type] || cluster.summary);
    });
  });
  btnSendChat.addEventListener("click", sendAdminMessage);
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendAdminMessage();
  });
}

function sendAdminMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  const cluster = clustersData.find((item) => item.id === selectedClusterId);
  appendAdminMessage("user", text);
  chatInput.value = "";
  appendAdminMessage(
    "ai",
    cluster
      ? `Dựa trên cụm đang chọn: ${cluster.ai_recommendation}`
      : "Hãy chọn một cụm chủ đề để xem phân tích có căn cứ."
  );
}

function appendAdminMessage(sender, text) {
  const item = document.createElement("div");
  item.className = `chat-msg ${sender}-msg`;
  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.innerHTML = `<i class="${sender === "ai" ? "ri-robot-line" : "ri-user-line"}"></i>`;
  const content = document.createElement("div");
  content.className = "msg-content";
  content.textContent = text;
  item.append(avatar, content);
  chatMessages.appendChild(item);
  chatMessages.scrollTop = chatMessages.scrollHeight;
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
  document.querySelectorAll("[data-scope]").forEach((button) => {
    button.classList.toggle("active", button.dataset.scope === currentScope);
  });
  setupViewSwitcher();
  setupFiltersAndActions();
  setupUpload();
  setupChatbot();
  await loadClusters();
}

document.addEventListener("DOMContentLoaded", initDashboard);
