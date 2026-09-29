from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_telemetry_flow():
    # 1. Test health check
    res = client.get("/health")
    assert res.status_code == 200
    print("Health check passed:", res.json())

    # 2. Test POST /telemetry
    payload = {
        "id": "S-001",
        "name": "Sensor Station S-001",
        "mineId": "jharkhand",
        "lat": 23.7512,
        "lng": 86.4215,
        "status": "SAFE",
        "tilt": 1.2,
        "displacement": 2.4,
        "vibration": "Normal",
        "crackStatus": "Normal",
        "battery": 92,
        "signal": 96,
        "riskScore": 18,
        "panel": "North Panel, Shaft 1",
        "lastSync": "Just now",
        "history": [
            {"time": "10:00", "tilt": 1.1, "displacement": 2.3, "riskScore": 17},
            {"time": "11:00", "tilt": 1.2, "displacement": 2.4, "riskScore": 18}
        ]
    }
    post_res = client.post("/telemetry", json=payload)
    assert post_res.status_code == 200
    print("POST /telemetry succeeded:", post_res.json())

    # 3. Test GET /nodes
    nodes_res = client.get("/nodes")
    assert nodes_res.status_code == 200
    data = nodes_res.json()
    print("GET /nodes succeeded:", f"Count = {data['count']}, Station S-001 Risk = {data['nodes'][0]['riskScore']}")
    assert data["count"] >= 1
    assert data["nodes"][0]["id"] == "S-001"
    assert data["nodes"][0]["tilt"] == 1.2

if __name__ == "__main__":
    test_telemetry_flow()
    print("ALL BACKEND TESTS PASSED!")
