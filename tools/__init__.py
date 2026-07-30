from __future__ import annotations

import os
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent.parent
CODEBASE_DIR = ROOT / "codebase"

def slide_ocr_search_tool(day_code: str, page_number: int = 1) -> dict[str, Any]:
    """Finds slide OCR details for given slide (day_code) and page number."""
    if str(CODEBASE_DIR) not in sys.path:
        sys.path.insert(0, str(CODEBASE_DIR))
    from process_chatlog import SlideOCRSearchTool
    ocr_path = CODEBASE_DIR / "slides_ocr_mock.json"
    tool = SlideOCRSearchTool(str(ocr_path))
    return tool.search_slide_section(day_code, page_number)


def log_scanner_tool(target_directory: str = "data/vlearn-pack/chatlog", query: str = None) -> dict[str, Any]:
    """Scans student chatlog datasets and searches student chat history for keywords."""
    if str(CODEBASE_DIR) not in sys.path:
        sys.path.insert(0, str(CODEBASE_DIR))
    from process_chatlog import LogScannerTool
    full_path = ROOT / target_directory
    tool = LogScannerTool(str(full_path))
    return tool.scan_for_logs(query=query)


def metric_calculator_tool(cluster_id: str = "cluster-1") -> dict[str, Any]:
    """Calculates knowledge gap metrics, severity, and student counts for given cluster."""
    data_path = CODEBASE_DIR / "processed_gap_data.json"
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            clusters = data.get("clusters", [])
            for c in clusters:
                if c.get("id") == cluster_id:
                    return c
            if clusters:
                return clusters[0]
    return {"error": "no_data"}


def recluster_logs_tool() -> dict[str, Any]:
    """Triggers real-time re-clustering of student chatlog dataset."""
    if str(CODEBASE_DIR) not in sys.path:
        sys.path.insert(0, str(CODEBASE_DIR))
    import process_chatlog
    process_chatlog.process_vlearn_chatlogs()
    return {"status": "success", "message": "Re-clustering completed."}


TOOL_FUNCTIONS = {
    "slide_ocr_search_tool": slide_ocr_search_tool,
    "log_scanner_tool": log_scanner_tool,
    "metric_calculator_tool": metric_calculator_tool,
    "recluster_logs_tool": recluster_logs_tool,
}

TOOL_DECLARATIONS = [
    {
        "type": "function",
        "function": {
            "name": "slide_ocr_search_tool",
            "description": "Searches slide OCR text, key concepts, and remediation actions by slide name (day_code) and page number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "day_code": {"type": "string", "description": "Slide name or day_code identifier"},
                    "page_number": {"type": "integer", "description": "Page number within slide"}
                },
                "required": ["day_code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "log_scanner_tool",
            "description": "Scans log directory and searches student chatlog history for specific keywords or topics (e.g., 'transformer', 'API key', 'vector').",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_directory": {"type": "string", "description": "Path to chatlog directory"},
                    "query": {"type": "string", "description": "Keyword or topic to search within student chatlog messages"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "metric_calculator_tool",
            "description": "Calculates knowledge gap severity, student counts, and percentages for a cluster.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cluster_id": {"type": "string", "description": "Cluster ID identifier"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recluster_logs_tool",
            "description": "Triggers re-clustering pipeline over student chatlogs.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]


def load_tool_declarations() -> list[dict[str, Any]]:
    return TOOL_DECLARATIONS


def to_openai_tools(declarations: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    return declarations or TOOL_DECLARATIONS
