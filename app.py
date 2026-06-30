from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
import random
from game_logic import get_random_district, get_all_districts, fuzzy_match_district, process_guess

app = Flask(__name__)
CORS(app)

# Load district GeoJSON once at startup
geojson_path = os.path.join(os.path.dirname(__file__), '..', 'JillaQuestCodes', 'districtmap.geojson')
with open(geojson_path, encoding='utf-8') as f:
    district_geojson = json.load(f)

# Use real districts from DB
DISTRICTS = get_all_districts()

# Simple in-memory game state (for demo, not production)
game_state = {
    'target_district_id': None,
    'attempts': 0,
    'last_guess': None
}

@app.route('/api/new-game', methods=['GET'])
def new_game():
    target = get_random_district()
    game_state['target_district_id'] = target['id']
    game_state['attempts'] = 0
    game_state['last_guess'] = None
    return jsonify({'message': 'New game started', 'target_district_id': target['id'], 'target_district_name': target['name']})

@app.route('/api/guess', methods=['POST'])
def guess():
    data = request.json
    guess_input = data.get('guess')
    # Fuzzy match input to district name
    district_names = [d['name'] for d in DISTRICTS]
    matched_name = fuzzy_match_district(guess_input, district_names)
    if not matched_name:
        return jsonify({'error': 'District not recognized'}), 400
    guessed = next((d for d in DISTRICTS if d['name'] == matched_name), None)
    if not guessed:
        return jsonify({'error': 'District not found'}), 400
    game_state['attempts'] += 1
    game_state['last_guess'] = guessed['id']
    feedback = process_guess(game_state['target_district_id'], guessed['id'])
    feedback['attempts'] = game_state['attempts']
    feedback['guessed_district_name'] = guessed['name']
    return jsonify({'feedback': feedback})

@app.route('/api/districts', methods=['GET'])
def districts():
    return jsonify({'districts': DISTRICTS})

@app.route('/api/map-data', methods=['GET'])
def map_data():
    return jsonify({'geojson': district_geojson})

@app.route('/api/game-stats', methods=['GET'])
def game_stats():
    return jsonify({'stats': {
        'target_district_id': game_state['target_district_id'],
        'attempts': game_state['attempts'],
        'last_guess': game_state['last_guess']
    }})

@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend'), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend'), path)

if __name__ == '__main__':
    app.run(debug=True)
