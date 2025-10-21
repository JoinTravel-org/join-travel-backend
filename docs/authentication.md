# Authentication API Documentation

## Overview

The Authentication Service provides endpoints for user account management, registration, and email confirmation.

**Base Path:** `/api/auth`

---

## Endpoints

### GET /auth

Test endpoint to verify the authentication service is running.

#### Request

**URL:** `/api/auth`

**Method:** `GET`

**Authentication:** Not required

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": "Authentication service operational"
}
```

#### Usage Examples

**cURL:**

```bash
curl -X GET http://localhost:8080/api/auth
```

**JavaScript (Fetch):**

```javascript
fetch('http://localhost:8080/api/auth')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### POST /auth/register

Creates a new user account and sends an email confirmation link.

#### Request

**URL:** `/api/auth/register`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** Not required

**Body Parameters:**

| Parameter | Type   | Required | Description                    | Validation                                    |
|-----------|--------|----------|--------------------------------|-----------------------------------------------|
| email     | string | Yes      | User's email address           | Must be a valid email format                  |
| password  | string | Yes      | User's password                | See password requirements below               |

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>_-+=[]\/;'`~)

**Example Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Response

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Por favor revisa tu correo para confirmar tu cuenta.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "isEmailConfirmed": false,
    "createdAt": "2025-10-20T10:30:00.000Z",
    "updatedAt": "2025-10-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status Code | Error Message                                         | Description                                    |
|-------------|-------------------------------------------------------|------------------------------------------------|
| 400         | `Email y contraseña son requeridos.`                  | Email or password field is missing             |
| 400         | `Formato de correo inválido.`                         | Email format is invalid                        |
| 400         | `La contraseña no cumple con los requisitos.`         | Password doesn't meet security requirements    |
| 409         | `El email ya está en uso. Intente iniciar sesión.`    | An account with this email already exists      |
| 500         | Internal server error                                 | An unexpected error occurred                   |

**Example Error Response (Missing Fields):**

```json
{
  "success": false,
  "message": "Email y contraseña son requeridos."
}
```

**Example Error Response (Invalid Password):**

```json
{
  "success": false,
  "message": "La contraseña no cumple con los requisitos.",
  "errors": [
    "La contraseña debe tener al menos 8 caracteres",
    "La contraseña debe contener al menos una mayúscula",
    "La contraseña debe contener al menos un número"
  ]
}
```

**Example Error Response (Email Already Exists):**

```json
{
  "success": false,
  "message": "El email ya está en uso. Intente iniciar sesión."
}
```

#### Usage Examples

**cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**JavaScript (Fetch):**

```javascript
fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**JavaScript (Axios):**

```javascript
const axios = require('axios');

axios.post('http://localhost:8080/api/auth/register', {
  email: 'user@example.com',
  password: 'SecurePass123!'
})
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error.response.data));
```

**Python (Requests):**

```python
import requests

url = 'http://localhost:8080/api/auth/register'
data = {
    'email': 'user@example.com',
    'password': 'SecurePass123!'
}

response = requests.post(url, json=data)
print(response.json())
```

#### Notes

- Upon successful registration, a confirmation email will be sent to the provided email address
- The confirmation token is valid for 24 hours
- Users must confirm their email before accessing protected endpoints
- Passwords are hashed using bcrypt before storage
- Sensitive fields (password, confirmation token) are not included in the response

---

### GET /auth/confirm-email/:token

Confirms a user's email address using the token sent via email.

#### Request

**URL:** `/api/auth/confirm-email/:token`

**Method:** `GET`

**Authentication:** Not required

**URL Parameters:**

| Parameter | Type   | Required | Description                                         |
|-----------|--------|----------|-----------------------------------------------------|
| token     | string | Yes      | Email confirmation token received via email         |

**Example URL:**

```
http://localhost:8080/api/auth/confirm-email/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Email confirmado exitosamente."
}
```

**Error Responses:**

| Status Code | Error Message                                | Description                                    |
|-------------|----------------------------------------------|------------------------------------------------|
| 400         | `Token de confirmación inválido.`            | Token doesn't exist or is invalid              |
| 400         | `El token de confirmación ha expirado.`      | Token has expired (>24 hours old)              |
| 500         | Internal server error                        | An unexpected error occurred                   |

**Example Error Response (Invalid Token):**

```json
{
  "success": false,
  "message": "Token de confirmación inválido."
}
```

**Example Error Response (Expired Token):**

```json
{
  "success": false,
  "message": "El token de confirmación ha expirado."
}
```

#### Usage Examples

**cURL:**

```bash
curl -X GET http://localhost:8080/api/auth/confirm-email/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**JavaScript (Fetch):**

```javascript
const token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

fetch(`http://localhost:8080/api/auth/confirm-email/${token}`)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**JavaScript (Axios):**

```javascript
const axios = require('axios');
const token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

axios.get(`http://localhost:8080/api/auth/confirm-email/${token}`)
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error.response.data));
```

**Python (Requests):**

```python
import requests

token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
url = f'http://localhost:8080/api/auth/confirm-email/{token}'

response = requests.get(url)
print(response.json())
```

#### Notes

- The confirmation token is sent to the user's email after registration
- Tokens expire after 24 hours
- Once confirmed, the user's `isEmailConfirmed` field is set to `true`
- The token can only be used once
- After confirmation, the token is removed from the database

---

## Authentication Flow

1. **User Registration**
   - User calls `POST /auth/register` with email and password
   - Server validates input and creates user account
   - Server sends confirmation email with token
   - Server returns success response with user data (excluding sensitive fields)

2. **Email Confirmation**
   - User receives email with confirmation link containing token
   - User clicks link or calls `GET /auth/confirm-email/:token`
   - Server validates token and confirms email
   - User account is now active

3. **Future: Login** (Not yet implemented)
   - User can log in with confirmed email and password
   - Server returns JWT token for authenticated requests

---

## Security Considerations

### Password Security

- Passwords must meet minimum requirements (see POST /auth/register)
- Passwords are hashed using bcrypt with salt rounds of 10
- Plain text passwords are never stored or logged

### Email Confirmation

- Confirmation tokens are cryptographically secure random 32-byte strings
- Tokens expire after 24 hours
- Tokens are single-use and deleted after confirmation

### Data Protection

- Sensitive fields (passwords, tokens) are not included in API responses
- Input validation is performed on all endpoints
- SQL injection protection via TypeORM parameterized queries

---

## Common Issues and Solutions

### Issue: "Email already in use"

**Solution:** The email is already registered. Try logging in or use a different email address.

### Issue: "Token expired"

**Solution:** Request a new confirmation email (feature not yet implemented) or register again.

### Issue: "Invalid email format"

**Solution:** Ensure the email follows the standard format (<user@domain.com>).

### Issue: "Password doesn't meet requirements"

**Solution:** Ensure your password has:

- At least 8 characters
- One uppercase letter
- One number
- One special character

---

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

---

## Changelog

### Version 1.0.0 (Current)

- Initial release
- User registration endpoint
- Email confirmation endpoint
- Password validation
- Email validation
