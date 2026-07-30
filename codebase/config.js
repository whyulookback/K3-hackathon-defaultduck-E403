/**
 * VLearn AI GapMap - Configuration File
 * ⚠️ BẢO MẬT: API Key được quản lý an toàn trong file .env (không commit GitHub).
 */

const CONFIG = {
  // OPENROUTER_API_KEY được nạp an toàn từ file .env hoặc nhập từ UI khi demo
  OPENROUTER_API_KEY: "",
  
  // Base URL của OpenRouter API
  OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
  
  // Model OpenRouter mặc định (openai/gpt-4o-mini)
  OPENROUTER_MODEL: "openai/gpt-4o-mini",

  // Bật/tắt log debug
  DEBUG: true
};
