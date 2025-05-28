// Mapbox configuration
mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dHJhZSIsImEiOiJja2RpMXIxdW4wMG52MnFzMjUwcTMxOGRuIn0.ZhVoB4RBydLec16F5MIabg';

let map;
let photos = [];
let markers = [];
let currentPhoto = null;
let heatmapLayer = null;
const CLUSTER_RADIUS = 1; // 1km radius for clustering
const MIN_CLUSTER_COUNT = 5; // Minimum photos to show heatmap
const HEATMAP_ZOOM_THRESHOLD = 8; // Show heatmap when zoomed out more than level 8

// Initialize map
function initMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-115.1398, 36.1699], // Default to Las Vegas area (common for rally events)
        zoom: 10
    });

    map.on('load', () => {
        loadPhotos();
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());

    // Add zoom level change listener
    map.on('zoomend', updateHeatmap);
}

// Convert DMS (degrees, minutes, seconds) to decimal degrees
function dmsToDecimal(degrees, minutes, seconds, direction) {
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
        decimal = decimal * -1;
    }
    return decimal;
}

// Extract GPS coordinates from EXIF data
function getGPSFromExif(exifData) {
    if (!exifData.GPSLatitude || !exifData.GPSLongitude) {
        return null;
    }

    const lat = dmsToDecimal(
        exifData.GPSLatitude[0],
        exifData.GPSLatitude[1],
        exifData.GPSLatitude[2],
        exifData.GPSLatitudeRef
    );

    const lng = dmsToDecimal(
        exifData.GPSLongitude[0],
        exifData.GPSLongitude[1],
        exifData.GPSLongitude[2],
        exifData.GPSLongitudeRef
    );

    return { lat, lng };
}

// Process individual photo
function processPhoto(file) {
    return new Promise((resolve) => {
        EXIF.getData(file, function() {
            const exifData = EXIF.getAllTags(this);
            const gps = getGPSFromExif(exifData);
            
            if (gps) {
                const photoData = {
                    name: file.name,
                    url: URL.createObjectURL(file),
                    lat: gps.lat,
                    lng: gps.lng,
                    exif: exifData,
                    file: file
                };
                resolve(photoData);
            } else {
                console.log(`No GPS data found for ${file.name}`);
                resolve(null);
            }
        });
    });
}

// Discover all image files in the mapimages directory
async function discoverImageFiles() {
    const supportedExtensions = ['.jpg', '.jpeg', '.JPG', '.JPEG'];
    const discoveredFiles = [];
    
    // Try to get a directory listing from the server
    try {
        const response = await fetch('/api/images');
        if (response.ok) {
            const data = await response.json();
            if (data.files && data.files.length > 0) {
                return data.files.map(filename => `mapimages/${filename}`);
            }
        }
    } catch (error) {
        console.log('Server-side directory listing not available, using fallback method');
    }
    
    // Fallback: Try known files and common patterns
    const knownFiles = [
        'IMG_1198.jpeg', 
        'IMG_1175.jpeg', 
        'BNS_20250524_203313_290.jpeg',
        'IMG_0572-2.jpg'
    ];
    
    // Check if known files exist
    for (const filename of knownFiles) {
        try {
            const response = await fetch(`mapimages/${filename}`, { method: 'HEAD' });
            if (response.ok) {
                discoveredFiles.push(`mapimages/${filename}`);
            }
        } catch (error) {
            console.log(`File not found: ${filename}`);
        }
    }
    
    return discoveredFiles;
}

// Load and process all photos
async function loadPhotos() {
    console.log('Discovering image files...');
    const imageFiles = await discoverImageFiles();
    console.log('Found image files:', imageFiles);
    
    if (imageFiles.length === 0) {
        console.warn('No image files found in mapimages directory');
        return;
    }
    
    for (const fileName of imageFiles) {
        try {
            const response = await fetch(fileName);
            if (response.ok) {
                const blob = await response.blob();
                const file = new File([blob], fileName.split('/').pop(), { type: blob.type });
                
                const photoData = await processPhoto(file);
                if (photoData) {
                    photos.push(photoData);
                    addPhotoMarker(photoData);
                    console.log(`Added photo: ${photoData.name} at ${photoData.lat}, ${photoData.lng}`);
                }
            }
        } catch (error) {
            console.error(`Error loading ${fileName}:`, error);
        }
    }

    // Fit map to show all photos
    if (photos.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        photos.forEach(photo => {
            bounds.extend([photo.lng, photo.lat]);
        });
        map.fitBounds(bounds, { padding: 50 });
        console.log(`Successfully loaded ${photos.length} photos with GPS data`);
    } else {
        console.warn('No photos with GPS data found');
    }
}

// Add photo marker to map and track in markers array
function addPhotoMarker(photo) {
    const markerEl = document.createElement('div');
    markerEl.className = 'photo-marker';
    markerEl.style.backgroundImage = `url(${photo.url})`;
    markerEl.addEventListener('click', () => {
        showPhotoModal(photo);
    });
    const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([photo.lng, photo.lat])
        .addTo(map);
    markers.push(marker);
}

// Show photo in modal
function showPhotoModal(photo) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const photoInfo = document.getElementById('photoInfo');

    modalImage.src = photo.url;
    
    // Format EXIF info
    let infoHTML = `<h3>${photo.name}</h3>`;
    infoHTML += `<p><strong>Location:</strong> ${photo.lat.toFixed(6)}, ${photo.lng.toFixed(6)}</p>`;
    
    if (photo.exif.DateTime) {
        infoHTML += `<p><strong>Date:</strong> ${photo.exif.DateTime}</p>`;
    }
    if (photo.exif.Make && photo.exif.Model) {
        infoHTML += `<p><strong>Camera:</strong> ${photo.exif.Make} ${photo.exif.Model}</p>`;
    }
    if (photo.exif.ExposureTime) {
        infoHTML += `<p><strong>Exposure:</strong> ${photo.exif.ExposureTime}</p>`;
    }
    if (photo.exif.FNumber) {
        infoHTML += `<p><strong>Aperture:</strong> f/${photo.exif.FNumber}</p>`;
    }
    if (photo.exif.ISO) {
        infoHTML += `<p><strong>ISO:</strong> ${photo.exif.ISO}</p>`;
    }
    
    photoInfo.innerHTML = infoHTML;
    modal.style.display = 'block';
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Use Mapbox Geocoding API
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`;
        
        fetch(geocodingUrl)
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    const feature = data.features[0];
                    const [lng, lat] = feature.center;
                    
                    map.flyTo({
                        center: [lng, lat],
                        zoom: 12,
                        duration: 2000
                    });

                    // Add temporary marker for search result
                    const searchMarker = new mapboxgl.Marker({ color: 'yellow' })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    // Remove search marker after 5 seconds
                    setTimeout(() => {
                        searchMarker.remove();
                    }, 5000);
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                alert('Location not found. Please try a different search term.');
            });
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Modal close functionality
function setupModal() {
    const modal = document.getElementById('photoModal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Add Google Photos authentication button
const authButton = document.createElement('button');
authButton.textContent = 'Connect Google Photos';
authButton.style.position = 'absolute';
authButton.style.top = '70px';
authButton.style.right = '20px';
authButton.style.zIndex = '1000';
authButton.style.padding = '8px 16px';
authButton.style.backgroundColor = '#4285f4';
authButton.style.color = 'white';
authButton.style.border = 'none';
authButton.style.borderRadius = '4px';
authButton.style.cursor = 'pointer';
document.body.appendChild(authButton);

authButton.addEventListener('click', () => {
    window.location.href = '/auth/google';
});

// Function to calculate distance between two points in kilometers
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Function to update heatmap based on current zoom level and markers
function updateHeatmap() {
    const zoom = map.getZoom();
    // Remove existing heatmap layer and source if they exist
    if (map.getLayer('photo-heatmap')) {
        map.removeLayer('photo-heatmap');
    }
    if (map.getSource('photo-heatmap')) {
        map.removeSource('photo-heatmap');
    }

    // By default, show all markers
    markers.forEach(marker => {
        marker.getElement().style.display = 'block';
    });

    // Only show heatmap when zoomed out
    if (zoom < HEATMAP_ZOOM_THRESHOLD) {
        const points = [];
        const markersCopy = [...markers];
        // Track which markers are in clusters
        const clusteredMarkers = new Set();
        while (markersCopy.length > 0) {
            const currentMarker = markersCopy[0];
            const cluster = [currentMarker];
            markersCopy.splice(0, 1);
            for (let i = markersCopy.length - 1; i >= 0; i--) {
                const marker = markersCopy[i];
                const distance = getDistance(
                    currentMarker.getLngLat().lat,
                    currentMarker.getLngLat().lng,
                    marker.getLngLat().lat,
                    marker.getLngLat().lng
                );
                if (distance <= CLUSTER_RADIUS) {
                    cluster.push(marker);
                    markersCopy.splice(i, 1);
                }
            }
            if (cluster.length >= MIN_CLUSTER_COUNT) {
                // Mark all markers in this cluster as clustered
                cluster.forEach(m => clusteredMarkers.add(m));
                const center = cluster.reduce((acc, marker) => {
                    const lngLat = marker.getLngLat();
                    return {
                        lng: acc.lng + lngLat.lng,
                        lat: acc.lat + lngLat.lat
                    };
                }, { lng: 0, lat: 0 });
                center.lng /= cluster.length;
                center.lat /= cluster.length;
                points.push({
                    type: 'Feature',
                    properties: {
                        intensity: cluster.length
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [center.lng, center.lat]
                    }
                });
            }
        }
        // Hide only clustered markers
        clusteredMarkers.forEach(marker => {
            marker.getElement().style.display = 'none';
        });
        if (points.length > 0) {
            map.addSource('photo-heatmap', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: points
                }
            });
            map.addLayer({
                id: 'photo-heatmap',
                type: 'heatmap',
                source: 'photo-heatmap',
                paint: {
                    'heatmap-weight': ['get', 'intensity'],
                    'heatmap-intensity': 1,
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(0, 0, 255, 0)',
                        0.2, 'rgba(0, 0, 255, 0.5)',
                        0.4, 'rgba(0, 255, 0, 0.5)',
                        0.6, 'rgba(255, 255, 0, 0.5)',
                        0.8, 'rgba(255, 0, 0, 0.5)',
                        1, 'rgba(255, 0, 0, 1)'
                    ],
                    'heatmap-radius': 30,
                    'heatmap-opacity': 0.75
                }
            });
        }
    }
}

// Update the loadImages function to call updateHeatmap after adding markers
async function loadImages() {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        // Remove all existing markers from map and clear array
        markers.forEach(marker => marker.remove());
        markers = [];
        if (data.files && data.files.length > 0) {
            // Check if we have Google Photos data
            if (data.files[0].id && data.files[0].baseUrl) {
                // Handle Google Photos data
                data.files.forEach(photo => {
                    if (photo.location) {
                        const marker = new mapboxgl.Marker()
                            .setLngLat([photo.location.longitude, photo.location.latitude])
                            .addTo(map);
                        marker.getElement().addEventListener('click', () => {
                            showPhoto(photo.baseUrl);
                        });
                        markers.push(marker);
                    }
                });
            } else {
                // Handle local files
                for (const file of data.files) {
                    const response = await fetch(`/mapimages/${file}`);
                    const blob = await response.blob();
                    const exifData = await getExifData(blob);
                    if (exifData && exifData.gps) {
                        const marker = new mapboxgl.Marker()
                            .setLngLat([exifData.gps.longitude, exifData.gps.latitude])
                            .addTo(map);
                        marker.getElement().addEventListener('click', () => {
                            showPhoto(`/mapimages/${file}`);
                        });
                        markers.push(marker);
                    }
                }
            }
            // Update heatmap after adding all markers
            updateHeatmap();
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupSearch();
    setupModal();
}); 