import http.server
import socketserver
import os
import json
import sys
from functools import partial

PORT = 8000
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODEBASE_DIR = os.path.join(WORKSPACE_DIR, "codebase")

# Load .env variables into environment
def load_dotenv():
    env_file = os.path.join(WORKSPACE_DIR, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")

load_dotenv()

class RealAIGapMapHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        url_path = self.path.split('?')[0]
        if url_path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "VLearn Tutor & Topic Interest Map Server"}, ensure_ascii=False).encode('utf-8'))
            return

        if url_path in ['/admin', '/admin/']:
            self.path = '/index.html'

        if url_path == '/api/config':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            cfg_data = {
                "has_key": bool(os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")),
                "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                "base_url": os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            }
            self.wfile.write(json.dumps(cfg_data, ensure_ascii=False).encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        url_path = self.path.split('?')[0]
        if url_path in ['/api/recluster', '/api/scan']:
            try:
                if CODEBASE_DIR not in sys.path:
                    sys.path.insert(0, CODEBASE_DIR)
                import process_chatlog
                process_chatlog.process_vlearn_chatlogs()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                res_data = {
                    "status": "success",
                    "message": "Real AI Re-Clustering & Log Scanning completed! LogScannerTool updated dataset."
                }
                self.wfile.write(json.dumps(res_data, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                print("Error during real re-cluster:", e)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                res_data = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(res_data, ensure_ascii=False).encode('utf-8'))

        elif url_path in ['/api/agent', '/api/chat']:
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                req_json = json.loads(body) if body else {}

                user_prompt = req_json.get("prompt") or req_json.get("query") or ""
                
                api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")

                if api_key:
                    if WORKSPACE_DIR not in sys.path:
                        sys.path.insert(0, WORKSPACE_DIR)
                    from providers import make_provider
                    from tools import to_openai_tools
                    from chat import run_model_tool_loop

                    provider_name = "openrouter" if os.getenv("OPENROUTER_API_KEY") else "openai"
                    provider = make_provider(provider_name)
                    tools = to_openai_tools()

                    sys_msg = {
                        "role": "system",
                        "content": (
                            "Bạn là AI Teacher Copilot Agent sử dụng các Agent Tools để phân tích dữ liệu 1.261 chatlogs "
                            "và slide bài giảng VLearn. Bạn có thể sử dụng các công cụ slide_ocr_search_tool, metric_calculator_tool, "
                            "log_scanner_tool để tra cứu thông tin và trả lời trực tiếp cho người dùng."
                        )
                    }
                    user_msg = {"role": "user", "content": user_prompt}
                    loop_result = run_model_tool_loop(
                        provider=provider,
                        messages=[sys_msg, user_msg],
                        tools=tools,
                        model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                        max_tool_rounds=3
                    )
                    ai_text = loop_result.get("assistant_text", "Đã xử lý xong truy vấn.")
                    res_payload = {"status": "success", "response": ai_text, "details": loop_result}
                else:
                    if WORKSPACE_DIR not in sys.path:
                        sys.path.insert(0, WORKSPACE_DIR)
                    import agent
                    copilot_agent = agent.VLearnCopilotAgent(WORKSPACE_DIR)
                    res_payload = copilot_agent.run(user_prompt)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_payload, ensure_ascii=False).encode('utf-8'))

            except Exception as e:
                print("Error executing Agent Pipeline:", e)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    os.chdir(CODEBASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    handler = partial(RealAIGapMapHandler, directory=CODEBASE_DIR)
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving REAL AI GapMap Server with Live Re-Clustering Backend at http://localhost:{PORT}")
        httpd.serve_forever()
