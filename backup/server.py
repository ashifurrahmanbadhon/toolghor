#!/usr/bin/env python3
"""
ToolGhor Secure Backend Server
- Serves static website files
- Provides secure ConvertAPI PDF -> DOCX proxy endpoint (/api/convert-pdf-to-docx)
- Keeps CONVERTAPI_TOKEN strictly server-side and never exposes it to frontend
"""

import os
import sys
import json
import base64
import tempfile
import mimetypes
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import email.policy
from email.parser import BytesParser

# Load environment variables from .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import requests

PORT = int(os.environ.get("PORT", 8000))
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB limit

def get_convertapi_token():
    token = os.environ.get("CONVERTAPI_TOKEN", "").strip()
    if not token or token == "your_token_here" or token == "your_convertapi_token_here":
        return None
    return token

class ToolGhorRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for API routes and local dev
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(HTTPStatus.NO_CONTENT)
            self.end_headers()
        else:
            super().do_OPTIONS()

    def do_GET(self):
        if self.path == "/api/status" or self.path == "/api/health":
            token = get_convertapi_token()
            res = {
                "status": "online",
                "convertapi_configured": bool(token),
                "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024)
            }
            body = json.dumps(res).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path.startswith("/api/yt-download"):
            self.handle_yt_download()
            return

        super().do_GET()

    def handle_yt_download(self):
        from urllib.parse import urlparse, parse_qs, quote
        import time
        query = parse_qs(urlparse(self.path).query)
        raw_url = query.get("url", [""])[0].strip()
        fmt = query.get("format", ["720"])[0].strip().lower()
        if not raw_url:
            self.send_json_error(HTTPStatus.BAD_REQUEST, "URL parameter is required.")
            return

        try:
            init_url = f"https://loader.to/ajax/download.php?button=1&start=1&end=1&format={fmt}&url={quote(raw_url)}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
            res = requests.get(init_url, headers=headers, timeout=10)
            if res.status_code != 200:
                self.send_json_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Upstream server returned error.")
                return
            rj = res.json()
            if not rj.get("success"):
                self.send_json_error(HTTPStatus.BAD_REQUEST, rj.get("text") or "Failed to start download stream.")
                return
            dl_url = rj.get("download_url") or rj.get("url")
            prog_url = rj.get("progress_url")
            title = rj.get("title") or "YouTube_Download"

            if not dl_url and prog_url:
                for _ in range(15):
                    time.sleep(1.5)
                    pr = requests.get(prog_url, headers=headers, timeout=10)
                    if pr.status_code == 200:
                        pj = pr.json()
                        if pj.get("download_url"):
                            dl_url = pj.get("download_url")
                            break

            if not dl_url:
                self.send_json_error(HTTPStatus.GATEWAY_TIMEOUT, "Download resolution timed out.")
                return

            body = json.dumps({"success": True, "download_url": dl_url, "title": title, "format": fmt}).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self.send_json_error(HTTPStatus.INTERNAL_SERVER_ERROR, "Unable to resolve YouTube download stream.")

    def do_POST(self):
        if self.path == "/api/convert-pdf-to-docx" or self.path.startswith("/api/convert-pdf-to-docx?"):
            self.handle_pdf_to_docx_conversion()
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Endpoint not found")

    def handle_pdf_to_docx_conversion(self):
        # Check content length
        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except (ValueError, TypeError):
            content_length = 0

        if content_length <= 0:
            self.send_json_error(HTTPStatus.BAD_REQUEST, "No file uploaded.")
            return

        if content_length > MAX_FILE_SIZE:
            self.send_json_error(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                "File size exceeds the allowed limit (50MB). Please try a smaller PDF."
            )
            return

        # Read multipart body
        try:
            raw_body = self.rfile.read(content_length)
        except Exception as e:
            print(f"[Upload Error] Failed to read request body: {e}", file=sys.stderr)
            self.send_json_error(
                HTTPStatus.BAD_REQUEST,
                "Your PDF could not be converted at the moment. Please try again with another PDF."
            )
            return

        # Parse multipart form data
        content_type_header = self.headers.get("Content-Type", "")
        if not content_type_header.startswith("multipart/form-data"):
            self.send_json_error(HTTPStatus.BAD_REQUEST, "Expected multipart/form-data.")
            return

        fake_email_bytes = f"Content-Type: {content_type_header}\r\n\r\n".encode("utf-8") + raw_body
        parsed_msg = BytesParser(policy=email.policy.default).parsebytes(fake_email_bytes)

        pdf_bytes = None
        orig_filename = "document.pdf"
        page_range = None

        for part in parsed_msg.iter_parts():
            name = part.get_param("name", header="content-disposition")
            if name in ("file", "File"):
                fname = part.get_filename()
                if fname:
                    orig_filename = fname
                pdf_bytes = part.get_payload(decode=True)
            elif name in ("page_range", "PageRange", "ranges"):
                val = part.get_payload(decode=True)
                if val:
                    page_range = val.decode("utf-8", errors="ignore").strip()

        if not pdf_bytes or len(pdf_bytes) == 0:
            self.send_json_error(HTTPStatus.BAD_REQUEST, "No PDF file found in request.")
            return

        # Validate PDF signature (%PDF-)
        if not (b"%PDF-" in pdf_bytes[:1024]):
            self.send_json_error(
                HTTPStatus.BAD_REQUEST,
                "The uploaded file is not a valid PDF or is corrupted. Please choose a valid PDF."
            )
            return

        token = get_convertapi_token()
        if not token:
            print("[ConvertAPI Error] CONVERTAPI_TOKEN is missing or not configured in .env", file=sys.stderr)
            self.send_json_error(
                HTTPStatus.BAD_REQUEST,
                "Your PDF could not be converted at the moment. Please try again with another PDF."
            )
            return

        # Prepare safe output filename (e.g. invoice.pdf -> invoice.docx)
        base_name = os.path.splitext(os.path.basename(orig_filename))[0]
        if not base_name:
            base_name = "document"
        out_filename = f"{base_name}.docx"

        # Temporary file handling with automatic cleanup
        temp_input = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
                temp_input = tf.name
                tf.write(pdf_bytes)

            # Call ConvertAPI securely with Bearer token authentication
            convertapi_url = "https://v2.convertapi.com/convert/pdf/to/docx"
            headers = {
                "Authorization": f"Bearer {token}"
            }
            form_data = {
                "StoreFile": "false"
            }
            if page_range:
                form_data["PageRange"] = page_range

            with open(temp_input, "rb") as f_up:
                files = {
                    "File": (orig_filename, f_up, "application/pdf")
                }
                print(f"[ConvertAPI] Sending '{orig_filename}' ({len(pdf_bytes)} bytes) to ConvertAPI...")
                response = requests.post(
                    convertapi_url,
                    headers=headers,
                    data=form_data,
                    files=files,
                    timeout=180
                )

            if response.status_code != 200:
                print(f"[ConvertAPI Error] Status {response.status_code}: {response.text}", file=sys.stderr)
                self.send_json_error(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    "Your PDF could not be converted at the moment. Please try again with another PDF."
                )
                return

            res_json = response.json()
            files_list = res_json.get("Files", [])
            if not files_list:
                print("[ConvertAPI Error] No Files array in ConvertAPI response", file=sys.stderr)
                self.send_json_error(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    "Your PDF could not be converted at the moment. Please try again with another PDF."
                )
                return

            first_file = files_list[0]
            docx_bytes = None

            # Retrieve DOCX data either from FileData (base64) or Url
            if first_file.get("FileData"):
                docx_bytes = base64.b64decode(first_file["FileData"])
            elif first_file.get("Url"):
                dl_res = requests.get(first_file["Url"], timeout=120)
                if dl_res.status_code == 200:
                    docx_bytes = dl_res.content

            if not docx_bytes or len(docx_bytes) == 0:
                print("[ConvertAPI Error] Converted DOCX is empty", file=sys.stderr)
                self.send_json_error(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    "Your PDF could not be converted at the moment. Please try again with another PDF."
                )
                return

            print(f"[ConvertAPI Success] Converted '{orig_filename}' -> '{out_filename}' ({len(docx_bytes)} bytes)")

            # Return DOCX file stream to user
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            self.send_header("Content-Disposition", f'attachment; filename="{out_filename}"')
            self.send_header("Content-Length", str(len(docx_bytes)))
            self.send_header("X-Converted-By", "ConvertAPI")
            self.end_headers()
            self.wfile.write(docx_bytes)

        except requests.exceptions.Timeout:
            print("[ConvertAPI Error] Request timed out", file=sys.stderr)
            self.send_json_error(
                HTTPStatus.GATEWAY_TIMEOUT,
                "Your PDF could not be converted at the moment. Please try again with another PDF."
            )
        except Exception as e:
            print(f"[Conversion Exception] {e}", file=sys.stderr)
            self.send_json_error(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                "Your PDF could not be converted at the moment. Please try again with another PDF."
            )
        finally:
            # Ensure temporary file is always deleted
            if temp_input and os.path.exists(temp_input):
                try:
                    os.remove(temp_input)
                except OSError:
                    pass

    def send_json_error(self, code, message):
        body = json.dumps({"error": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ("", PORT)
    httpd = ThreadingHTTPServer(server_address, ToolGhorRequestHandler)
    token = get_convertapi_token()
    token_status = "Configured (Ready)" if token else "Not configured in .env (add CONVERTAPI_TOKEN to .env)"
    print("=" * 60)
    print(f"ToolGhor Server running at http://localhost:{PORT}")
    print(f"ConvertAPI Status: {token_status}")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == "__main__":
    run()
