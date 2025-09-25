# Sabarmati River Geo-Fencing Map

A comprehensive Leaflet-based mapping solution for the Sabarmati River route with advanced geo-fencing capabilities and real-time employee tracking.

## Features

### 🗺️ Interactive Leaflet Map
- **OpenStreetMap Integration**: Uses OpenStreetMap tiles for reliable, free mapping
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Custom Markers**: Distinctive markers for different employee statuses and locations
- **Interactive Popups**: Detailed information on hover/click

### 🌊 Sabarmati River Route
- **Precise Coordinates**: 10 key points along the Sabarmati River route
- **Route Visualization**: Blue polyline showing the complete river path
- **Location Markers**: Numbered markers for key landmarks and bridges
- **Route Statistics**: Real-time calculation of route length and area

### 🛡️ Advanced Geo-Fencing
- **Dynamic Buffer Zones**: Adjustable buffer width (50m - 1000m)
- **Dual-Layer Protection**: 
  - Main geo-fence zone (60% of buffer width)
  - Buffer zone (full buffer width)
- **Real-time Validation**: Instant geo-fence status for all employees
- **Visual Indicators**: Color-coded zones with transparency

### 📊 Statistics Dashboard
- **Route Length**: Calculated using Turf.js for precision
- **Buffer Area**: Real-time area calculation in km²
- **Coordinate Count**: Total number of route points
- **Employee Metrics**: Online count and geo-fence compliance

### 👥 Employee Tracking
- **Real-time Locations**: Live employee position updates
- **Status Indicators**: Working, Tracking, Offline statuses
- **Battery Monitoring**: Device battery level tracking
- **Step-in Locations**: Historical attendance check-in points
- **Route History**: Employee movement patterns (optional)

## Technical Implementation

### Dependencies
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@turf/turf": "^6.5.0"
}
```

### Key Components

#### 1. MapContainer
- **Center**: [23.025, 72.575] (center of river route)
- **Zoom Level**: 13 (optimal for route visibility)
- **Tile Layer**: OpenStreetMap for reliable mapping

#### 2. Geo-Fencing Layers
```javascript
// Buffer Zone (Outer)
<Polygon
  positions={createBufferPolygon()}
  color="orange"
  fillColor="orange"
  fillOpacity={0.1}
  weight={2}
  dashArray="5, 5"
/>

// Main Geo-fence Zone (Inner)
<Polygon
  positions={createMainGeofencePolygon()}
  color="red"
  fillColor="red"
  fillOpacity={0.2}
  weight={3}
/>
```

#### 3. Route Coordinates
```javascript
const SABARMATI_RIVER_COORDINATES = [
  [23.061715, 72.591704], // Gayatri Mandir, Riverfront Road
  [23.060091, 72.586441], // Subhash Bridge
  [23.052869, 72.579168], // Rishi Dadhichi Bridge
  [23.040107, 72.574729], // Gandhi Bridge
  [23.027089, 72.576119], // Nehru Bridge
  [23.020216, 72.577146], // Unnamed road, Jamalpur
  [23.013011, 72.576807], // Sabarmati Riverfront Promenade
  [23.006932, 72.574382], // Sabarmati River front Road, Bhavna colony
  [22.995622, 72.565339], // Dr Ambedkar Bridge, Ranna Park
  [22.988129, 72.557547]  // Southern point
];
```

### Turf.js Integration
- **Route Length**: `turf.length()` for precise distance calculation
- **Buffer Creation**: `turf.buffer()` for geo-fence polygon generation
- **Area Calculation**: `turf.area()` for buffer zone area measurement

## Usage

### Navigation
Access the map through the admin sidebar: **Sabarmati River Map** (Waves icon)

### Controls
- **Buffer Width Slider**: Adjust geo-fence buffer from 50m to 1000m
- **Toggle Layers**: Show/hide employees, routes, and step-in locations
- **Refresh Button**: Update employee locations in real-time

### Map Interactions
- **Zoom**: Mouse wheel or zoom controls
- **Pan**: Click and drag to move around
- **Markers**: Click for detailed information popups
- **Responsive**: Touch-friendly on mobile devices

## API Integration

### Employee Data
```javascript
// Fetch online employees
const response = await locationAPI.getOnlineEmployees();

// Fetch step-in locations
const response = await attendanceAPI.getAllAttendance({
  startDate: startDate,
  endDate: endDate,
  limit: 100
});
```

### Real-time Updates
- **Auto-refresh**: Every 30 seconds
- **Manual refresh**: Via refresh button
- **Error handling**: Fallback to test data if API fails

## Styling

### Custom CSS Classes
- `.custom-div-icon`: Custom marker styling
- `.map-controls`: Control panel styling
- `.map-statistics`: Statistics panel styling
- `.map-legend`: Legend styling

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: Adapts layout for different screen sizes
- **Touch-friendly**: Large touch targets for mobile interaction

## Performance Optimizations

### Map Rendering
- **Efficient Layers**: Only render visible elements
- **Conditional Rendering**: Show/hide layers based on user preferences
- **Memory Management**: Proper cleanup of map instances

### Data Management
- **Caching**: Store employee data in component state
- **Debouncing**: Prevent excessive API calls
- **Error Boundaries**: Graceful error handling

## Future Enhancements

### Planned Features
- **Route Optimization**: Suggest optimal employee placement
- **Heat Maps**: Show activity density along the route
- **Historical Analysis**: Track changes over time
- **Export Functionality**: Download maps and reports
- **Offline Support**: Cache map tiles for offline use

### Integration Opportunities
- **Weather Data**: Overlay weather conditions
- **Traffic Information**: Real-time traffic updates
- **Emergency Alerts**: Integration with emergency systems
- **IoT Sensors**: Connect with environmental sensors

## Troubleshooting

### Common Issues
1. **Map not loading**: Check internet connection and OpenStreetMap availability
2. **Markers not showing**: Verify employee data is being fetched correctly
3. **Geo-fence not updating**: Check buffer width slider and Turf.js calculations
4. **Performance issues**: Reduce number of visible markers or disable some layers

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Full support with touch optimization

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Development Team
