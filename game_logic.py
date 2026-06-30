# Core game logic for Nepal Geography Game
import random
import sqlite3
from rapidfuzz import process, fuzz
import os

def get_db_path():
    return os.path.join(os.path.dirname(__file__), 'nepal_geo_game.db')

def get_all_districts():
    conn = sqlite3.connect(get_db_path())
    c = conn.cursor()
    c.execute('SELECT id, name, province FROM districts')
    districts = [{'id': row[0], 'name': row[1], 'province': row[2]} for row in c.fetchall()]
    conn.close()
    return districts

def get_random_district():
    districts = get_all_districts()
    return random.choice(districts)

def fuzzy_match_district(input_text, district_list, threshold=70):
    match = process.extractOne(input_text, district_list, scorer=fuzz.ratio)
    if match and match[1] >= threshold:
        return match[0]
    return None

def get_distance_and_direction(district1_id, district2_id):
    conn = sqlite3.connect(get_db_path())
    c = conn.cursor()
    c.execute('''SELECT distance_km, bearing_degrees FROM distances WHERE district1_id=? AND district2_id=?''', (district1_id, district2_id))
    row = c.fetchone()
    conn.close()
    if row:
        return row[0], row[1]
    return None, None

def get_province(district_id):
    conn = sqlite3.connect(get_db_path())
    c = conn.cursor()
    c.execute('SELECT province FROM districts WHERE id=?', (district_id,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def direction_from_degrees(degrees):
    dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    ix = int((degrees + 22.5) // 45) % 8
    return dirs[ix]

def process_guess(target_district_id, guessed_district_id):
    is_correct = (target_district_id == guessed_district_id)
    distance_km, direction_degrees = get_distance_and_direction(guessed_district_id, target_district_id)
    province_target = get_province(target_district_id)
    province_guess = get_province(guessed_district_id)
    same_province = (province_target == province_guess)
    feedback_color = 'green' if is_correct else ('yellow' if same_province else 'red')
    direction = direction_from_degrees(direction_degrees) if direction_degrees is not None else None
    return {
        'district_name': guessed_district_id,
        'is_correct': is_correct,
        'distance_km': distance_km,
        'direction': direction,
        'direction_degrees': direction_degrees,
        'same_province': same_province,
        'feedback_color': feedback_color
    }
