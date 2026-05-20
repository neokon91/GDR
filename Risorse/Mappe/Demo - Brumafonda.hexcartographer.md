---
type: hexcartographer
uso: esagoni
mondo: "[[Demo - Terre della Soglia]]"
luoghi:
  - "[[Demo - Valle di Brumafonda]]"
  - "[[Demo - Ponte delle Campane]]"
  - "[[Demo - Santuario della Prima Pietra]]"
stato: pronto
---

# Demo - Brumafonda

Mappa Hex Cartographer demo per pianificare viaggi nella valle. La mappa serve solo a decidere percorso, ritmo e conseguenze: i dettagli canonici restano nelle note luogo collegate.

```json
{
  "hexes": {
    "-2_0": { "q": -2, "r": 0, "color": "#c8d8a8", "symbol": "tree1", "symbolColor": "#355c3a" },
    "-1_0": { "q": -1, "r": 0, "color": "#b7c98e" },
    "0_0": { "q": 0, "r": 0, "color": "#d8c188", "symbol": "house1", "symbolColor": "#6f5030" },
    "1_0": { "q": 1, "r": 0, "color": "#c8d8a8" },
    "2_0": { "q": 2, "r": 0, "color": "#a9b6bd", "symbol": "mountain1", "symbolColor": "#66737b" },
    "-1_1": { "q": -1, "r": 1, "color": "#c9e3ec", "symbol": "bridge1", "symbolColor": "#5c4936" },
    "0_1": { "q": 0, "r": 1, "color": "#d6cfb7" },
    "1_1": { "q": 1, "r": 1, "color": "#c3b88f", "symbol": "tower1", "symbolColor": "#6a5b44" },
    "-2_2": { "q": -2, "r": 2, "color": "#8fb1c5" },
    "-1_2": { "q": -1, "r": 2, "color": "#c8d8a8", "symbol": "tree2", "symbolColor": "#355c3a" },
    "0_2": { "q": 0, "r": 2, "color": "#b7c98e" },
    "1_2": { "q": 1, "r": 2, "color": "#9da9ad", "symbol": "mountain2", "symbolColor": "#5e6870" }
  },
  "rivers": [
    {
      "id": "fiume-campane",
      "points": [{ "q": -2, "r": 2 }, { "q": -1, "r": 1 }, { "q": -2, "r": 0 }],
      "color": "#5f9bb5",
      "width": 4,
      "dash": 1
    }
  ],
  "roads": [
    {
      "id": "sentiero-soglia",
      "points": [{ "q": -1, "r": 1 }, { "q": 0, "r": 0 }, { "q": 1, "r": 1 }],
      "color": "#7c5a3a",
      "width": 3,
      "dash": 2
    }
  ],
  "texts": [
    { "id": "ponte", "x": 330, "y": 365, "text": "Ponte", "fontSize": 22, "color": "#2f2b26", "bold": true, "link": "Mondi/Luoghi/Demo - Ponte delle Campane.md" },
    { "id": "villaggio", "x": 420, "y": 300, "text": "Brumafonda", "fontSize": 24, "color": "#2f2b26", "bold": true, "link": "Mondi/Luoghi/Demo - Valle di Brumafonda.md" },
    { "id": "santuario", "x": 548, "y": 388, "text": "Santuario", "fontSize": 22, "color": "#2f2b26", "bold": true, "link": "Mondi/Luoghi/Demo - Santuario della Prima Pietra.md" }
  ],
  "borders": [
    {
      "id": "dominio-nebbia",
      "name": "Nebbia viva",
      "hexes": [{ "q": -1, "r": 1 }, { "q": 0, "r": 1 }, { "q": 1, "r": 1 }],
      "color": "#6f7890",
      "width": 3,
      "dash": 3,
      "visible": true
    }
  ],
  "gridSize": 48,
  "zoom": 1,
  "offX": 390,
  "offY": 210,
  "settings": {
    "colorPalette": ["#c8d8a8", "#b7c98e", "#d8c188", "#c9e3ec", "#9da9ad"],
    "colorPalette2": ["#355c3a", "#6f5030", "#5f9bb5", "#7c5a3a", "#6f7890"],
    "activeColorSlot": 0,
    "drawMode": "pen",
    "currentToolGroup": "hexcolor",
    "patternData": null,
    "patternSourceHex": null,
    "hexColorColor": "#c8d8a8",
    "hexOrientation": false
  }
}
```
