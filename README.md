# Rebelle Rally Photo Map

A simple web application that displays photos with GPS metadata on a Mapbox satellite map.

## Features

- **Interactive Map**: Satellite view powered by Mapbox
- **Photo Markers**: Circular markers showing photo thumbnails on the map
- **Photo Details**: Click markers to view full-size photos with EXIF metadata
- **Location Search**: Search for locations using the search bar
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
   - Load all JPEG images from the mapimages folder
   - Extract GPS coordinates from EXIF data
   - Display photo markers on the map
   - Fit the map view to show all photos

## How It Works

### Photo Processing
- The app scans for JPEG files in the mapimages directory
- Extracts GPS coordinates from EXIF metadata using the `exif-js` library
- Converts DMS (degrees, minutes, seconds) coordinates to decimal format
- Creates interactive markers with photo thumbnails

### Map Features
- **Satellite View**: Uses Mapbox satellite imagery for terrain context
- **Photo Markers**: Circular markers with photo thumbnails
- **Click to View**: Click any marker to see the full photo and metadata
- **Search**: Use the search bar to find and navigate to specific locations
- **Navigation**: Zoom and pan controls included

### Supported Image Formats
- JPEG files with GPS EXIF data
- Currently includes: `IMG_1198.jpeg`, `IMG_1175.jpeg`, `BNS_20250524_203313_290.jpeg`, `IMG_0572-2.jpg`

## Technical Details

### Technologies Used
- **Mapbox GL JS**: Interactive maps and geocoding
- **EXIF.js**: EXIF metadata extraction
- **Vanilla JavaScript**: No framework dependencies
- **Python HTTP Server**: Local development server with CORS support

### File Structure
```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── server.py           # Python development server
├── README.md           # This file
└── mapimages/          # Photo directory
    ├── IMG_1198.jpeg       # Photo file 1
    ├── IMG_1175.jpeg       # Photo file 2
    ├── BNS_20250524_203313_290.jpeg  # Photo file 3
    └── IMG_0572-2.jpg      # Photo file 4
```

## Adding More Photos

To add more photos to the map:

1. Place JPEG files with GPS EXIF data in the `mapimages` folder
2. Update the `imageFiles` array in `script.js`:
   ```javascript
   const imageFiles = [
       'mapimages/IMG_1198.jpeg', 
       'mapimages/IMG_1175.jpeg', 
       'mapimages/BNS_20250524_203313_290.jpeg',
       'mapimages/IMG_0572-2.jpg',
       'mapimages/your_new_photo.jpeg'
   ];
   ```
3. Restart the server

## Troubleshooting

- **No photos appearing**: Check that your JPEG files contain GPS EXIF data
- **Server errors**: Ensure Python 3 is installed and the port 8000 is available
- **Map not loading**: Verify internet connection for Mapbox tiles and API access

## License

This project uses the Mapbox API key provided in the request. For production use, please obtain your own Mapbox API key. 