# Google Photos API Configuration
GOOGLE_CLIENT_ID = "496412987472-t87lo1an33pjp4mnoga6ht4nf7sdcfmr.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"
GOOGLE_REDIRECT_URI = "http:/mattrae.ca/photomap/oauth2callback"

# OAuth 2.0 scopes needed for Google Photos
SCOPES = [
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata'
] 