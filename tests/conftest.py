import sys
from pathlib import Path

# Rende importabile render.py (vive in Dev/Tools) da qualunque cwd.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "Dev" / "Tools"))
# Rende importabile _common.py (fixtures condivise dei test, dopo lo split di
# test_render.py in moduli tematici) da qualunque import-mode di pytest.
sys.path.insert(0, str(Path(__file__).resolve().parent))
