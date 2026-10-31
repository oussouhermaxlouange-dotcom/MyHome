"""Données facultatives de démonstration: python -m app.seed (depuis backend/)."""
import json
from sqlalchemy import select
from app.database import Base, SessionLocal, engine
from app.models import Apartment, User, VisitSlot
from app.security import hash_password
from app.config import DEMO_PASSWORD

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    if db.scalar(select(User).where(User.email=="bailleur@myhome.bj")):
        print("Les données de démonstration existent déjà.")
    else:
        landlord=User(id="demo-landlord",first_name="Sophie",last_name="Martin",email="bailleur@myhome.bj",password_hash=hash_password(DEMO_PASSWORD),role="landlord",is_verified=True,file_completion_percent=100)
        tenant=User(id="demo-tenant",first_name="Marc",last_name="Dossou",email="locataire@myhome.bj",password_hash=hash_password(DEMO_PASSWORD),role="tenant",is_verified=True,file_completion_percent=100)
        db.add_all([landlord,tenant])
        apt=Apartment(id="demo-apartment-1",title="Appartement lumineux à Cotonou",description="Appartement agréable dans un quartier accessible, proche des commerces et des transports.",type="apartment",status="available",is_approved=True,price=250000,charges=15000,surface=72,rooms=3,bedrooms=2,street="Haie Vive",city="Cotonou",zip_code="",country="BJ",lat=6.357, lng=2.405,photos=json.dumps(["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=85"]),amenities=json.dumps(["parking","balcony"]),badges="[]",landlord_id=landlord.id)
        db.add(apt)
        db.add(VisitSlot(id="demo-slot-1",apartment_id=apt.id,date="2030-12-20",start_time="09:00",end_time="09:30"))
        db.commit()
        print("Compte bailleur: bailleur@myhome.bj")
        print("Compte locataire: locataire@myhome.bj")
        print("Mot de passe de démonstration: valeur de DEMO_PASSWORD")
