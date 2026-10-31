"""API MyHome. Démarrage: uvicorn app.main:app --reload (depuis backend/)."""
import json
import uuid
from pathlib import Path
from typing import Literal
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, inspect, select, text, update
from sqlalchemy.orm import Session, joinedload
from app.config import CORS_ORIGINS
from app.database import Base, SessionLocal, engine, get_db
from app.deps import RequireRole, get_current_user, get_optional_user
from app.models import Apartment, Application, Conversation, Favorite, Message, Newsletter, PhotoLogement, Quartier, SearchAlert, TenantDocument, User, VisitSlot
from app.schemas import AdminUserOut, AdminUserStatusIn, AdminTenantDocumentOut, ApartmentCreate, ApartmentOut, ApartmentUpdate, ApplicationCreate, ApplicationOut, ApplicationStatusIn, ConversationCreate, ConversationOut, ConversationRecordOut, DocumentOwnerOut, DocumentStatusIn, EmailIn, NeighborhoodCreate, FavoriteToggleOut, LoginIn, MessageCreate, MessageCreateIn, MessageOut, PassOut, RegisterIn, TokenOut, UserOut, UserStatusOut
from app.security import create_token, hash_password, verify_password
from app.serializers import apartment_out, application_out, user_out

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    with engine.begin() as connection:
        if "phone" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(32)"))
        if "is_blocked" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE"))
        apartment_columns = {column["name"] for column in inspect(engine).get_columns("apartments")}
        if "is_approved" not in apartment_columns:
            connection.execute(text("ALTER TABLE apartments ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT TRUE"))
        if "is_hidden" not in apartment_columns:
            connection.execute(text("ALTER TABLE apartments ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE"))
        if "quartier_id" not in apartment_columns:
            connection.execute(text("ALTER TABLE apartments ADD COLUMN quartier_id VARCHAR REFERENCES quartiers(id)"))
        if "bathrooms" not in apartment_columns:
            connection.execute(text("ALTER TABLE apartments ADD COLUMN bathrooms INTEGER NOT NULL DEFAULT 1"))
        favorite_columns = {column["name"] for column in inspect(engine).get_columns("favorites")}
        if "created_at" not in favorite_columns:
            connection.execute(text("ALTER TABLE favorites ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        message_columns = {column["name"] for column in inspect(engine).get_columns("messages")}
        if "conversation_id" not in message_columns:
            connection.execute(text("ALTER TABLE messages ADD COLUMN conversation_id VARCHAR REFERENCES conversations(id)"))
        if "is_read" not in message_columns:
            connection.execute(text("ALTER TABLE messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE"))
        if "created_at" not in message_columns:
            connection.execute(text("ALTER TABLE messages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        tenant_document_columns = {column["name"] for column in inspect(engine).get_columns("tenant_documents")}
        if "status" not in tenant_document_columns:
            connection.execute(text("ALTER TABLE tenant_documents ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'pending'"))
    with SessionLocal() as migration_db:
        for apartment_row in migration_db.scalars(select(Apartment)).all():
            photo_urls = json.loads(apartment_row.photos or "[]")
            existing_urls = set(migration_db.scalars(select(PhotoLogement.url_photo).where(PhotoLogement.logement_id == apartment_row.id)).all())
            for order, url in enumerate(photo_urls):
                if url not in existing_urls:
                    migration_db.add(PhotoLogement(id=new_id(), logement_id=apartment_row.id, url_photo=url, ordre=order))
        for legacy_message in migration_db.scalars(select(Message).where(Message.conversation_id.is_(None))).all():
            listing = migration_db.get(Apartment, legacy_message.apartment_id)
            if listing is None:
                continue
            if legacy_message.sender_id == listing.landlord_id:
                tenant_id = legacy_message.receiver_id
            else:
                tenant_id = legacy_message.sender_id
            conversation = migration_db.scalar(select(Conversation).where(Conversation.tenant_id == tenant_id, Conversation.landlord_id == listing.landlord_id, Conversation.apartment_id == listing.id))
            if conversation is None:
                conversation = Conversation(id=new_id(), tenant_id=tenant_id, landlord_id=listing.landlord_id, apartment_id=listing.id)
                migration_db.add(conversation)
                migration_db.flush()
            legacy_message.conversation_id = conversation.id
            legacy_message.created_at = legacy_message.timestamp
        migration_db.commit()
    yield


app = FastAPI(title="MyHome API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
APARTMENT_UPLOADS = UPLOAD_ROOT / "apartments"
PRIVATE_UPLOADS = UPLOAD_ROOT / "private"
APARTMENT_UPLOADS.mkdir(parents=True, exist_ok=True)
PRIVATE_UPLOADS.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/apartments", StaticFiles(directory=APARTMENT_UPLOADS), name="apartment-photos")
MAX_FILE_SIZE = 10 * 1024 * 1024

def valid_upload(content: bytes, content_type: str) -> bool:
    signatures = {
        "application/pdf": lambda data: data.startswith(b"%PDF-"),
        "image/jpeg": lambda data: data.startswith(bytes.fromhex("ffd8ff")),
        "image/png": lambda data: data.startswith(bytes.fromhex("89504e470d0a1a0a")),
        "image/webp": lambda data: len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP",
    }
    check = signatures.get(content_type)
    return bool(check and check(content))


def new_id(): return str(uuid.uuid4())
def owned(db, apartment_id, user):
    item = db.get(Apartment, apartment_id)
    if not item: raise HTTPException(404, "Annonce introuvable.")
    if item.landlord_id != user.id and user.role != "admin": raise HTTPException(403, "Accès refusé.")
    return item

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ok", "database": "ok"}

@app.post("/api/auth/register", response_model=TokenOut, status_code=201)
def register(data: RegisterIn, db: Session=Depends(get_db)):
    if len(data.password)<8: raise HTTPException(422,"Mot de passe: 8 caractères minimum.")
    email=str(data.email).lower()
    if db.scalar(select(User).where(User.email==email)): raise HTTPException(409,"Adresse e-mail déjà utilisée.")
    user=User(id=new_id(),first_name=data.firstName.strip(),last_name=data.lastName.strip(),email=email,password_hash=hash_password(data.password),role=data.role,is_verified=False,file_completion_percent=0,phone=data.phone)
    db.add(user); db.commit(); db.refresh(user)
    return {"token":create_token(user.id,user.role),"user":user_out(user)}

@app.post("/api/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==str(data.email).lower()))
    if not user or not verify_password(data.password,user.password_hash): raise HTTPException(401,"Identifiants incorrects.")
    if user.is_blocked: raise HTTPException(403,"Ce compte est temporairement bloqué.")
    return {"token":create_token(user.id,user.role),"user":user_out(user)}

@app.get("/api/auth/me",response_model=UserOut)
def me(user: User=Depends(get_current_user)): return user_out(user)

@app.get("/api/apartments",response_model=list[ApartmentOut])
def apartments(city:str|None=None,type:str|None=None,min_price:int|None=Query(None,ge=0),max_price:int|None=Query(None,ge=0),min_rooms:int|None=Query(None,ge=0),status:str="available",skip:int=Query(0,ge=0),limit:int=Query(50,ge=1,le=100),db:Session=Depends(get_db),user:User|None=Depends(get_optional_user)):
    if user is None:
        limit = min(limit, 6)
        skip = 0
        status = "available"
    q=select(Apartment).options(joinedload(Apartment.landlord)).where(Apartment.status==status,Apartment.is_approved.is_(True),Apartment.is_hidden.is_(False))
    if city:q=q.where(Apartment.city.ilike(f"%{city.strip()}%"))
    if type:q=q.where(Apartment.type==type)
    if min_price is not None:q=q.where(Apartment.price>=min_price)
    if max_price is not None:q=q.where(Apartment.price<=max_price)
    if min_rooms is not None:q=q.where(Apartment.rooms>=min_rooms)
    return [apartment_out(x) for x in db.scalars(q.order_by(Apartment.is_featured.desc(),Apartment.published_at.desc()).offset(skip).limit(limit)).all()]

@app.get("/api/apartments/{apartment_id}",response_model=ApartmentOut)
def apartment(apartment_id:str,db:Session=Depends(get_db),user:User|None=Depends(get_optional_user)):
    x=db.scalar(select(Apartment).options(joinedload(Apartment.landlord)).where(Apartment.id==apartment_id))
    if not x:raise HTTPException(404,"Annonce introuvable.")
    if (not x.is_approved or x.is_hidden) and (user is None or (x.landlord_id != user.id and user.role != "admin")):
        raise HTTPException(404,"Annonce introuvable.")
    return apartment_out(x)

@app.post("/api/apartments",response_model=ApartmentOut,status_code=201)
def create_apartment(data:ApartmentCreate,db:Session=Depends(get_db),user:User=Depends(RequireRole("landlord", "admin"))):
    if user.role not in ("landlord","admin"):raise HTTPException(403,"Un compte bailleur est requis.")
    if data.price<=0 or data.surface<=0:raise HTTPException(422,"Loyer et surface doivent être positifs.")
    if data.quartierId and not db.get(Quartier, data.quartierId):
        raise HTTPException(404, "Quartier introuvable.")
    x=Apartment(id=new_id(),title=data.title.strip() or f"{data.type.title()} à {data.city}",description=data.description,type=data.type,status="pending",is_approved=False,price=data.price,charges=data.charges,surface=data.surface,rooms=data.rooms,bedrooms=data.bedrooms,bathrooms=data.bathrooms,floor=data.floor,total_floors=data.totalFloors,street=data.street,city=data.city,quartier_id=data.quartierId,zip_code=data.zipCode,photos=json.dumps(data.photos),amenities=json.dumps(data.amenities),has_virtual_tour=data.hasVirtualTour,energy_score=data.energyScore,landlord_id=user.id)
    db.add(x)
    for order, photo_url in enumerate(data.photos):
        db.add(PhotoLogement(id=new_id(), logement_id=x.id, url_photo=photo_url, ordre=order))
    for s in data.availableSlots:
        if all(s.get(k) for k in ("date","startTime","endTime")):
            db.add(VisitSlot(id=str(s.get("id") or new_id()),apartment_id=x.id,date=s["date"],start_time=s["startTime"],end_time=s["endTime"]))
    db.commit(); x=db.scalar(select(Apartment).options(joinedload(Apartment.landlord)).where(Apartment.id==x.id))
    return apartment_out(x)

@app.post("/api/apartments/photos")
async def upload_apartment_photos(request: Request, photos: list[UploadFile] = File(...), user: User = Depends(RequireRole("landlord", "admin"))):
    if not photos or len(photos) > 10:
        raise HTTPException(422, "Ajoutez entre 1 et 10 photos.")
    extensions = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    urls = []
    for photo in photos:
        extension = extensions.get(photo.content_type or "")
        if not extension:
            raise HTTPException(422, "Format photo non pris en charge (JPG, PNG ou WEBP).")
        content = await photo.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(413, "Chaque photo doit faire 10 Mo maximum.")
        if not valid_upload(content, photo.content_type or ""):
            raise HTTPException(422, "Le contenu ne correspond pas au format de la photo.")
        name = uuid.uuid4().hex + extension
        (APARTMENT_UPLOADS / name).write_bytes(content)
        urls.append(str(request.base_url).rstrip("/") + "/uploads/apartments/" + name)
    return {"urls": urls}

@app.put("/api/apartments/{apartment_id}/status")
def set_apartment_status(apartment_id:str,status:str,db:Session=Depends(get_db),user:User=Depends(RequireRole("landlord", "admin"))):
    if status not in {"available","rented","pending","reserved"}:raise HTTPException(422,"Statut invalide.")
    x=owned(db,apartment_id,user); x.status=status; x.updated_at=datetime.now(timezone.utc); db.commit(); return {"id":x.id,"status":x.status}

@app.get("/api/me/apartments", response_model=list[ApartmentOut])
def my_apartments(db: Session = Depends(get_db), user: User = Depends(RequireRole("landlord", "admin"))):
    query = select(Apartment).options(joinedload(Apartment.landlord))
    if user.role != "admin":
        query = query.where(Apartment.landlord_id == user.id)
    apartments = db.scalars(query.order_by(Apartment.published_at.desc())).all()
    return [apartment_out(item) for item in apartments]

@app.get("/api/me/favorites",response_model=list[str])
def favorites(db:Session=Depends(get_db),user:User=Depends(RequireRole("tenant"))):
    return list(db.scalars(select(Favorite.apartment_id).where(Favorite.user_id==user.id)).all())

@app.put("/api/apartments/{apartment_id}/favorite",response_model=FavoriteToggleOut)
def toggle_favorite(apartment_id:str,db:Session=Depends(get_db),user:User=Depends(RequireRole("tenant"))):
    if not db.get(Apartment,apartment_id):raise HTTPException(404,"Annonce introuvable.")
    x=db.scalar(select(Favorite).where(Favorite.user_id==user.id,Favorite.apartment_id==apartment_id))
    if x:db.delete(x); liked=False
    else:db.add(Favorite(user_id=user.id,apartment_id=apartment_id)); liked=True
    db.commit(); ids=list(db.scalars(select(Favorite.apartment_id).where(Favorite.user_id==user.id)).all())
    return {"favorited":liked,"ids":ids}

@app.get("/api/apartments/{apartment_id}/slots")
def slots(apartment_id:str,db:Session=Depends(get_db)):
    if not db.get(Apartment,apartment_id):raise HTTPException(404,"Annonce introuvable.")
    return [{"id":s.id,"date":s.date,"startTime":s.start_time,"endTime":s.end_time,"isAvailable":s.is_available,"isBooked":s.is_booked} for s in db.scalars(select(VisitSlot).where(VisitSlot.apartment_id==apartment_id).order_by(VisitSlot.date,VisitSlot.start_time)).all()]

@app.post("/api/apartments/{apartment_id}/slots/{slot_id}/book",status_code=201)
def book_slot(apartment_id:str,slot_id:str,db:Session=Depends(get_db),user:User=Depends(RequireRole("tenant"))):
    slot = db.scalar(select(VisitSlot).where(VisitSlot.id == slot_id, VisitSlot.apartment_id == apartment_id))
    if not slot:
        raise HTTPException(404, "Créneau introuvable.")

    result = db.execute(
        update(VisitSlot)
        .where(
            VisitSlot.id == slot_id,
            VisitSlot.apartment_id == apartment_id,
            VisitSlot.is_available.is_(True),
            VisitSlot.is_booked.is_(False),
        )
        .values(is_available=False, is_booked=True, booked_by=user.id)
    )
    if result.rowcount != 1:
        raise HTTPException(409, "Créneau indisponible.")
    db.commit()
    return {"message": "Visite réservée.", "slotId": slot_id}

@app.post("/api/apartments/{apartment_id}/applications",response_model=ApplicationOut,status_code=201)
def apply(apartment_id:str,data:ApplicationCreate,db:Session=Depends(get_db),user:User=Depends(RequireRole("tenant"))):
    apt=db.get(Apartment,apartment_id)
    if not apt or apt.status!="available":raise HTTPException(404,"Annonce indisponible.")
    if user.role!="tenant":raise HTTPException(403,"Seul un locataire peut candidater.")
    if db.scalar(select(Application).where(Application.apartment_id==apartment_id,Application.tenant_id==user.id)):raise HTTPException(409,"Candidature déjà envoyée.")
    ratio=(data.monthlyIncome+(data.guarantorIncome or 0))/max(apt.price+apt.charges,1)
    x=Application(id=new_id(),apartment_id=apt.id,tenant_id=user.id,first_name=user.first_name,last_name=user.last_name,situation=data.situation,monthly_income=data.monthlyIncome,guarantor_income=data.guarantorIncome,solvability_ratio=round(ratio,2),solvability_score="green" if ratio>=3 else "orange" if ratio>=2 else "red",file_completion_percent=user.file_completion_percent,is_file_verified=user.is_verified,message=data.message)
    db.add(x);db.commit();db.refresh(x);return application_out(x)

@app.get("/api/me/applications",response_model=list[ApplicationOut])
def my_applications(db:Session=Depends(get_db),user:User=Depends(RequireRole("tenant"))):
    return [application_out(x) for x in db.scalars(select(Application).where(Application.tenant_id==user.id).order_by(Application.submitted_at.desc())).all()]

@app.get("/api/landlord/applications",response_model=list[ApplicationOut])
def landlord_applications(db:Session=Depends(get_db),user:User=Depends(RequireRole("landlord", "admin"))):
    q=select(Application).join(Apartment).where(Apartment.landlord_id==user.id)
    if user.role=="admin":q=select(Application)
    return [application_out(x) for x in db.scalars(q.order_by(Application.submitted_at.desc())).all()]

@app.patch("/api/applications/{application_id}/status",response_model=ApplicationOut)
def application_status(application_id:str,data:ApplicationStatusIn,db:Session=Depends(get_db),user:User=Depends(RequireRole("landlord", "admin"))):
    x=db.get(Application,application_id)
    if not x:raise HTTPException(404,"Candidature introuvable.")
    owned(db,x.apartment_id,user);x.status=data.status;db.commit();db.refresh(x);return application_out(x)

@app.post("/api/me/documents", status_code=201)
async def upload_tenant_document(kind: Literal["identity", "income"], file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(RequireRole("tenant"))):
    extensions = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    extension = extensions.get(file.content_type or "")
    if not extension:
        raise HTTPException(422, "Format non pris en charge (PDF, JPG, PNG ou WEBP).")
    content = await file.read(MAX_FILE_SIZE + 1)
    if not content:
        raise HTTPException(422, "Le fichier est vide.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(413, "Le fichier doit faire 10 Mo maximum.")
    if not valid_upload(content, file.content_type or ""):
        raise HTTPException(422, "Le contenu ne correspond pas au format du document.")
    existing = db.scalar(select(TenantDocument).where(TenantDocument.user_id == user.id, TenantDocument.kind == kind)) if kind == "identity" else None
    storage_name = uuid.uuid4().hex + extension
    (PRIVATE_UPLOADS / storage_name).write_bytes(content)
    document = TenantDocument(id=new_id(), user_id=user.id, kind=kind, filename=Path(file.filename or ("document" + extension)).name[:255], storage_name=storage_name, content_type=file.content_type or "application/octet-stream", size=len(content))
    db.add(document)
    if existing:
        old_storage_name = existing.storage_name
        db.delete(existing)
    else:
        old_storage_name = None
    db.commit()
    if old_storage_name:
        (PRIVATE_UPLOADS / old_storage_name).unlink(missing_ok=True)
    return {"id": document.id, "kind": document.kind, "label": document.filename, "status": document.status, "size": document.size}

@app.get("/api/me/documents/{document_id}/download")
def download_tenant_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = db.get(TenantDocument, document_id)
    if not document or (document.user_id != user.id and user.role != "admin"):
        raise HTTPException(404, "Document introuvable.")
    path = PRIVATE_UPLOADS / document.storage_name
    if not path.is_file():
        raise HTTPException(404, "Fichier introuvable.")
    return FileResponse(path, media_type=document.content_type, filename=document.filename)

@app.delete("/api/me/documents/{document_id}", status_code=204)
def delete_tenant_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = db.get(TenantDocument, document_id)
    if not document or (document.user_id != user.id and user.role != "admin"):
        raise HTTPException(404, "Document introuvable.")
    (PRIVATE_UPLOADS / document.storage_name).unlink(missing_ok=True)
    db.delete(document)
    db.commit()

@app.get("/api/me/pass",response_model=PassOut)
def my_pass(db: Session = Depends(get_db), user: User = Depends(RequireRole("tenant"))):
    documents = db.scalars(select(TenantDocument).where(TenantDocument.user_id == user.id).order_by(TenantDocument.created_at)).all()
    kinds = {document.kind for document in documents}
    completion = (50 if "identity" in kinds else 0) + (50 if "income" in kinds else 0)
    return {"userId": user.id, "completionPercent": completion, "isReady": completion == 100, "documents": [{"id": document.id, "kind": document.kind, "label": document.filename, "status": document.status} for document in documents]}


@app.patch("/api/apartments/{apartment_id}", response_model=ApartmentOut)
def update_apartment(apartment_id: str, data: ApartmentUpdate, db: Session = Depends(get_db), user: User = Depends(RequireRole("landlord", "admin"))):
    item = owned(db, apartment_id, user)
    changes = data.model_dump(exclude_unset=True)
    mapping = {"zipCode": "zip_code", "quartierId": "quartier_id"}
    if "photos" in changes:
        item.photos = json.dumps(changes.pop("photos"))
        item.photo_records.clear()
        for order, photo_url in enumerate(json.loads(item.photos)):
            item.photo_records.append(PhotoLogement(id=new_id(), logement_id=item.id, url_photo=photo_url, ordre=order))
    for key, value in changes.items():
        setattr(item, mapping.get(key, key), json.dumps(value) if key == "amenities" else value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    return apartment_out(db.scalar(select(Apartment).options(joinedload(Apartment.landlord)).where(Apartment.id == item.id)))

@app.delete("/api/apartments/{apartment_id}", status_code=204)
def delete_apartment(apartment_id: str, db: Session = Depends(get_db), user: User = Depends(RequireRole("landlord", "admin"))):
    item = owned(db, apartment_id, user)
    db.delete(item)
    db.commit()

@app.patch("/api/admin/apartments/{apartment_id}/moderation")
def moderate_apartment(apartment_id: str, action: Literal["approve", "hide", "publish"], db: Session = Depends(get_db), user: User = Depends(RequireRole("ADMIN"))):
    item = db.get(Apartment, apartment_id)
    if not item:
        raise HTTPException(404, "Annonce introuvable.")
    if action == "approve":
        item.is_approved = True
        item.is_hidden = False
        item.status = "available"
    elif action == "hide":
        item.is_hidden = True
    else:
        item.is_hidden = False
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": item.id, "isApproved": item.is_approved, "isHidden": item.is_hidden, "status": item.status}

@app.get("/api/admin/apartments")
def admin_apartments(db: Session = Depends(get_db), user: User = Depends(RequireRole("admin"))):
    items = db.scalars(select(Apartment).options(joinedload(Apartment.landlord)).order_by(Apartment.published_at.desc())).all()
    return [{**apartment_out(item).model_dump(), "isApproved": item.is_approved, "isHidden": item.is_hidden} for item in items]

@app.delete("/api/admin/apartments/{apartment_id}", status_code=204)
def admin_delete_apartment(apartment_id: str, db: Session = Depends(get_db), user: User = Depends(RequireRole("admin"))):
    item = db.get(Apartment, apartment_id)
    if not item:
        raise HTTPException(404, "Annonce introuvable.")
    db.delete(item)
    db.commit()

@app.get("/api/admin/users", response_model=list[AdminUserOut])
def admin_users(db: Session = Depends(get_db), user: User = Depends(RequireRole("admin"))):
    users = db.scalars(select(User).where(User.role.in_(("tenant", "landlord"))).order_by(User.created_at.desc())).all()
    return [{"id": item.id, "firstName": item.first_name, "lastName": item.last_name, "email": item.email, "role": item.role, "isBlocked": item.is_blocked, "createdAt": item.created_at.isoformat()} for item in users]

@app.patch("/api/admin/users/{user_id}/block")
def admin_set_user_block(user_id: str, blocked: bool, db: Session = Depends(get_db), user: User = Depends(RequireRole("admin"))):
    target = db.get(User, user_id)
    if not target or target.role == "admin":
        raise HTTPException(404, "Utilisateur introuvable.")
    target.is_blocked = blocked
    db.commit()
    return {"id": target.id, "isBlocked": target.is_blocked}


def _admin_document_out(db: Session, document: TenantDocument) -> AdminTenantDocumentOut:
    owner = db.get(User, document.user_id)
    return AdminTenantDocumentOut(
        id=document.id,
        kind=document.kind,  # type: ignore[arg-type]
        filename=document.filename,
        status=document.status,
        size=document.size,
        createdAt=document.created_at.isoformat(),
        owner=DocumentOwnerOut(
            id=owner.id,
            firstName=owner.first_name,
            lastName=owner.last_name,
            email=owner.email,
        ) if owner else DocumentOwnerOut(id=document.user_id, firstName="Supprimé", lastName="", email=""),
    )


@app.get("/api/admin/documents", response_model=list[AdminTenantDocumentOut])
def admin_documents(db: Session = Depends(get_db), user: User = Depends(RequireRole("admin"))):
    documents = db.scalars(select(TenantDocument).order_by(TenantDocument.created_at.desc())).all()
    return [_admin_document_out(db, document) for document in documents]


@app.patch("/api/admin/documents/{document_id}/verify", response_model=AdminTenantDocumentOut)
def admin_verify_document(document_id: str, data: DocumentStatusIn, db: Session = Depends(get_db), user: User = Depends(RequireRole("admin"))):
    document = db.get(TenantDocument, document_id)
    if not document:
        raise HTTPException(404, "Document introuvable.")
    document.status = data.status
    kinds = {kind for kind in db.scalars(select(TenantDocument.kind).where(TenantDocument.user_id == document.user_id)).all()}
    owner = db.get(User, document.user_id)
    if owner and owner.role == "tenant":
        owner.file_completion_percent = (50 if "identity" in kinds else 0) + (50 if "income" in kinds else 0)
    db.commit()
    db.refresh(document)
    return _admin_document_out(db, document)


@app.get("/api/quartiers")
def list_quartiers(db: Session = Depends(get_db)):
    return [{"id": item.id, "nom": item.nom, "arrondissement": item.arrondissement} for item in db.scalars(select(Quartier).order_by(Quartier.nom)).all()]

@app.post("/api/admin/quartiers", status_code=201)
def create_quartier(data: NeighborhoodCreate, db: Session = Depends(get_db), user: User = Depends(RequireRole("ADMIN"))):
    name = data.nom.strip()
    if db.scalar(select(Quartier).where(Quartier.nom.ilike(name), Quartier.arrondissement == data.arrondissement.strip())):
        raise HTTPException(409, "Ce quartier existe déjà.")
    neighborhood = Quartier(id=new_id(), nom=name, arrondissement=data.arrondissement.strip())
    db.add(neighborhood)
    db.commit()
    return {"id": neighborhood.id, "nom": neighborhood.nom, "arrondissement": neighborhood.arrondissement}

@app.get("/api/admin/logements")
def admin_logements(db: Session = Depends(get_db), user: User = Depends(RequireRole("ADMIN"))):
    return admin_apartments(db=db, user=user)

@app.delete("/api/admin/logements/{logement_id}", status_code=204)
def admin_delete_logement(logement_id: str, db: Session = Depends(get_db), user: User = Depends(RequireRole("ADMIN"))):
    return admin_delete_apartment(apartment_id=logement_id, db=db, user=user)

@app.put("/api/admin/users/{user_id}/status", response_model=UserStatusOut)
def admin_update_user_status(user_id: str, data: AdminUserStatusIn, db: Session = Depends(get_db), user: User = Depends(RequireRole("ADMIN"))):
    target = db.get(User, user_id)
    if not target or target.role == "admin":
        raise HTTPException(404, "Utilisateur introuvable.")
    target.is_blocked = data.status == "blocked"
    db.commit()
    return {"id": target.id, "status": "blocked" if target.is_blocked else "active"}

def _get_or_create_conversation(db: Session, listing: Apartment, tenant_id: str) -> Conversation:
    conversation = db.scalar(select(Conversation).where(Conversation.tenant_id == tenant_id, Conversation.landlord_id == listing.landlord_id, Conversation.apartment_id == listing.id))
    if conversation is None:
        conversation = Conversation(id=new_id(), tenant_id=tenant_id, landlord_id=listing.landlord_id, apartment_id=listing.id)
        db.add(conversation)
        db.flush()
    return conversation


def _message_out(message: Message, listing: Apartment) -> dict:
    return {"id": message.id, "conversationId": message.conversation_id, "isRead": message.is_read, "createdAt": (message.created_at or message.timestamp).isoformat(), "senderId": message.sender_id, "receiverId": message.receiver_id, "apartmentId": listing.id, "apartmentTitle": listing.title, "content": message.content, "timestamp": (message.timestamp or message.created_at).isoformat()}


def _conversation_out(db: Session, conversation: Conversation, user: User) -> dict:
    peer_id = conversation.landlord_id if user.id == conversation.tenant_id else conversation.tenant_id
    peer = db.get(User, peer_id)
    listing = db.get(Apartment, conversation.apartment_id)
    latest = db.scalar(select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at.desc()).limit(1))
    unread = db.scalar(select(func.count(Message.id)).where(Message.conversation_id == conversation.id, Message.receiver_id == user.id, Message.is_read.is_(False))) or 0
    return {"id": conversation.id, "tenantId": conversation.tenant_id, "landlordId": conversation.landlord_id, "createdAt": conversation.created_at.isoformat(), "apartmentId": conversation.apartment_id, "apartmentTitle": listing.title if listing else "Annonce supprimée", "otherUserId": peer_id, "otherUserName": f"{peer.first_name} {peer.last_name}" if peer else "Utilisateur", "lastMessage": latest.content if latest else "", "lastTimestamp": (latest.created_at if latest else conversation.created_at).isoformat(), "unreadCount": unread}


@app.post("/api/conversations", response_model=ConversationRecordOut, status_code=201)
def create_or_get_conversation(data: ConversationCreate, db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE"))):
    listing = db.get(Apartment, data.apartmentId)
    if not listing or not listing.is_approved or listing.is_hidden or listing.status != "available":
        raise HTTPException(404, "Annonce introuvable.")
    if data.landlordId and data.landlordId != listing.landlord_id:
        raise HTTPException(422, "Le propriétaire ne correspond pas à cette annonce.")
    conversation = _get_or_create_conversation(db, listing, user.id)
    db.commit()
    return {"id": conversation.id, "tenantId": conversation.tenant_id, "landlordId": conversation.landlord_id, "apartmentId": conversation.apartment_id, "createdAt": conversation.created_at.isoformat()}


@app.get("/api/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE", "PROPRIETAIRE"))):
    query = select(Conversation).where((Conversation.tenant_id == user.id) | (Conversation.landlord_id == user.id)).order_by(Conversation.created_at.desc())
    items = db.scalars(query).all()
    return sorted((_conversation_out(db, item, user) for item in items), key=lambda item: item["lastTimestamp"], reverse=True)


@app.get("/api/me/conversations", response_model=list[ConversationOut])
def my_conversations(db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE", "PROPRIETAIRE"))):
    return list_conversations(db=db, user=user)


@app.get("/api/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE", "PROPRIETAIRE"))):
    conversation = db.get(Conversation, conversation_id)
    if not conversation or user.id not in (conversation.tenant_id, conversation.landlord_id):
        raise HTTPException(404, "Conversation introuvable.")
    messages = db.scalars(select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)).all()
    for message in messages:
        if message.receiver_id == user.id:
            message.is_read = True
    db.commit()
    listing = db.get(Apartment, conversation.apartment_id)
    if listing is None:
        raise HTTPException(404, "Annonce introuvable.")
    return [_message_out(message, listing) for message in messages]


@app.post("/api/messages", response_model=MessageOut, status_code=201)
def send_conversation_message(data: MessageCreateIn, db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE", "PROPRIETAIRE"))):
    conversation = db.get(Conversation, data.conversationId)
    if not conversation or user.id not in (conversation.tenant_id, conversation.landlord_id):
        raise HTTPException(404, "Conversation introuvable.")
    listing = db.get(Apartment, conversation.apartment_id)
    if listing is None:
        raise HTTPException(404, "Annonce introuvable.")
    content = data.content.strip()
    if not content:
        raise HTTPException(422, "Le message ne peut pas être vide.")
    receiver_id = conversation.landlord_id if user.id == conversation.tenant_id else conversation.tenant_id
    message = Message(id=new_id(), conversation_id=conversation.id, sender_id=user.id, receiver_id=receiver_id, apartment_id=listing.id, content=content, is_read=False)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_out(message, listing)


@app.post("/api/apartments/{apartment_id}/messages", response_model=MessageOut, status_code=201)
def start_conversation(apartment_id: str, data: MessageCreate, db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE"))):
    listing = db.get(Apartment, apartment_id)
    if not listing or not listing.is_approved or listing.is_hidden or listing.status != "available":
        raise HTTPException(404, "Annonce introuvable.")
    content = data.content.strip()
    if not content:
        raise HTTPException(422, "Le message ne peut pas être vide.")
    conversation = _get_or_create_conversation(db, listing, user.id)
    message = Message(id=new_id(), conversation_id=conversation.id, sender_id=user.id, receiver_id=listing.landlord_id, apartment_id=listing.id, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_out(message, listing)


@app.get("/api/conversations/{apartment_id}/{other_user_id}/messages", response_model=list[MessageOut])
def legacy_conversation_messages(apartment_id: str, other_user_id: str, db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE", "PROPRIETAIRE"))):
    listing = db.get(Apartment, apartment_id)
    if not listing:
        raise HTTPException(404, "Annonce introuvable.")
    tenant_id = user.id if user.role == "tenant" else other_user_id
    if user.role == "tenant" and other_user_id != listing.landlord_id:
        raise HTTPException(403, "Conversation inaccessible.")
    if user.role == "landlord" and (user.id != listing.landlord_id or other_user_id == user.id):
        raise HTTPException(403, "Conversation inaccessible.")
    conversation = db.scalar(select(Conversation).where(Conversation.tenant_id == tenant_id, Conversation.landlord_id == listing.landlord_id, Conversation.apartment_id == listing.id))
    if not conversation:
        raise HTTPException(404, "Conversation introuvable.")
    return get_conversation_messages(conversation_id=conversation.id, db=db, user=user)


@app.post("/api/conversations/{apartment_id}/{other_user_id}/messages", response_model=MessageOut, status_code=201)
def legacy_reply_conversation(apartment_id: str, other_user_id: str, data: MessageCreate, db: Session = Depends(get_db), user: User = Depends(RequireRole("LOCATAIRE", "PROPRIETAIRE"))):
    listing = db.get(Apartment, apartment_id)
    if not listing:
        raise HTTPException(404, "Annonce introuvable.")
    tenant_id = user.id if user.role == "tenant" else other_user_id
    if user.role == "tenant" and other_user_id != listing.landlord_id:
        raise HTTPException(403, "Conversation inaccessible.")
    if user.role == "landlord" and (user.id != listing.landlord_id or other_user_id == user.id):
        raise HTTPException(403, "Conversation inaccessible.")
    conversation = db.scalar(select(Conversation).where(Conversation.tenant_id == tenant_id, Conversation.landlord_id == listing.landlord_id, Conversation.apartment_id == listing.id))
    if not conversation:
        raise HTTPException(404, "Conversation introuvable.")
    return send_conversation_message(data=MessageCreateIn(conversationId=conversation.id, content=data.content), db=db, user=user)

@app.post("/api/newsletter",status_code=201)
def newsletter(data:EmailIn,db:Session=Depends(get_db)):
    email=str(data.email).lower()
    if db.scalar(select(Newsletter).where(Newsletter.email==email)):return {"message":"Adresse déjà inscrite."}
    db.add(Newsletter(email=email));db.commit();return {"message":"Inscription enregistrée."}

@app.post("/api/search-alerts",status_code=201)
def search_alert(data:EmailIn,db:Session=Depends(get_db)):
    db.add(SearchAlert(email=str(data.email).lower(),query=data.query));db.commit();return {"message":"Alerte enregistrée."}
