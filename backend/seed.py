import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.database import SessionLocal, Base, engine
from backend.app.api.demo import seed_demo_database

def run_seed():
    print("[PayVerify] Initializing PayVerify Ethiopia Database...")
    db = SessionLocal()
    try:
        res = seed_demo_database(db)
        print(f"[OK] {res['message']}")
        print(f"[Restaurant] {res['restaurant']}")
        print("\n[Credentials]")
        for role, creds in res["credentials"].items():
            print(f"  * {role.capitalize()}: username='{creds['username']}', password='{creds['password']}'")
    except Exception as e:
        print(f"[Error] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
