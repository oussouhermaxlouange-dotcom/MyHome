import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

_database_dir = tempfile.TemporaryDirectory(prefix="myhome-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{_database_dir.name}/test.db"

from app.main import app  # noqa: E402 - set the isolated DB before importing the app

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
