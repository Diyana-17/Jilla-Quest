# Nepal Geography Game Development Script

## Project Overview
Create a web-based geography game similar to Globe Game but focused on Nepal. Players guess randomly selected districts and receive feedback similar to Wordle (colored boxes, directional arrows, higher/lower indicators).

## Technical Stack
- **Frontend**: HTML, CSS, JavaScript, Leaflet.js
- **Backend**: Python (Flask or FastAPI)
- **Database**: SQLite (for development), PostgreSQL (for production)
- **Additional Libraries**: 
  - Python: rapidfuzz (fuzzy matching), geopy (distance calculations)
  - JavaScript: Leaflet.js, autocomplete library

## Project Structure
```
nepal-geo-game/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── game_logic.py
│   ├── data_processor.py
│   ├── requirements.txt
│   └── data/
│       ├── nepal_districts.json
│       ├── peaks.json (future)
│       ├── cities.json (future)
│       └── rivers.json (future)
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
│       └── icons/
└── README.md
```

## Implementation Steps

### Phase 1: Backend Development

#### Step 1: Set up Python Environment
```bash
pip install flask flask-cors geopy rapidfuzz sqlite3
```

#### Step 2: Create Data Processing Script (data_processor.py)
**Purpose**: Process Nepal districts GeoJSON and pre-calculate distances

**Requirements**:
1. Load nepal_districts.json file
2. Extract district names, centroids, province information
3. Calculate distance matrix between all districts
4. Calculate bearing/direction between all districts
5. Store processed data in SQLite database

**Database Schema**:
```sql
-- Districts table
CREATE TABLE districts (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    province TEXT,
    latitude REAL,
    longitude REAL,
    geojson TEXT
);

-- Distance matrix table
CREATE TABLE distances (
    district1_id INTEGER,
    district2_id INTEGER,
    distance_km REAL,
    bearing_degrees REAL,
    FOREIGN KEY (district1_id) REFERENCES districts(id),
    FOREIGN KEY (district2_id) REFERENCES districts(id)
);

-- Game sessions table (for future use)
CREATE TABLE game_sessions (
    id INTEGER PRIMARY KEY,
    target_district_id INTEGER,
    guesses TEXT, -- JSON array of guess history
    score INTEGER,
    completed BOOLEAN,
    created_at TIMESTAMP,
    FOREIGN KEY (target_district_id) REFERENCES districts(id)
);
```

#### Step 3: Create Game Logic Module (game_logic.py)
**Functions needed**:
1. `get_random_district()` - Returns random district data
2. `process_guess(target_district, guessed_district)` - Returns feedback object
3. `fuzzy_match_district(input_text)` - Returns best matching district
4. `get_distance_and_direction(district1, district2)` - Returns distance and bearing
5. `calculate_feedback(target, guess)` - Returns Wordle-style feedback

**Feedback Object Structure**:
```json
{
    "district_name": "Kathmandu",
    "is_correct": false,
    "distance_km": 156.7,
    "direction": "NE",
    "direction_degrees": 45,
    "same_province": true,
    "feedback_color": "yellow" // green=correct, yellow=same_province, red=different_province
}
```

#### Step 4: Create Flask API (app.py)
**Endpoints needed**:
1. `GET /api/new-game` - Start new game, returns target district (hidden from client)
2. `POST /api/guess` - Submit guess, returns feedback
3. `GET /api/districts` - Get all district names for autocomplete
4. `GET /api/map-data` - Get GeoJSON data for map display
5. `GET /api/game-stats` - Get current game statistics

### Phase 2: Frontend Development

#### Step 5: Create HTML Structure (index.html)
**Components needed**:
1. Game header with title and instructions
2. Map container for Leaflet.js
3. Input section with autocomplete search
4. Guess history display (Wordle-style boxes)
5. Game statistics panel
6. Modal for game completion/instructions

**Responsive Design Requirements**:
- Mobile-first approach
- Map should be 60% of screen height on mobile, 70% on desktop
- Input section should be easily accessible on mobile
- Guess history should be scrollable

#### Step 6: Create CSS Styles (styles.css)
**Style Requirements**:
1. Modern, clean design similar to Wordle
2. Color scheme for feedback:
   - Green: Correct guess
   - Yellow: Same province
   - Red: Different province
3. Responsive grid layout
4. Smooth animations for guess feedback
5. Map controls styling
6. Mobile-optimized input fields

#### Step 7: Create JavaScript Game Logic (script.js)
**Core Functions**:
1. `initializeMap()` - Set up Leaflet map with Nepal districts
2. `startNewGame()` - Initialize new game session
3. `handleGuess()` - Process user input and call API
4. `displayFeedback()` - Show guess results with animations
5. `updateGuessHistory()` - Add guess to history display
6. `setupAutocomplete()` - Configure district name autocomplete
7. `calculateGameStats()` - Track attempts, success rate, etc.

**Map Implementation**:
1. Center map on Nepal coordinates
2. Load district boundaries from GeoJSON
3. Style districts with hover effects
4. Add markers for guessed districts with directional arrows
5. Highlight target district when game is won

**Game Flow**:
1. Player starts game → API call to get new target
2. Player types district name → fuzzy matching for suggestions
3. Player submits guess → API call returns feedback
4. Display feedback with Wordle-style colored box
5. Add directional arrow on map pointing toward target
6. Repeat until correct guess or give up option

### Phase 3: Advanced Features (Future Implementation)

#### Step 8: Extended Game Modes
**Peak Guessing Mode**:
- Add peaks.json with elevation data
- Feedback includes: higher/lower elevation, same region, direction
- Use triangle markers on map

**City Guessing Mode**:
- Add cities.json with population data
- Feedback includes: larger/smaller population, same province, direction
- Use circle markers on map

**River Guessing Mode**:
- Add rivers.json with length data
- Feedback includes: longer/shorter, flows through same province, direction
- Use line/curve markers on map

#### Step 9: Enhanced Features
1. **Scoring System**: Points based on number of guesses
2. **Hints System**: Reveal province or first letter after X wrong guesses
3. **Daily Challenge**: Same target for all players each day
4. **Statistics Tracking**: Personal best, average guesses, etc.
5. **Educational Mode**: Show facts about districts after correct guess

## Technical Implementation Details

### Distance Calculation
Use Haversine formula for calculating distances between coordinates:
```python
from geopy.distance import geodesic
distance = geodesic((lat1, lon1), (lat2, lon2)).kilometers
```

### Direction/Bearing Calculation
Calculate bearing between two points for directional arrows:
```python
import math
def calculate_bearing(lat1, lon1, lat2, lon2):
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dlon = lon2 - lon1
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    
    bearing = math.atan2(y, x)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360  # Normalize to 0-360
    
    return bearing
```

### Fuzzy Matching Implementation
```python
from rapidfuzz import fuzz, process

def fuzzy_match_district(input_text, district_list, threshold=70):
    match = process.extractOne(input_text, district_list, scorer=fuzz.ratio)
    if match[1] >= threshold:
        return match[0]
    return None
```

### Map Styling
```css
.leaflet-container {
    height: 70vh;
    width: 100%;
    border-radius: 8px;
}

.guess-feedback {
    display: inline-block;
    width: 60px;
    height: 60px;
    margin: 2px;
    border-radius: 4px;
    text-align: center;
    line-height: 60px;
    font-weight: bold;
    color: white;
}

.feedback-correct { background-color: #6aaa64; }
.feedback-same-province { background-color: #c9b458; }
.feedback-different { background-color: #787c7e; }
```

## Testing Requirements

### Unit Tests
1. Test distance calculations accuracy
2. Test fuzzy matching with various inputs
3. Test game logic with edge cases
4. Test API endpoints with various inputs

### Integration Tests
1. Test complete game flow from start to finish
2. Test map loading and interaction
3. Test responsive design on various screen sizes
4. Test autocomplete functionality

### User Testing
1. Test with users unfamiliar with Nepal geography
2. Gather feedback on difficulty level
3. Test mobile usability
4. Measure average completion time

## Deployment Considerations

### Development Setup
1. Use Flask development server
2. SQLite for local database
3. Static file serving through Flask

### Production Setup
1. Use Gunicorn or uWSGI for Python application
2. Nginx for static file serving and reverse proxy
3. PostgreSQL for production database
4. SSL certificate for HTTPS
5. CDN for static assets if needed

## Performance Optimizations

1. **Database Indexing**: Index district names and IDs for fast lookups
2. **Caching**: Cache district list and distance matrix in memory
3. **Lazy Loading**: Load map data progressively
4. **Compression**: Gzip compression for API responses
5. **Minification**: Minify CSS and JavaScript for production

## Security Considerations

1. **Input Validation**: Sanitize all user inputs
2. **Rate Limiting**: Prevent API abuse
3. **CORS Configuration**: Properly configure cross-origin requests
4. **SQL Injection Prevention**: Use parameterized queries
5. **XSS Protection**: Escape user-generated content

This script provides a comprehensive roadmap for building the Nepal Geography Game with all the features and technical considerations needed for successful implementation.