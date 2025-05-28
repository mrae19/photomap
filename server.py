#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs
import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SCOPES

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
        if self.path == '/api/images':
            self.handle_image_list()
        elif self.path.startswith('/oauth2callback'):
            self.handle_oauth_callback()
        elif self.path == '/auth/google':
            self.handle_google_auth()
        else:
            super().do_GET()

    def handle_image_list(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Check if we have Google Photos credentials
        if os.path.exists('token.json'):
            try:
                with open('token.json', 'r') as token:
                    credentials = google.oauth2.credentials.Credentials.from_authorized_user_info(
                        json.load(token), SCOPES)
                
                service = build('photoslibrary', 'v1', credentials=credentials)
                results = service.mediaItems().list(pageSize=100).execute()
                items = results.get('mediaItems', [])
                
                # Filter for images with location data
                photos_with_location = []
                for item in items:
                    if 'mediaMetadata' in item and 'location' in item['mediaMetadata']:
                        photos_with_location.append({
                            'id': item['id'],
                            'baseUrl': item['baseUrl'],
                            'filename': item['filename'],
                            'location': item['mediaMetadata']['location']
                        })
                
                self.wfile.write(json.dumps({'files': photos_with_location}).encode())
                return
            except Exception as e:
                print(f"Error accessing Google Photos: {e}")
        
        # Fallback to local images if Google Photos fails or isn't authenticated
        image_dir = 'mapimages'
        if os.path.exists(image_dir):
            files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))]
            self.wfile.write(json.dumps({'files': files}).encode())
        else:
            self.wfile.write(json.dumps({'files': []}).encode())

    def handle_google_auth(self):
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI]
                }
            },
            scopes=SCOPES
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        self.send_response(302)
        self.send_header('Location', authorization_url)
        self.end_headers()

    def handle_oauth_callback(self):
        query_components = parse_qs(urlparse(self.path).query)
        code = query_components.get('code', [None])[0]
        
        if code:
            flow = google_auth_oauthlib.flow.Flow.from_client_config(
                {
                    "web": {
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [GOOGLE_REDIRECT_URI]
                    }
                },
                scopes=SCOPES
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Save credentials
            with open('token.json', 'w') as token:
                token.write(credentials.to_json())
            
            # Redirect back to the main page
            self.send_response(302)
            self.send_header('Location', '/')
            self.end_headers()
        else:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Authentication failed')

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Image discovery API available at http://localhost:8000/api/images")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever() 