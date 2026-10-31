import json
from datetime import datetime, timezone

from app.models import Apartment, User
from app.schemas import ApartmentOut, ApplicationOut, UserOut, VisitSlotOut


def iso(dt: datetime | None) -> str:
    if dt is None:
        return datetime.now(timezone.utc).isoformat()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        firstName=user.first_name,
        lastName=user.last_name,
        email=user.email,
        phone=user.phone,
        role=user.role,  # type: ignore[arg-type]
        avatarUrl=user.avatar_url,
        isVerified=user.is_verified,
        fileCompletionPercent=user.file_completion_percent,
    )


def apartment_out(apt: Apartment) -> ApartmentOut:
    landlord = apt.landlord
    return ApartmentOut(
        id=apt.id,
        title=apt.title,
        description=apt.description,
        type=apt.type,
        status=apt.status,
        price=apt.price,
        charges=apt.charges,
        surface=apt.surface,
        rooms=apt.rooms,
        bedrooms=apt.bedrooms,
        bathrooms=apt.bathrooms,
        floor=apt.floor,
        totalFloors=apt.total_floors,
        address={
            "street": apt.street,
            "city": apt.city,
            "zipCode": apt.zip_code,
            "country": apt.country,
            "lat": apt.lat,
            "lng": apt.lng,
        },
        photos=json.loads(apt.photos or "[]"),
        hasVirtualTour=apt.has_virtual_tour,
        hasVideo=apt.has_video,
        energyScore=apt.energy_score,
        amenities=json.loads(apt.amenities or "[]"),
        badges=json.loads(apt.badges or "[]"),
        landlord={
            "id": landlord.id,
            "firstName": landlord.first_name,
            "lastName": landlord.last_name,
            "avatarUrl": landlord.avatar_url,
            "isVerified": landlord.is_verified,
            "responseRate": landlord.response_rate,
        },
        publishedAt=iso(apt.published_at),
        updatedAt=iso(apt.updated_at),
        isFeatured=apt.is_featured,
        isOneClickCompatible=apt.is_one_click_compatible,
    )


def slot_out(slot) -> VisitSlotOut:
    return VisitSlotOut(
        id=slot.id,
        date=slot.date,
        startTime=slot.start_time,
        endTime=slot.end_time,
        isAvailable=slot.is_available,
        isBooked=slot.is_booked,
    )


def application_out(app) -> ApplicationOut:
    return ApplicationOut(
        id=app.id,
        apartmentId=app.apartment_id,
        firstName=app.first_name,
        lastName=app.last_name,
        situation=app.situation,
        monthlyIncome=app.monthly_income,
        guarantorIncome=app.guarantor_income,
        solvabilityScore=app.solvability_score,
        solvabilityRatio=app.solvability_ratio,
        fileCompletionPercent=app.file_completion_percent,
        isFileVerified=app.is_file_verified,
        submittedAt=iso(app.submitted_at),
        status=app.status,
        message=app.message,
    )
