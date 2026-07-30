/**
 * VLearn Class Knowledge Gap Map - Interactive Prototype Application (CP2)
 * Handles Heatmap rendering, Topic Donut Chart, Cluster Inspector, Evidence Chatlog Stream,
 * Time filtering, AI Re-clustering Simulation, AI Teacher Copilot Chatbot, and Theme Switcher (Dark/Light mode).
 */

// Mock Clusters Data (Matching Spec & Data Evidence)
const clustersData = [
  {
    id: "cluster-1",
    name: "Bất đồng bộ API Key & Environment Setup",
    studentCount: 342,
    percentage: 34.2,
    severity: "CRITICAL",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.35)",
    aiRecommendation: "⚠️ **CẢNH BÁO LẬP BÀI GIẢNG:** Dành 30 phút đầu buổi Live tới demo Live Fix lỗi dotenv & async API Key handling trước khi chuyển sang Prompt Chaining. Có 342/1,000 học viên đang kẹt rào cản này!",
    chatlogs: [
      { user: "Học viên #842", time: "10 phút trước", text: "Thầy ơi em pass API Key vào `.env` rồi mà lúc gọi <span class='highlight-key'>async await</span> toàn báo <span class='highlight-key'>401 Unauthorized</span> là sao ạ?" },
      { user: "Học viên #119", time: "25 phút trước", text: "Sao em chạy local thì được mà up lên VLearn server thì <span class='highlight-key'>API Key bị undefined</span> ạ?" },
      { user: "Học viên #531", time: "42 phút trước", text: "Cho em hỏi <span class='highlight-key'>async function</span> trong JS xử lý API Key header khác gì sync function ạ?" },
      { user: "Học viên #904", time: "1 giờ trước", text: "Em bị leak API key trên github commit, giờ reset key xong code python async bị timeout?" },
      { user: "Học viên #208", time: "2 giờ trước", text: "TA hỗ trợ em với, em sửa API Key theo slide mà vẫn lỗi connection closed?" }
    ]
  },
  {
    id: "cluster-2",
    name: "Vector DB Indexing & Memory Leak",
    studentCount: 254,
    percentage: 25.4,
    severity: "HIGH",
    color: "#f97316",
    glow: "rgba(249, 115, 22, 0.3)",
    aiRecommendation: "💡 **Đề xuất Giáo án:** Hướng dẫn kỹ thuật Batching Chunk Size (512 tokens) & giải phóng Memory khi Ingest dataset > 10.000 dòng trên ChromaDB/FAISS.",
    chatlogs: [
      { user: "Học viên #312", time: "30 phút trước", text: "Cụm Vector DB bị tràn RAM khi ingest 100k chunk thì dùng FAISS hay Chroma tốt hơn ạ?" },
      { user: "Học viên #671", time: "1 giờ trước", text: "Code python chunking văn bản lớn chạy được 50% là bị memory leak out of RAM ạ?" },
      { user: "Học viên #445", time: "2 giờ trước", text: "Em lưu embedding vector vào FAISS index mà search similarity trả về kết quả rất chậm?" }
    ]
  },
  {
    id: "cluster-3",
    name: "Prompt Chaining & LCEL Context Loss",
    studentCount: 120,
    percentage: 12.0,
    severity: "MEDIUM",
    color: "#eab308",
    glow: "rgba(234, 179, 8, 0.25)",
    aiRecommendation: "📘 **Nội dung bổ trợ:** Nhắc lại cú pháp RunnablePassthrough() trong LangChain Expression Language (LCEL) ở 10 phút cuối buổi.",
    chatlogs: [
      { user: "Học viên #099", time: "15 phút trước", text: "Prompt Chaining bị mất context khi truyền output step 1 sang step 2 qua RunnablePassthrough?" },
      { user: "Học viên #721", time: "3 giờ trước", text: "Cho em hỏi làm sao debug được variables truyền qua các node trong RunnableMap ạ?" }
    ]
  },
  {
    id: "cluster-4",
    name: "Eval Golden Set & Quality Bar Setup",
    studentCount: 85,
    percentage: 8.5,
    severity: "LOW",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.2)",
    aiRecommendation: "✅ **Trạng thái ổn:** Cụm bài tập này học viên nắm khá tốt. Chỉ cần gửi bài đọc tham khảo trong tài liệu khoá học.",
    chatlogs: [
      { user: "Học viên #150", time: "45 phút trước", text: "Tạo golden set 20 case thì nên chia tỷ lệ case khó và case thường như thế nào ạ?" },
      { user: "Học viên #811", time: "4 giờ trước", text: "Quality bar tính bằng phần trăm % exact match hay semantic match ạ?" }
    ]
  },
  {
    id: "cluster-5",
    name: "Khác / Out of Scope Chatlogs",
    studentCount: 99,
    percentage: 9.9,
    severity: "LOW",
    color: "#4b5563",
    glow: "rgba(75, 85, 99, 0.2)",
    aiRecommendation: "ℹ️ **Lọc nhiễu:** Các câu hỏi không thuộc nội dung môn học (hỏi về tài khoản, lịch học, câu hỏi ngoài lề). TA có thể chuyển sang bộ phận Ops.",
    chatlogs: [
      { user: "Học viên #005", time: "10 phút trước", text: "Cho em hỏi đóng tiền học phí đợt 2 ở đâu ạ?" },
      { user: "Học viên #012", time: "1 giờ trước", text: "Hôm nay lớp học online trên Zoom hay Discord vậy mọi người?" }
    ]
  }
];

// State
let selectedClusterId = "cluster-1";
let currentViewMode = "grid"; // 'grid' or 'chart'

// DOM Elements
const heatmapGrid = document.getElementById("heatmap-grid");
const topicChartView = document.getElementById("topic-chart-view");
const chartBarsList = document.getElementById("chart-bars-list");
const btnModeGrid = document.getElementById("btn-mode-grid");
const btnModeChart = document.getElementById("btn-mode-chart");

const inspectorPanel = document.getElementById("inspector-panel");
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

// Chatbot Elements
const btnOpenChat = document.getElementById("btn-open-chat");
const btnCloseChat = document.getElementById("btn-close-chat");
const chatDrawer = document.getElementById("chat-drawer");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const btnSendChat = document.getElementById("btn-send-chat");

// Theme Toggle Elements
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");

// Initialize Dashboard
function initDashboard() {
  initTheme();
  renderHeatmap();
  renderTopicDonutChart();
  selectCluster(selectedClusterId);
  setupEventListeners();
  setupViewModeSwitcher();
  setupChatbot();
}

// Theme Switcher Logic (Dark / Light Mode)
function initTheme() {
  const savedTheme = localStorage.getItem("vlearn-theme") || "dark";
  applyTheme(savedTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("vlearn-theme", newTheme);
      showToast(`Đã chuyển sang chế độ: ${newTheme === "light" ? "Sáng (Light Mode)" : "Tối (Dark Mode)"}`);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeIcon && themeText) {
    if (theme === "light") {
      themeIcon.className = "ri-moon-line";
      themeText.textContent = "Dark Mode";
    } else {
      themeIcon.className = "ri-sun-line";
      themeText.textContent = "Light Mode";
    }
  }
}

// View Mode Switcher (Grid vs Donut Chart)
function setupViewModeSwitcher() {
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

// Render Heatmap Grid
function renderHeatmap() {
  heatmapGrid.innerHTML = "";

  clustersData.forEach(cluster => {
    const block = document.createElement("div");
    block.className = `heatmap-block ${cluster.id === selectedClusterId ? 'active-block' : ''}`;
    block.style.setProperty('--block-color', cluster.color);
    block.style.setProperty('--block-glow', cluster.glow);

    block.innerHTML = `
      <div class="block-header">
        <h3 class="block-name">${cluster.name}</h3>
        <span class="block-count">${cluster.studentCount} HV</span>
      </div>
      <div class="block-metrics">
        <div style="width: 100%;">
          <div class="block-footer-txt">
            <span>Mức độ nghẽn: <strong>${cluster.percentage}%</strong></span>
            <span>${cluster.severity}</span>
          </div>
          <div class="pct-bar-bg">
            <div class="pct-bar-fill" style="width: ${cluster.percentage}%;"></div>
          </div>
        </div>
      </div>
    `;

    block.addEventListener("click", () => selectCluster(cluster.id));
    heatmapGrid.appendChild(block);
  });
}

// Render Circular / Donut Chart (Biểu Đồ Tròn Phân Bổ Chủ Đề)
function renderTopicDonutChart() {
  chartBarsList.innerHTML = "";

  // Build Conic Gradient string for Donut Chart
  let cumulativePct = 0;
  const gradientStops = clustersData.map(c => {
    const start = cumulativePct;
    cumulativePct += c.percentage;
    return `${c.color} ${start}% ${cumulativePct}%`;
  }).join(", ");

  const donutContainer = document.createElement("div");
  donutContainer.className = "donut-chart-layout";

  donutContainer.innerHTML = `
    <!-- Donut Circle Visual -->
    <div class="donut-visual-box">
      <div class="donut-circle" style="background: conic-gradient(${gradientStops});">
        <div class="donut-hole">
          <span class="donut-center-val">1,542</span>
          <span class="donut-center-lbl">Chatlog Tín Hiệu</span>
        </div>
      </div>
    </div>

    <!-- Donut Legend Side List -->
    <div class="donut-legend-list">
      ${clustersData.map(cluster => `
        <div class="donut-legend-item ${cluster.id === selectedClusterId ? 'active-legend' : ''}" data-id="${cluster.id}">
          <div class="legend-dot" style="background-color: ${cluster.color}; shadow: 0 0 8px ${cluster.glow};"></div>
          <div class="legend-info">
            <span class="legend-title">${cluster.name}</span>
            <span class="legend-sub">${cluster.studentCount} câu hỏi · <strong>${cluster.percentage}%</strong></span>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  chartBarsList.appendChild(donutContainer);

  // Bind click events on Legend items
  const legendItems = donutContainer.querySelectorAll(".donut-legend-item");
  legendItems.forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-id");
      selectCluster(id);
    });
  });
}

// Select & Inspect Cluster
function selectCluster(clusterId) {
  selectedClusterId = clusterId;
  const cluster = clustersData.find(c => c.id === clusterId);
  if (!cluster) return;

  // Highlight active block in Grid
  const blocks = document.querySelectorAll(".heatmap-block");
  blocks.forEach((block, idx) => {
    if (clustersData[idx].id === clusterId) {
      block.classList.add("active-block");
    } else {
      block.classList.remove("active-block");
    }
  });

  // Highlight active item in Donut Legend
  const legendItems = document.querySelectorAll(".donut-legend-item");
  legendItems.forEach(item => {
    if (item.getAttribute("data-id") === clusterId) {
      item.classList.add("active-legend");
    } else {
      item.classList.remove("active-legend");
    }
  });

  // Update Inspector Details
  clusterSeverity.textContent = cluster.severity;
  clusterSeverity.className = `severity-badge ${cluster.severity}`;
  clusterTitle.textContent = cluster.name;
  clusterStats.textContent = `${cluster.studentCount} Học viên kẹt · ${cluster.percentage}% Tổng câu hỏi`;

  // Update AI Recommendation
  recBody.innerHTML = cluster.aiRecommendation;

  // Update Chatlogs
  chatlogCount.textContent = cluster.chatlogs.length;
  chatlogList.innerHTML = "";

  cluster.chatlogs.forEach(log => {
    const chatItem = document.createElement("div");
    chatItem.className = "chatlog-item";
    chatItem.innerHTML = `
      <div class="chat-meta">
        <span class="chat-user">${log.user}</span>
        <span class="chat-time">${log.time}</span>
      </div>
      <p class="chat-text">${log.text}</p>
    `;
    chatlogList.appendChild(chatItem);
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Time Filters
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      showToast(`Đã tải lại bản đồ tín hiệu cho thời gian: ${e.target.textContent}`);
    });
  });

  // AI Re-cluster Simulation
  btnRecluster.addEventListener("click", () => {
    btnRecluster.disabled = true;
    btnRecluster.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> AI Vectorizing...`;

    setTimeout(() => {
      btnRecluster.disabled = false;
      btnRecluster.innerHTML = `<i class="ri-refresh-line"></i> AI Re-Cluster`;
      showToast("✨ AI Re-clustering thành công! Đã quét 1,542 chatlogs.");
    }, 1200);
  });

  // Add to Slide Action
  btnAddSlide.addEventListener("click", () => {
    const cluster = clustersData.find(c => c.id === selectedClusterId);
    showToast(`📌 Đã thêm cụm "${cluster.name}" vào chương trình Live Stream!`);
  });

  // Edit Cluster Title Action (Human-in-the-loop PAIR principle)
  btnEditTitle.addEventListener("click", () => {
    const cluster = clustersData.find(c => c.id === selectedClusterId);
    const newTitle = prompt("Sửa tên cụm rào cản kiến thức (Human Override):", cluster.name);
    if (newTitle && newTitle.trim() !== "") {
      cluster.name = newTitle.trim();
      renderHeatmap();
      renderTopicDonutChart();
      selectCluster(cluster.id);
      showToast("✏️ Đã cập nhật tên cụm kiến thức mới!");
    }
  });
}

// ==========================================================================
// AI Teacher Assistant Chatbot Logic
// ==========================================================================
function setupChatbot() {
  btnOpenChat.addEventListener("click", () => {
    chatDrawer.classList.toggle("active");
  });

  btnCloseChat.addEventListener("click", () => {
    chatDrawer.classList.remove("active");
  });

  // Quick Prompt Chips Handler
  const promptChips = document.querySelectorAll(".prompt-chip");
  promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const type = chip.getAttribute("data-prompt");
      handleQuickPrompt(type);
    });
  });

  // Send Message
  btnSendChat.addEventListener("click", sendUserMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendUserMessage();
  });
}

function sendUserMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  chatInput.value = "";

  setTimeout(() => {
    generateAIResponse(text);
  }, 600);
}

function handleQuickPrompt(type) {
  const currentCluster = clustersData.find(c => c.id === selectedClusterId);

  if (type === "miss") {
    const question = "Bài giảng vừa rồi của tôi đã bị miss phần kiến thức nào?";
    appendMessage("user", question);
    setTimeout(() => {
      const response = `🎯 **Phân tích lệch pha bài giảng:**
Buổi vừa rồi bạn đã giảng **Prompt Chaining** (chỉ có **8.5%** học viên thắc mắc), nhưng bài giảng đã hoàn toàn **MISS** phần **"${currentCluster.name}"** — nơi đang có **${currentCluster.studentCount} học viên (${currentCluster.percentage}%)** bị kẹt!

⚠️ **Khái niệm cụ thể bị trôi:**
1. Kỹ thuật đưa API Key vào file \`.env\` và xử lý Async Call trong Node.js/Python.
2. Sửa lỗi \`401 Unauthorized\` khi header chưa kịp load Key trước khi fetch API.`;
      appendMessage("ai", response);
    }, 600);
  } 
  else if (type === "top-questions") {
    const question = `Ở cụm "${currentCluster.name}", câu hỏi nào được hỏi nhiều nhất?`;
    appendMessage("user", question);
    setTimeout(() => {
      const response = `💬 **Top 3 dạng câu hỏi xuất hiện nhiều nhất (${currentCluster.studentCount} lượt hỏi):**
1. *"Pass API Key vào .env rồi nhưng async await toàn báo 401 Unauthorized?"* (**142 lượt**)
2. *"Sao chạy local thì pass key được mà deploy server lại bị undefined?"* (**98 lượt**)
3. *"Khác biệt giữa async header injection vs sync header injection?"* (**64 lượt**)`;
      appendMessage("ai", response);
    }, 600);
  }
  else if (type === "quiz") {
    const question = "Gợi ý 3 câu hỏi Quiz ôn tập ngắn cho buổi Live tiếp theo?";
    appendMessage("user", question);
    setTimeout(() => {
      const response = `📝 **3 Câu hỏi Quiz Live-checking (Dành 5' đầu buổi):**
1. **Câu 1:** Vì sao biến môi trường chứa API Key bị \`undefined\` khi gọi trong hàm \`async\` chưa được \`await dotenv.config()\`?
2. **Câu 2:** Lỗi HTTP Code nào trả về khi API Key truyền đúng cú pháp nhưng bị trễ bất đồng bộ? *(A. 404, B. 401, C. 500)*
3. **Câu 3:** Viết 3 dòng code mẫu để inject API Key an toàn vào Header của Fetch API.`;
      appendMessage("ai", response);
    }, 600);
  }
  else if (type === "summary") {
    const question = "Tóm tắt điểm nghẽn lớn nhất của toàn lớp tuần này?";
    appendMessage("user", question);
    setTimeout(() => {
      const response = `📊 **Tóm tắt 3 Điểm nghẽn lớn nhất khóa K3 (1,542 chatlogs):**
🔴 **Top 1 (34.2%):** Bất đồng bộ API Key & Environment (342 học viên)
🟠 **Top 2 (25.4%):** Vector DB Indexing & Memory Leak khi chunking (254 học viên)
🟡 **Top 3 (12.0%):** Context loss trong Prompt Chaining LCEL (120 học viên)

👉 *Khuyến nghị:* Dành 45 phút buổi Live tới cho Top 1 & Top 2 để tránh tỷ lệ rớt bài tập lớn!`;
      appendMessage("ai", response);
    }, 600);
  }
}

function generateAIResponse(userText) {
  const currentCluster = clustersData.find(c => c.id === selectedClusterId);
  let response = "";

  const lower = userText.toLowerCase();
  if (lower.includes("miss") || lower.includes("thiếu") || lower.includes("bỏ qua")) {
    response = `🎯 **Phân tích độ hổng bài giảng:**
Bài giảng vừa qua của bạn chưa bao phủ rào cản **${currentCluster.name}**. 
AI ghi nhận **${currentCluster.studentCount} câu hỏi** kẹt ở thực hành triển khai. Bạn nên dành 15-20 phút đầu buổi Live tới để live-coding chủ đề này!`;
  } else if (lower.includes("câu hỏi") || lower.includes("hỏi nhiều")) {
    response = `💬 **Dạng câu hỏi nổi bật tại cụm "${currentCluster.name}":**
Đa số học viên hỏi về cách debug lỗi thực hành:
- *"Lỗi 401 Unauthorized khi gọi async function"*
- *"Sửa API key trong .env nhưng server không nhận"*`;
  } else {
    response = `🤖 **AI Copilot:** Tôi đã ghi nhận thắc mắc của bạn về cụm **"${currentCluster.name}"** (${currentCluster.studentCount} học viên kẹt). 
Tôi khuyến nghị bạn bấm nút **"Đưa vào Slide Live"** để AI tự động chèn 1 Slide củng cố kiến thức này vào giáo án buổi tới!`;
  }

  appendMessage("ai", response);
}

function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${sender}-msg`;

  const icon = sender === "ai" ? "ri-robot-line" : "ri-user-line";
  const formattedText = text.replace(/\n/g, "<br>");

  msgDiv.innerHTML = `
    <div class="msg-avatar"><i class="${icon}"></i></div>
    <div class="msg-content">${formattedText}</div>
  `;

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Toast Helper
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Run app
document.addEventListener("DOMContentLoaded", initDashboard);
