"""Promote an existing trusted account to admin from the server environment."""
import argparse

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import User


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email", help="Email address of the existing account")
    email = parser.parse_args().email.strip().lower()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        account = db.scalar(select(User).where(User.email == email))
        if account is None:
            parser.error("Create the account first, then promote it.")
        account.role = "admin"
        db.commit()
    print(f"Administrator role assigned to {email}.")


if __name__ == "__main__":
    main()
