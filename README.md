# Rebelle Rally Photo Map

A simple web application that displays photos with GPS metadata on a Mapbox satellite map.

## Features

- **Interactive Map**: Satellite view powered by Mapbox
- **Photo Markers**: Circular markers showing photo thumbnails on the map
- **Photo Details**: Click markers to view full-size photos with EXIF metadata
- **Location Search**: Search for locations using the search bar
- **Automatic Image Discovery**: Automatically finds and loads all images in the mapimages folder
- **Responsive Design**: Clean UI with a 60px black header

## Setup Instructions

### Prerequisites
- Python 3.x installed on your system
- Modern web browser with JavaScript enabled

### Running the Application

1. **Start the local server**:
   ```bash
   python3 server.py
   ```
   
   Or on Windows:
   ```bash
   python server.py
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

3. **View the map**: The application will automatically:
   - Discover all image files in the mapimages folder
   - Extract GPS coordinates from EXIF data
   - Display photo markers on the map
   - Fit the map view to show all photos

## Working with Lightroom Shared Albums

### Downloading Images from Lightroom Share Links

To use images from Adobe Lightroom shared albums (like https://adobe.ly/4heHL5Q):

1. **Open the share link** in a desktop browser (not mobile)
2. **Look for the three-dot menu (⋯)** in the upper right corner
3. **Click "Download Photos"** to download all images as a ZIP file
4. **Extract the images** to the `mapimages` folder in your project
5. **Refresh your browser** - the webapp will automatically discover and load the new images

> **Note**: Direct API access to Lightroom shared albums requires special Adobe partner credentials. The manual download approach above is the most practical solution for most users.

## How It Works

### Photo Processing
- The app automatically scans the mapimages directory for image files
- Extracts GPS coordinates from EXIF metadata using the `exif-js` library
- Converts DMS (degrees, minutes, seconds) coordinates to decimal format
- Creates interactive markers with photo thumbnails

### Automatic Image Discovery
- **Server API**: The Python server provides an `/api/images` endpoint that lists all image files
- **Fallback Method**: If the API is unavailable, it tries a list of known files
- **Supported Formats**: JPG, JPEG, PNG, TIFF, TIF, BMP, WEBP files
- **Console Logging**: Check browser console for discovery and loading progress

### Map Features
- **Satellite View**: Uses Mapbox satellite imagery for terrain context
- **Photo Markers**: Circular markers with photo thumbnails
- **Click to View**: Click any marker to see the full photo and metadata
- **Search**: Use the search bar to find and navigate to specific locations
- **Auto-fit**: Map automatically adjusts to show all photo locations
- **Navigation**: Zoom and pan controls included

## Technical Details

### Technologies Used
- **Mapbox GL JS**: Interactive maps and geocoding
- **EXIF.js**: EXIF metadata extraction
- **Vanilla JavaScript**: No framework dependencies
- **Python HTTP Server**: Local development server with CORS support and image discovery API

### File Structure
```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── server.py           # Python development server with API
├── README.md           # This file
├── assets/             # Logo and assets
│   └── Rebelle-Rally-logo.png
└── mapimages/          # Photo directory (auto-discovered)
    ├── IMG_1198.jpeg       # Photo file 1
    ├── IMG_1175.jpeg       # Photo file 2
    ├── BNS_20250524_203313_290.jpeg  # Photo file 3
    └── IMG_0572-2.jpg      # Photo file 4
```

### API Endpoints
- `GET /api/images` - Returns JSON list of all image files in mapimages directory
- `GET /mapimages/{filename}` - Serves individual image files
- `GET /` - Serves the main application

## Adding More Photos

### From Lightroom Shared Albums:
1. Download images from the Lightroom share link (see instructions above)
2. Extract to the `mapimages` folder
3. Refresh your browser - new images will be automatically discovered

### From Local Files:
1. Place JPEG files with GPS EXIF data in the `mapimages` folder
2. Restart the server (recommended) or refresh the browser
3. The webapp will automatically discover and display the new photos

### Manual Method (if needed):
If automatic discovery doesn't work, you can manually add files by updating the `knownFiles` array in `script.js`.

## Troubleshooting

- **No photos appearing**: Check that your JPEG files contain GPS EXIF data
- **Server errors**: Ensure Python 3 is installed and port 8000 is available
- **Map not loading**: Verify internet connection for Mapbox tiles and API access
- **Images not discovered**: Check browser console for error messages
- **API not working**: Visit `http://localhost:8000/api/images` to test the discovery endpoint

## Console Debugging

The webapp provides detailed console logging. Open browser Developer Tools (F12) to see:
- Image discovery progress
- GPS data extraction results
- Photo loading success/failure
- Error messages and troubleshooting info

## License

This project uses the Mapbox API key provided in the request. For production use, please obtain your own Mapbox API key. 