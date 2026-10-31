from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="tenant")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    file_completion_percent: Mapped[int] = mapped_column(Integer, default=100)
    response_rate: Mapped[int] = mapped_column(Integer, default=95)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    apartments: Mapped[list["Apartment"]] = relationship(back_populates="landlord")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="user")


class Apartment(Base):
    __tablename__ = "apartments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(240))
    description: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default="available")
    price: Mapped[int] = mapped_column(Integer)
    charges: Mapped[int] = mapped_column(Integer, default=0)
    surface: Mapped[int] = mapped_column(Integer)
    rooms: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    street: Mapped[str] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(120))
    quartier_id: Mapped[str | None] = mapped_column(ForeignKey("quartiers.id"), nullable=True, index=True)
    zip_code: Mapped[str] = mapped_column(String(40), default="")
    country: Mapped[str] = mapped_column(String(8), default="BJ")
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    photos: Mapped[str] = mapped_column(Text, default="[]")
    has_virtual_tour: Mapped[bool] = mapped_column(Boolean, default=False)
    has_video: Mapped[bool] = mapped_column(Boolean, default=False)
    energy_score: Mapped[str] = mapped_column(String(2), default="B")
    amenities: Mapped[str] = mapped_column(Text, default="[]")
    badges: Mapped[str] = mapped_column(Text, default="[]")
    landlord_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    published_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    is_one_click_compatible: Mapped[bool] = mapped_column(Boolean, default=True)

    landlord: Mapped["User"] = relationship(back_populates="apartments")
    quartier: Mapped["Quartier | None"] = relationship(back_populates="apartments")
    photo_records: Mapped[list["PhotoLogement"]] = relationship(back_populates="apartment", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="apartment", cascade="all, delete-orphan")
    slots: Mapped[list["VisitSlot"]] = relationship(back_populates="apartment", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="apartment", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "apartment_id", name="uq_favorite_user_apartment"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    apartment_id: Mapped[str] = mapped_column(ForeignKey("apartments.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship(back_populates="favorites")


class VisitSlot(Base):
    __tablename__ = "visit_slots"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    apartment_id: Mapped[str] = mapped_column(ForeignKey("apartments.id"), index=True)
    date: Mapped[str] = mapped_column(String(32))
    start_time: Mapped[str] = mapped_column(String(8))
    end_time: Mapped[str] = mapped_column(String(8))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)
    booked_by: Mapped[str | None] = mapped_column(String, nullable=True)

    apartment: Mapped["Apartment"] = relationship(back_populates="slots")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("tenant_id", "apartment_id", name="uq_application_tenant_apartment"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    apartment_id: Mapped[str] = mapped_column(ForeignKey("apartments.id"), index=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    situation: Mapped[str] = mapped_column(String(120), default="Locataire")
    monthly_income: Mapped[int] = mapped_column(Integer, default=0)
    guarantor_income: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solvability_score: Mapped[str] = mapped_column(String(16), default="orange")
    solvability_ratio: Mapped[float] = mapped_column(Float, default=0)
    file_completion_percent: Mapped[int] = mapped_column(Integer, default=100)
    is_file_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    status: Mapped[str] = mapped_column(String(24), default="pending")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    apartment: Mapped["Apartment"] = relationship(back_populates="applications")


class Newsletter(Base):
    __tablename__ = "newsletters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SearchAlert(Base):
    __tablename__ = "search_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(160), index=True)
    query: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Quartier(Base):
    __tablename__ = "quartiers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nom: Mapped[str] = mapped_column(String(120), index=True)
    arrondissement: Mapped[str] = mapped_column(String(120), default="")

    apartments: Mapped[list["Apartment"]] = relationship(back_populates="quartier")


class PhotoLogement(Base):
    __tablename__ = "photos_logement"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    logement_id: Mapped[str] = mapped_column(ForeignKey("apartments.id", ondelete="CASCADE"), index=True)
    url_photo: Mapped[str] = mapped_column(String(1000))
    ordre: Mapped[int] = mapped_column(Integer, default=0)

    apartment: Mapped["Apartment"] = relationship(back_populates="photo_records")


class TenantDocument(Base):
    __tablename__ = "tenant_documents"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(24), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    storage_name: Mapped[str] = mapped_column(String(80), unique=True)
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("tenant_id", "landlord_id", "apartment_id", name="uq_conversation_participants_apartment"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    landlord_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    apartment_id: Mapped[str] = mapped_column(ForeignKey("apartments.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    apartment: Mapped["Apartment"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    receiver_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    apartment_id: Mapped[str] = mapped_column(ForeignKey("apartments.id", ondelete="CASCADE"), index=True)
    conversation_id: Mapped[str | None] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    conversation: Mapped["Conversation | None"] = relationship(back_populates="messages")
