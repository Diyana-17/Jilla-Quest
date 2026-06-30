# This script will process Nepal districts GeoJSON and populate the SQLite database
# It will also calculate distance and bearing between all districts

import json
import sqlite3
from geopy.distance import geodesic
import math
import os

# TODO: Load nepal_districts.json
# TODO: Extract district names, centroids, province info
# TODO: Calculate distance matrix and bearing
# TODO: Store in SQLite database

def calculate_bearing(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    bearing = math.atan2(y, x)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360
    return bearing

def create_database(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS districts (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE,
            province TEXT,
            latitude REAL,
            longitude REAL,
            geojson TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS distances (
            district1_id INTEGER,
            district2_id INTEGER,
            distance_km REAL,
            bearing_degrees REAL,
            FOREIGN KEY (district1_id) REFERENCES districts(id),
            FOREIGN KEY (district2_id) REFERENCES districts(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY,
            target_district_id INTEGER,
            guesses TEXT,
            score INTEGER,
            completed BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (target_district_id) REFERENCES districts(id)
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == "__main__":
    db_path = os.path.join(os.path.dirname(__file__), 'nepal_geo_game.db')
    create_database(db_path)
    print(f"Database created at {db_path}")

    # Load district centroid GeoJSON
    geojson_path = os.path.join(os.path.dirname(__file__), '..', 'JillaQuestCodes', 'districtcentroid.geojson')
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    # Extract district data
    districts = []
    for feature in geojson['features']:
        props = feature['properties']
        coords = feature['geometry']['coordinates']
        districts.append({
            'name': props['DISTRICT'].strip().upper(),
            'province': props['Province'],
            'latitude': coords[1],
            'longitude': coords[0],
            'geojson': json.dumps(feature['geometry'])
        })

    # Insert districts into DB
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    for d in districts:
        c.execute('''INSERT OR IGNORE INTO districts (name, province, latitude, longitude, geojson) VALUES (?, ?, ?, ?, ?)''',
                  (d['name'], d['province'], d['latitude'], d['longitude'], d['geojson']))
    conn.commit()

    # Fetch district IDs for distance matrix
    c.execute('SELECT id, name, latitude, longitude FROM districts')
    rows = c.fetchall()
    id_map = {row[1]: row[0] for row in rows}
    coords_map = {row[1]: (row[2], row[3]) for row in rows}

    # Calculate and insert all pairwise distances and bearings
    for name1, id1 in id_map.items():
        lat1, lon1 = coords_map[name1]
        for name2, id2 in id_map.items():
            if id1 == id2:
                continue
            lat2, lon2 = coords_map[name2]
            distance = geodesic((lat1, lon1), (lat2, lon2)).kilometers
            bearing = calculate_bearing(lat1, lon1, lat2, lon2)
            c.execute('''INSERT INTO distances (district1_id, district2_id, distance_km, bearing_degrees) VALUES (?, ?, ?, ?)''',
                      (id1, id2, distance, bearing))
    conn.commit()
    conn.close()
    print("Districts and distances populated.")
