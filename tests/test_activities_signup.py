def test_signup_adds_new_participant(client):
    email = "new.student@mergington.edu"

    signup_response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": email},
    )

    assert signup_response.status_code == 200
    assert signup_response.json()["message"] == f"Signed up {email} for Chess Club"

    activities_response = client.get("/activities")
    participants = activities_response.json()["Chess Club"]["participants"]
    assert email in participants


def test_signup_unknown_activity_returns_404(client):
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_duplicate_registration_returns_400(client):
    existing_email = "michael@mergington.edu"

    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_blocks_when_activity_is_full_tdd(client):
    seed_response = client.get("/activities")
    chess_activity = seed_response.json()["Chess Club"]
    current_participants = chess_activity["participants"]
    max_participants = chess_activity["max_participants"]

    missing_spots = max_participants - len(current_participants)
    for index in range(missing_spots):
        fill_response = client.post(
            "/activities/Chess%20Club/signup",
            params={"email": f"filler{index}@mergington.edu"},
        )
        assert fill_response.status_code == 200

    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "overflow@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"
