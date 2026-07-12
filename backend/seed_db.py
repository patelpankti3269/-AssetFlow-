import models
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

SEED_ASSETS = [
    { 'tag': 'AF-0012', 'name': 'Dell Laptop', 'category': 'Electronics', 'status': 'allocated', 'location': 'bengaluru', 'holder': 'u2', 'holderName': 'Priya Shah' },
    { 'tag': 'AF-0062', 'name': 'Projector', 'category': 'Electronics', 'status': 'maintenance', 'location': 'HQ floor 2', 'holder': None, 'holderName': None },
    { 'tag': 'AF-0201', 'name': 'Office chair', 'category': 'Furniture', 'status': 'available', 'location': 'Warehouse', 'holder': None, 'holderName': None },
    { 'tag': 'AF-9921', 'name': 'Office chair', 'category': 'Furniture', 'status': 'available', 'location': 'Desk E14', 'holder': None, 'holderName': None },
    { 'tag': 'AF-9838', 'name': 'Monitor', 'category': 'Electronics', 'status': 'allocated', 'location': 'Desk E15', 'holder': 'u3', 'holderName': 'Arjun Nair' }
]

def seed():
    for data in SEED_ASSETS:
        asset = models.Asset(**data)
        db.add(asset)
    db.commit()
    print("Database seeded with initial assets!")

if __name__ == "__main__":
    seed()
