import sys
import os
import pytest
from starlette.testclient import TestClient

# Ensure apps/api is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.main import app

client = TestClient(app)

def test_cors_preflight_regcompiler_app():
    """Verify preflight OPTIONS request for https://www.regcompiler.app returns 200 with proper CORS headers."""
    response = client.options(
        "/api/v1/regulations/frameworks",
        headers={
            "Origin": "https://www.regcompiler.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://www.regcompiler.app"
    assert "GET" in response.headers.get("access-control-allow-methods", "")
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_preflight_apex_domain():
    """Verify preflight OPTIONS request for apex domain https://regcompiler.app returns 200."""
    response = client.options(
        "/api/v1/regulations/frameworks",
        headers={
            "Origin": "https://regcompiler.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type,x-idempotency-key",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://regcompiler.app"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_get_frameworks_with_origin():
    """Verify actual GET /api/v1/regulations/frameworks emits Access-Control-Allow-Origin matching client origin."""
    response = client.get(
        "/api/v1/regulations/frameworks",
        headers={"Origin": "https://www.regcompiler.app"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://www.regcompiler.app"
    assert response.headers.get("access-control-allow-credentials") == "true"
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_cors_validation_error_preserves_origin():
    """Verify validation 422 error preserves CORS headers with client origin."""
    # Sending invalid payload to trigger 422
    response = client.post(
        "/api/v1/team/invite",
        json={"invalid_field": 123},
        headers={
            "Origin": "https://www.regcompiler.app",
            "Content-Type": "application/json"
        }
    )
    # Could be 401 or 422, but either way it should have Access-Control-Allow-Origin
    assert response.headers.get("access-control-allow-origin") == "https://www.regcompiler.app"
    assert response.headers.get("access-control-allow-credentials") == "true"
