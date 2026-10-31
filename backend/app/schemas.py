from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class AddressOut(BaseModel):
    street: str
    city: str
    zipCode: str
    country: str
    lat: float | None = None
    lng: float | None = None


class LandlordOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    avatarUrl: str | None = None
    isVerified: bool
    responseRate: int | None = None


class BadgeOut(BaseModel):
    id: str
    label: str
    variant: str = "primary"


class ApartmentOut(BaseModel):
    id: str
    title: str
    description: str
    type: str
    status: str
    price: int
    charges: int | None = 0
    surface: int
    rooms: int
    bedrooms: int
    bathrooms: int = 1
    floor: int | None = None
    totalFloors: int | None = None
    address: AddressOut
    photos: list[str]
    hasVirtualTour: bool
    hasVideo: bool
    energyScore: str
    amenities: list[str]
    badges: list[BadgeOut]
    landlord: LandlordOut
    publishedAt: str
    updatedAt: str
    isFeatured: bool
    isOneClickCompatible: bool


class ApartmentCreate(BaseModel):
    quartierId: str | None = None
    title: str = ""
    description: str = ""
    type: str = "apartment"
    price: int
    charges: int = 0
    surface: int
    rooms: int = 1
    bedrooms: int = 1
    bathrooms: int = Field(default=1, ge=0)
    floor: int | None = None
    totalFloors: int | None = None
    street: str
    city: str
    zipCode: str = ""
    photos: list[str] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)
    hasVirtualTour: bool = False
    energyScore: str = "B"
    availableSlots: list[dict] = Field(default_factory=list)


class UserOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    phone: str | None = None
    role: Literal["tenant", "landlord", "admin"]
    avatarUrl: str | None = None
    isVerified: bool = True
    fileCompletionPercent: int = 100


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: str | None = Field(default=None, pattern="^\\+229[0-9]{10}$")
    password: str = Field(min_length=8)
    role: Literal["tenant", "landlord"] = "tenant"


class TokenOut(BaseModel):
    token: str
    user: UserOut


class VisitSlotOut(BaseModel):
    id: str
    date: str
    startTime: str
    endTime: str
    isAvailable: bool
    isBooked: bool


class ApplicationOut(BaseModel):
    id: str
    apartmentId: str
    firstName: str
    lastName: str
    situation: str
    monthlyIncome: int
    guarantorIncome: int | None = None
    solvabilityScore: str
    solvabilityRatio: float
    fileCompletionPercent: int
    isFileVerified: bool
    submittedAt: str
    status: str
    message: str | None = None


class ApplicationCreate(BaseModel):
    situation: str = "Locataire"
    monthlyIncome: int = 0
    guarantorIncome: int | None = None
    message: str | None = None


class ApplicationStatusIn(BaseModel):
    status: Literal["pending", "pre_validated", "rejected", "accepted"]


class EmailIn(BaseModel):
    email: EmailStr
    query: str | None = None


class FavoriteToggleOut(BaseModel):
    favorited: bool
    ids: list[str]


class PassDocumentOut(BaseModel):
    id: str
    kind: Literal["identity", "income"]
    label: str
    status: str


class PassOut(BaseModel):
    userId: str
    completionPercent: int
    isReady: bool
    documents: list[PassDocumentOut]


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ApartmentUpdate(BaseModel):
    quartierId: str | None = None
    title: str | None = Field(default=None, max_length=240)
    description: str | None = None
    type: str | None = None
    price: int | None = Field(default=None, ge=1)
    charges: int | None = Field(default=None, ge=0)
    surface: int | None = Field(default=None, ge=1)
    rooms: int | None = Field(default=None, ge=1)
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: int | None = Field(default=None, ge=0)
    street: str | None = None
    city: str | None = None
    zipCode: str | None = None
    photos: list[str] | None = None
    amenities: list[str] | None = None


class AdminUserOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    role: str
    isBlocked: bool
    createdAt: str


class MessageOut(BaseModel):
    id: str
    conversationId: str | None = None
    isRead: bool = False
    createdAt: str | None = None
    senderId: str
    receiverId: str
    apartmentId: str
    apartmentTitle: str
    content: str
    timestamp: str


class ConversationOut(BaseModel):
    id: str | None = None
    tenantId: str | None = None
    landlordId: str | None = None
    createdAt: str | None = None
    apartmentId: str
    apartmentTitle: str
    otherUserId: str
    otherUserName: str
    lastMessage: str
    lastTimestamp: str
    unreadCount: int = 0


class ConversationCreate(BaseModel):
    apartmentId: str
    landlordId: str | None = None


class ConversationRecordOut(BaseModel):
    id: str
    tenantId: str
    landlordId: str
    apartmentId: str
    createdAt: str


class MessageCreateIn(BaseModel):
    conversationId: str
    content: str = Field(min_length=1, max_length=4000)


class AdminUserStatusIn(BaseModel):
    status: Literal["active", "blocked"]


class NeighborhoodCreate(BaseModel):
    nom: str = Field(min_length=1, max_length=120)
    arrondissement: str = Field(default="", max_length=120)


class DocumentOwnerOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str


class AdminTenantDocumentOut(BaseModel):
    id: str
    kind: Literal["identity", "income"]
    filename: str
    status: str
    size: int
    createdAt: str
    owner: DocumentOwnerOut


class DocumentStatusIn(BaseModel):
    status: Literal["approved", "rejected"]


class UserStatusOut(BaseModel):
    id: str
    status: Literal["active", "blocked"]
