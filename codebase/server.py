import http.server
import socketserver
import os
import json
import sys
import time
import uuid
import logging
from pathlib import Path
from functools import partial

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODEBASE_DIR = os.path.join(WORKSPACE_DIR, "codebase")

if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

import db
import tutor
import clustering

PORT = 8000
LOGS_DIR = os.path.join(WORKSPACE_DIR, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOGS_DIR, "vlearn-runtime.log")

# Setup runtime logger
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ReqID: %(request_id)s] %(message)s"
)
logger = logging.getLogger("vlearn-runtime")


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


class VLearnStarletteServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        kwargs["directory"] = CODEBASE_DIR
        super().__init__(*args, **kwargs)

    def log_runtime(self, msg: str, req_id: str = None, level: str = "info"):
        req_id = req_id or str(uuid.uuid4())[:8]
        extra = {"request_id": req_id}
        if level == "error":
            logger.error(msg, extra=extra)
        else:
            logger.info(msg, extra=extra)

    def do_GET(self):
        start_time = time.time()
        req_id = str(uuid.uuid4())[:8]
        url_path = self.path.split('?')[0]

        self.log_runtime(f"GET {url_path}", req_id=req_id)

        if url_path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "service": "VLearn Tutor & Topic Interest Map Server",
                "timing_ms": round((time.time() - start_time) * 1000, 2)
            }, ensure_ascii=False).encode('utf-8'))
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
                "has_voyage_key": bool(os.getenv("VOYAGE_API_KEY")),
                "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                "base_url": os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            }
            self.wfile.write(json.dumps(cfg_data, ensure_ascii=False).encode('utf-8'))
            return

        if url_path == '/api/clusters':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM clusters ORDER BY is_out_of_scope ASC, percentage DESC")
            rows = cursor.fetchall()
            conn.close()
            clusters = []
            for r in rows:
                c_dict = dict(r)
                c_dict["evidence"] = json.loads(c_dict.get("evidence_json", "[]"))
                clusters.append(c_dict)
            self.wfile.write(json.dumps({"status": "success", "clusters": clusters}, ensure_ascii=False).encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        start_time = time.time()
        req_id = str(uuid.uuid4())[:8]
        url_path = self.path.split('?')[0]

        self.log_runtime(f"POST {url_path}", req_id=req_id)

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        req_json = json.loads(body) if body else {}

        if url_path in ['/api/tutor', '/api/agent', '/api/chat']:
            try:
                user_id = req_json.get("user_id", "anon_user")
                day_code = req_json.get("day_code", "Day1")
                page = int(req_json.get("page", 1))
                selected_text = req_json.get("selected_text", "")
                question = req_json.get("prompt") or req_json.get("query") or req_json.get("question") or ""

                res = tutor.ask_tutor(user_id, day_code, page, selected_text, question)
                res["timing_ms"] = round((time.time() - start_time) * 1000, 2)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.log_runtime(f"Error in /api/tutor: {e}", req_id=req_id, level="error")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif url_path in ['/api/recluster', '/api/scan']:
            try:
                res = clustering.perform_clustering()
                res["timing_ms"] = round((time.time() - start_time) * 1000, 2)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.log_runtime(f"Error in /api/recluster: {e}", req_id=req_id, level="error")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif url_path == '/api/clusters/rename':
            try:
                cluster_id = req_json.get("cluster_id")
                new_label = req_json.get("new_label")
                if cluster_id and new_label:
                    conn = db.get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute("UPDATE clusters SET label = ? WHERE id = ?", (new_label, cluster_id))
                    conn.commit()
                    conn.close()
                    res = {"status": "success", "message": f"Renamed cluster {cluster_id} to '{new_label}'"}
                else:
                    res = {"status": "error", "message": "Missing cluster_id or new_label"}

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
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
    db.init_db()
    clustering.start_background_clustering(20)

    os.chdir(CODEBASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    handler = VLearnStarletteServerHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving VLearn Tutor & Topic Interest Map Server at http://127.0.0.1:{PORT}")
        print(f"Admin Dashboard available at http://127.0.0.1:{PORT}/admin")
        print(f"Health Check available at http://127.0.0.1:{PORT}/api/health")
        httpd.serve_forever()
