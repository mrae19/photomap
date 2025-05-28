// Mapbox configuration
mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dHJhZSIsImEiOiJja2RpMXIxdW4wMG52MnFzMjUwcTMxOGRuIn0.ZhVoB4RBydLec16F5MIabg';

let map;
let photos = [];

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

// Load and process all photos
async function loadPhotos() {
    const imageFiles = [
        'mapimages/IMG_1198.jpeg', 
        'mapimages/IMG_1175.jpeg', 
        'mapimages/BNS_20250524_203313_290.jpeg',
        'mapimages/IMG_0572-2.jpg'
    ];
    
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
    }
}

// Add photo marker to map
function addPhotoMarker(photo) {
    // Create marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'photo-marker';
    markerEl.style.backgroundImage = `url(${photo.url})`;
    
    // Add click event
    markerEl.addEventListener('click', () => {
        showPhotoModal(photo);
    });

    // Create marker
    new mapboxgl.Marker(markerEl)
        .setLngLat([photo.lng, photo.lat])
        .addTo(map);
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

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupSearch();
    setupModal();
}); 