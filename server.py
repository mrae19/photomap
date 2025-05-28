#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/images'):
            self.handle_image_list()
        else:
            super().do_GET()

    def handle_image_list(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Handle local images
        image_dir = 'mapimages'
        query = urlparse(self.path).query
        params = parse_qs(query)
        day = params.get('day', [None])[0]
        files = []

        if day:
            # Handle day-specific requests
            day_dir = os.path.join(image_dir, day)
            if os.path.exists(day_dir):
                for f in os.listdir(day_dir):
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                        files.append(f"{day}/{f}")
        else:
            # List all images in mapimages and subfolders
            for root, dirs, filenames in os.walk(image_dir):
                for f in filenames:
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                        rel_dir = os.path.relpath(root, image_dir)
                        if rel_dir == '.':
                            files.append(f)
                        else:
                            files.append(f"{rel_dir}/{f}")

        self.wfile.write(json.dumps({'files': files}).encode())

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Image discovery API available at http://localhost:8000/api/images")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever() 