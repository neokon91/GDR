import sys
from pathlib import Path

# Rende importabile render.py (vive in Dev/Tools) da qualunque cwd.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "Dev" / "Tools"))
