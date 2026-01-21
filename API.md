# API Documentation

Base URL: `http://localhost:3001` (Development)

## Authentication (`/auth`)

### Register
Create a new user account.
*   **URL**: `/auth/register`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "aman@example.com",
      "password": "securePassword123",
      "name": "Aman Adhikari"
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "access_token": "jwt_token_string",
      "user": { "id": "uuid", "email": "...", "name": "..." }
    }
    ```

### Login
Authenticate an existing user.
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "email": "aman@example.com",
      "password": "securePassword123"
    }
    ```
*   **Response**: `200 OK` (Same as Register)

---

## Rooms (`/rooms`)

### Create Room
Create a new meeting room. **Requires Authentication.**
*   **URL**: `/rooms`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Body**:
    ```json
    {
      "name": "Daily Standup"
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "id": "room-uuid",
      "name": "Daily Standup",
      "hostId": "user-uuid",
      "createdAt": "..."
    }
    ```

### Get Room Details
Fetch public metadata for a room (e.g., checks if room exists for guests).
*   **URL**: `/rooms/:id`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    {
      "id": "room-uuid",
      "name": "Daily Standup",
      "hostId": "user-uuid"
    }
    ```
*   **Response**: `404 Not Found` if room doesn't exist.

### Delete Room
Permanently delete a room. **Requires Authentication (Host only).**
*   **URL**: `/rooms/:id`
*   **Method**: `DELETE`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response**: `200 OK`

### Invite User
Send an email invitation. **Requires Authentication.**
*   **URL**: `/rooms/invite`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Body**:
    ```json
    {
      "roomId": "room-uuid",
      "email": "guest@example.com"
    }
    ```
*   **Response**: `201 Created`
