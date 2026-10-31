from sqlalchemy import select
from app.database import SessionLocal
from app.models import PhotoLogement, User


def promote_to_admin(email):
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        user.role = "admin"
        db.commit()


def register(client, email, role="tenant"):
    response = client.post("/api/auth/register", json={
        "firstName": "Test", "lastName": "User", "email": email,
        "password": "strong-pass-123", "role": role,
    })
    assert response.status_code == 201, response.text
    return response.json()["token"]


def test_health_checks_database(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_tenant_document_verification_workflow(client):
    tenant_token = register(client, "doc-tenant@example.com")
    admin_token = register(client, "doc-admin@example.com", "landlord")
    tenant_headers = {"Authorization": f"Bearer {tenant_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    promote_to_admin("doc-admin@example.com")

    pdf_content = b"%PDF-1.4 test"
    identity = client.post(
        "/api/me/documents?kind=identity",
        headers=tenant_headers,
        files={"file": ("cip.pdf", pdf_content, "application/pdf")},
    )
    assert identity.status_code == 201, identity.text
    assert identity.json()["status"] == "pending"
    income = client.post(
        "/api/me/documents?kind=income",
        headers=tenant_headers,
        files={"file": ("bulletin.pdf", pdf_content, "application/pdf")},
    )
    assert income.status_code == 201, income.text

    listed = client.get("/api/me/pass", headers=tenant_headers)
    assert listed.status_code == 200
    assert listed.json()["isReady"] is True
    assert {document["status"] for document in listed.json()["documents"]} == {"pending"}

    assert client.get("/api/admin/documents", headers=tenant_headers).status_code == 403
    documents = client.get("/api/admin/documents", headers=admin_headers).json()
    by_label = {document["filename"]: document for document in documents}
    assert "cip.pdf" in by_label and "bulletin.pdf" in by_label
    identity_id = by_label["cip.pdf"]["id"]
    income_id = by_label["bulletin.pdf"]["id"]

    assert client.patch(
        f"/api/admin/documents/{identity_id}/verify",
        headers=tenant_headers,
        json={"status": "approved"},
    ).status_code == 403
    approved = client.patch(f"/api/admin/documents/{identity_id}/verify", headers=admin_headers, json={"status": "approved"})
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    rejected = client.patch(f"/api/admin/documents/{income_id}/verify", headers=admin_headers, json={"status": "rejected"})
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert client.patch(f"/api/admin/documents/{identity_id}/verify", headers=admin_headers, json={"status": "pending"}).status_code == 422

    refreshed = client.get("/api/me/pass", headers=tenant_headers).json()
    statuses = {document["label"]: document["status"] for document in refreshed["documents"]}
    assert statuses["cip.pdf"] == "approved"
    assert statuses["bulletin.pdf"] == "rejected"

    me = client.get("/api/auth/me", headers=tenant_headers).json()
    assert me["fileCompletionPercent"] == 100

    download = client.get(f"/api/me/documents/{identity_id}/download", headers=tenant_headers)
    assert download.status_code == 200
    assert download.content.startswith(b"%PDF-1.4")
    assert client.get("/api/admin/documents", headers=tenant_headers).status_code == 403
    assert len(client.get("/api/admin/documents", headers=admin_headers).json()) == 2


def test_tenant_application_review_flow(client):
    tenant_token = register(client, "apply-tenant@example.com", "tenant")
    landlord_token = register(client, "apply-landlord@example.com", "landlord")
    tenant_headers = {"Authorization": f"Bearer {tenant_token}"}
    landlord_headers = {"Authorization": f"Bearer {landlord_token}"}

    created = client.post("/api/apartments", headers=landlord_headers, json={
        "title": "Studio apply", "description": "Test", "type": "studio", "price": 80000,
        "charges": 5000, "surface": 25, "rooms": 1, "bedrooms": 1,
        "street": "Akpakpa", "city": "Cotonou",
    })
    assert created.status_code == 201, created.text
    apartment_id = created.json()["id"]
    promote_to_admin("apply-landlord@example.com")
    assert client.patch(f"/api/admin/apartments/{apartment_id}/moderation?action=approve", headers=landlord_headers).status_code == 200

    assert client.get("/api/landlord/applications", headers=tenant_headers).status_code == 403
    assert client.post(
        f"/api/apartments/{apartment_id}/applications",
        headers=landlord_headers,
        json={"monthlyIncome": 600000, "situation": "Salarié"},
    ).status_code == 403

    application = client.post(f"/api/apartments/{apartment_id}/applications", headers=tenant_headers, json={
        "monthlyIncome": 600000, "guarantorIncome": 300000, "situation": "Salarié",
        "message": "Je suis intéressé(e) par ce logement.",
    })
    assert application.status_code == 201, application.text
    body = application.json()
    assert body["status"] == "pending"
    # ratio = (600000 + 300000) / (80000 + 5000) => vert
    assert body["solvabilityScore"] == "green"
    application_id = body["id"]

    duplicate = client.post(f"/api/apartments/{apartment_id}/applications", headers=tenant_headers, json={
        "monthlyIncome": 600000, "situation": "Salarié",
    })
    assert duplicate.status_code == 409

    landlord_view = client.get("/api/landlord/applications", headers=landlord_headers).json()
    assert any(item["id"] == application_id for item in landlord_view)
    assert any(item["id"] == application_id for item in client.get("/api/me/applications", headers=tenant_headers).json())

    assert client.patch(f"/api/applications/{application_id}/status", headers=tenant_headers, json={"status": "accepted"}).status_code == 403
    assert client.patch(f"/api/applications/{application_id}/status", headers=landlord_headers, json={"status": "invalid"}).status_code == 422
    pre_validated = client.patch(f"/api/applications/{application_id}/status", headers=landlord_headers, json={"status": "pre_validated"})
    assert pre_validated.status_code == 200, pre_validated.text
    assert pre_validated.json()["status"] == "pre_validated"



def test_apartment_booking_and_favorites(client):
    tenant_token = register(client, "tenant@example.com")
    landlord_token = register(client, "landlord@example.com", "landlord")
    apartment = client.post("/api/apartments", headers={"Authorization": f"Bearer {landlord_token}"}, json={
        "title": "Test apartment", "description": "For API tests", "type": "apartment",
        "price": 150000, "charges": 10000, "surface": 50, "rooms": 2, "bedrooms": 1,
        "street": "Rue de test", "city": "Cotonou", "zipCode": "",
        "availableSlots": [{"date": "2030-01-01", "startTime": "09:00", "endTime": "09:30"}],
    })
    assert apartment.status_code == 201, apartment.text
    apartment_id = apartment.json()["id"]
    promote_to_admin("landlord@example.com")
    approval = client.patch(f"/api/admin/apartments/{apartment_id}/moderation?action=approve", headers={"Authorization": f"Bearer {landlord_token}"})
    assert approval.status_code == 200, approval.text

    listed = client.get("/api/apartments")
    assert listed.status_code == 200
    assert any(item["id"] == apartment_id for item in listed.json())

    headers = {"Authorization": f"Bearer {tenant_token}"}
    slot = client.get(f"/api/apartments/{apartment_id}/slots").json()[0]
    booking_url = f"/api/apartments/{apartment_id}/slots/{slot['id']}/book"
    assert client.post(booking_url, headers=headers).status_code == 201
    assert client.post(booking_url, headers=headers).status_code == 409

    favorite_url = f"/api/apartments/{apartment_id}/favorite"
    assert client.put(favorite_url, headers=headers).json()["favorited"] is True
    assert client.get("/api/me/favorites", headers=headers).json() == [apartment_id]
    assert client.put(favorite_url, headers=headers).json()["favorited"] is False


def test_tenant_cannot_publish_apartment(client):
    token = register(client, "tenant-publish@example.com")
    response = client.post("/api/apartments", headers={"Authorization": f"Bearer {token}"}, json={
        "price": 100000, "surface": 20, "street": "Rue test", "city": "Cotonou",
    })
    assert response.status_code == 403


def test_registration_persists_beninese_phone_and_lists_landlord_apartments(client):
    response = client.post("/api/auth/register", json={
        "firstName": "Sophie", "lastName": "Martin", "email": "phone-check@example.com",
        "phone": "+2290123456789", "password": "secure-password", "role": "landlord",
    })
    assert response.status_code == 201, response.text
    result = response.json()
    assert result["user"]["phone"] == "+2290123456789"
    headers = {"Authorization": f"Bearer {result['token']}"}

    assert client.get("/api/me/apartments", headers=headers).json() == []
    listing = client.post("/api/apartments", headers=headers, json={
        "price": 120000, "surface": 40, "street": "Rue test", "city": "Cotonou",
    })
    assert listing.status_code == 201, listing.text
    own_listings = client.get("/api/me/apartments", headers=headers)
    assert own_listings.status_code == 200
    assert [item["id"] for item in own_listings.json()] == [listing.json()["id"]]


def test_registration_rejects_invalid_beninese_phone(client):
    response = client.post("/api/auth/register", json={
        "firstName": "Test", "lastName": "User", "email": "bad-phone@example.com",
        "phone": "+2291234", "password": "secure-password", "role": "tenant",
    })
    assert response.status_code == 422


def test_visitor_catalog_detail_moderation_and_messaging(client):
    tenant_token = register(client, "message-tenant@example.com")
    landlord_token = register(client, "message-landlord@example.com", "landlord")
    admin_token = register(client, "phase-admin@example.com", "landlord")
    headers_tenant = {"Authorization": f"Bearer {tenant_token}"}
    headers_landlord = {"Authorization": f"Bearer {landlord_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    payload = {"title": "Maison de test", "description": "Test", "type": "house", "price": 180000, "surface": 60, "rooms": 3, "bedrooms": 2, "street": "Cadjehoun", "city": "Cotonou"}
    created = client.post("/api/apartments", headers=headers_landlord, json=payload)
    assert created.status_code == 201, created.text
    apartment_id = created.json()["id"]

    visitor_catalog = client.get("/api/apartments?limit=100&skip=6")
    assert visitor_catalog.status_code == 200
    assert len(visitor_catalog.json()) <= 6
    assert client.get(f"/api/apartments/{apartment_id}").status_code == 404
    assert client.post(f"/api/apartments/{apartment_id}/messages", headers=headers_tenant, json={"content": "Bonjour"}).status_code == 404

    assert client.get("/api/admin/apartments", headers=headers_landlord).status_code == 403
    promote_to_admin("phase-admin@example.com")
    assert client.get("/api/admin/apartments", headers=headers_admin).status_code == 200
    approved = client.patch(f"/api/admin/apartments/{apartment_id}/moderation?action=approve", headers=headers_admin)
    assert approved.status_code == 200
    public_detail = client.get(f"/api/apartments/{apartment_id}")
    assert public_detail.status_code == 200, public_detail.text
    assert public_detail.json()["id"] == apartment_id
    for index in range(7):
        extra = client.post("/api/apartments", headers=headers_landlord, json={**payload, "title": f"Annonce {index}"})
        assert extra.status_code == 201
        extra_id = extra.json()["id"]
        assert client.patch(f"/api/admin/apartments/{extra_id}/moderation?action=approve", headers=headers_admin).status_code == 200
    assert len(client.get("/api/apartments?limit=100").json()) <= 6
    assert len(client.get("/api/apartments?limit=100&skip=6").json()) <= 6
    message = client.post(f"/api/apartments/{apartment_id}/messages", headers=headers_tenant, json={"content": "Bonjour, le bien est-il disponible ?"})
    assert message.status_code == 201, message.text
    conversations = client.get("/api/me/conversations", headers=headers_landlord)
    assert conversations.status_code == 200
    conversation = conversations.json()[0]
    thread_path = f"/api/conversations/{apartment_id}/{conversation['otherUserId']}/messages"
    assert client.get(thread_path, headers=headers_landlord).status_code == 200
    reply = client.post(thread_path, headers=headers_landlord, json={"content": "Oui, il est disponible."})
    assert reply.status_code == 201, reply.text

    blocked = client.patch(f"/api/admin/users/{conversation['otherUserId']}/block?blocked=true", headers=headers_admin)
    assert blocked.status_code == 200
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {tenant_token}"}).status_code == 403


def test_normalized_conversation_endpoints_and_admin_aliases(client):
    tenant_token = register(client, "normalized-tenant@example.com")
    landlord_token = register(client, "normalized-landlord@example.com", "landlord")
    admin_token = register(client, "normalized-admin@example.com", "landlord")
    tenant_headers = {"Authorization": f"Bearer {tenant_token}"}
    landlord_headers = {"Authorization": f"Bearer {landlord_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    promote_to_admin("normalized-admin@example.com")

    neighborhood = client.post("/api/admin/quartiers", headers=admin_headers, json={"nom": "Haie Vive test", "arrondissement": "1er arrondissement"})
    assert neighborhood.status_code == 201, neighborhood.text
    assert any(item["id"] == neighborhood.json()["id"] for item in client.get("/api/quartiers").json())
    created = client.post("/api/apartments", headers=landlord_headers, json={
        "title": "Logement normalisé", "description": "Test schéma", "type": "apartment", "price": 200000,
        "surface": 70, "rooms": 3, "bedrooms": 2, "street": "Haie Vive", "city": "Cotonou",
        "quartierId": neighborhood.json()["id"], "photos": ["https://example.test/photo.jpg"],
    })
    assert created.status_code == 201, created.text
    listing_id = created.json()["id"]
    assert client.patch(f"/api/admin/apartments/{listing_id}/moderation?action=approve", headers=admin_headers).status_code == 200
    with SessionLocal() as db:
        assert db.query(PhotoLogement).filter_by(logement_id=listing_id).count() == 1

    first = client.post("/api/conversations", headers=tenant_headers, json={"apartmentId": listing_id})
    second = client.post("/api/conversations", headers=tenant_headers, json={"apartmentId": listing_id})
    assert first.status_code == second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    conversation_id = first.json()["id"]
    sent = client.post("/api/messages", headers=tenant_headers, json={"conversationId": conversation_id, "content": "Bonjour, je souhaite visiter."})
    assert sent.status_code == 201, sent.text
    assert sent.json()["conversationId"] == conversation_id
    assert client.get("/api/conversations", headers=landlord_headers).json()[0]["id"] == conversation_id
    thread = client.get(f"/api/conversations/{conversation_id}/messages", headers=landlord_headers)
    assert thread.status_code == 200 and thread.json()[0]["isRead"] is True
    reply = client.post("/api/messages", headers=landlord_headers, json={"conversationId": conversation_id, "content": "Bien reçu."})
    assert reply.status_code == 201, reply.text
    assert len(client.get(f"/api/conversations/{conversation_id}/messages", headers=tenant_headers).json()) == 2
    assert client.post("/api/conversations", headers=landlord_headers, json={"apartmentId": listing_id}).status_code == 403

    assert client.get("/api/admin/logements", headers=admin_headers).status_code == 200
    assert client.get("/api/admin/users", headers=admin_headers).status_code == 200
    blocked = client.put(f"/api/admin/users/{client.get('/api/admin/users', headers=admin_headers).json()[0]['id']}/status", headers=admin_headers, json={"status": "blocked"})
    assert blocked.status_code == 200
    assert blocked.json()["status"] == "blocked"
    assert client.delete(f"/api/admin/logements/{listing_id}", headers=admin_headers).status_code == 204
