import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_root_redirect():
    response = client.get("/")
    assert response.status_code == 307  # Temporary redirect
    assert response.headers["location"] == "/static/index.html"


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    
    # Test some basic properties of the activities
    assert isinstance(activities, dict)
    assert len(activities) > 0
    
    # Test structure of an activity
    activity = list(activities.values())[0]
    assert "description" in activity
    assert "schedule" in activity
    assert "max_participants" in activity
    assert "participants" in activity
    assert isinstance(activity["participants"], list)


def test_signup_for_activity():
    activity_name = "Chess Club"
    email = "test@mergington.edu"
    
    # Try to sign up
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    
    # Verify the participant was added
    activities = client.get("/activities").json()
    assert email in activities[activity_name]["participants"]


def test_signup_for_nonexistent_activity():
    response = client.post("/activities/NonexistentClub/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_from_activity():
    # First, sign up a test participant
    activity_name = "Programming Class"
    email = "test_unregister@mergington.edu"
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Then try to unregister
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 200
    
    # Verify the participant was removed
    activities = client.get("/activities").json()
    assert email not in activities[activity_name]["participants"]


def test_unregister_from_nonexistent_activity():
    response = client.post("/activities/NonexistentClub/unregister?email=test@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_nonexistent_participant():
    response = client.post("/activities/Chess Club/unregister?email=nonexistent@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"


@pytest.mark.asyncio
async def test_max_participants_limit():
    activity_name = "Chess Club"
    activities_response = await client.get("/activities")
    activities = activities_response.json()
    
    # Get the max participants for Chess Club
    max_participants = activities[activity_name]["max_participants"]
    current_participants = len(activities[activity_name]["participants"])
    
    # Try to fill up the activity
    for i in range(max_participants - current_participants + 1):
        email = f"test{i}@mergington.edu"
        response = await client.post(f"/activities/{activity_name}/signup?email={email}")
        
        if i < max_participants - current_participants:
            assert response.status_code == 200
        else:
            # This should fail as we're exceeding the limit
            assert response.status_code == 400
            assert "Activity is full" in response.json()["detail"]