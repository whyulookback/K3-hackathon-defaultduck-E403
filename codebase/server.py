import http.server
import socketserver
import os
import json
import sys

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
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=CODEBASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            cfg_data = {
                "has_key": bool(os.getenv("OPENROUTER_API_KEY")),
                "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                "base_url": os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            }
            self.wfile.write(json.dumps(cfg_data, ensure_ascii=False).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path in ['/api/recluster', '/api/scan']:
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
        else:
            self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    os.chdir(WORKSPACE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RealAIGapMapHandler) as httpd:
        print(f"Serving REAL AI GapMap Server with Live Re-Clustering Backend at http://localhost:{PORT}")
        httpd.serve_forever()
