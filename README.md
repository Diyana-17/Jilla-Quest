# Jilla-Quest
Nepal's District Guessing Game

## 📖 Overview

**Jilla Quest** is an educational web game that helps users learn the geographical districts of Nepal through an interactive, map-based quiz. Instead of memorizing district names from a textbook, players click directly on a digital map of Nepal to identify districts, with instant feedback and score tracking.

The project combines **GIS (Geographic Information System)** data with a **Flask + Leaflet.js** web stack.

---

## ✨ Features

- Interactive map of Nepal with district boundaries
- Random district selection with click-based guessing
- Instant correct/incorrect feedback
- Score tracking and duplicate-guess prevention
- GeoJSON-based district polygon and centroid rendering
- Clean, responsive interface

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python, Flask |
| Mapping | Leaflet.js |
| GIS Data | GeoJSON |

---

## 📂 Project Structure

```
Jilla-Quest/
├── backend/
│   ├── app.py
│   ├── game_logic.py
│   ├── data_processor.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── data/
│   ├── districtmap.geojson
│   └── districtcentroid.geojson
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/Diyana-17/Jilla-Quest.git
cd Jilla-Quest
```

**2. Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**3. Run the Flask server**
```bash
python app.py
```

**4. Launch the frontend**
Open `frontend/index.html` in your browser.

---

## 🎮 How to Play

1. Start the Flask backend and open the frontend.
2. The game randomly selects a district name.
3. Click the matching district on the map.
4. Get instant feedback on whether your guess was correct.
5. Continue until all districts are covered, then view your final score.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---
