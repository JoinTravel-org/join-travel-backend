# Authentication API Documentation

## Overview

The Authentication Service provides secure endpoints for user account management, registration, email confirmation, and JWT-based authentication with refresh tokens, token revocation, and rate limiting.

**Base Path:** `/api/auth`

**Authentication Method:** JWT (JSON Web Tokens) with Bearer token in Authorization header

---

## JWT Authentication

The service uses JWT for stateless authentication with the following features:

- **Access Tokens:** Short-lived tokens (15 minutes) for API access
- **Refresh Tokens:** Long-lived tokens (7 days) for obtaining new access tokens
- **Token Revocation:** Secure logout by blacklisting tokens
- **Rate Limiting:** 10 requests per 15 minutes on auth endpoints
- **Secure Secrets:** Unique random secrets for access and refresh tokens

### Token Usage

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### GET /auth

Retrieves the authenticated user's profile information.

#### Request

**URL:** `/api/auth`

**Method:** `GET`

**Authentication:** Required (Bearer token)

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Error Responses:**

| Status Code | Error Message                          | Description                    |
|-------------|----------------------------------------|--------------------------------|
| 401         | `Access denied. No token provided.`    | Missing Authorization header   |
| 401         | `Token has been revoked.`              | Token is in revocation list    |
| 401         | `User not found. Token is invalid.`    | User associated with token not found |
| 401         | `Token expired. Please login again.`   | Access token has expired       |
| 401         | `Invalid token.`                       | Token is malformed             |
| 500         | Internal server error                  | An unexpected error occurred   |

#### Usage Examples

**cURL:**

```bash
curl -X GET http://localhost:8080/api/auth \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**JavaScript (Fetch):**

```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

fetch('http://localhost:8080/api/auth', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### POST /auth/login

Authenticates a user and returns JWT access and refresh tokens.

#### Request

**URL:** `/api/auth/login`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** Not required

**Rate Limited:** 10 requests per 15 minutes

**Body Parameters:**

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| email     | string | Yes      | User's email address           |
| password  | string | Yes      | User's password                |

**Example Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

**Error Responses:**

| Status Code | Error Message                              | Description                                    |
|-------------|--------------------------------------------|------------------------------------------------|
| 400         | `Email y contraseña son requeridos.`       | Email or password field is missing             |
| 401         | `Credenciales inválidas.`                  | Invalid email or password                      |
| 401         | `Por favor confirma tu email antes de iniciar sesión.` | Email not confirmed                            |
| 429         | `Too many authentication attempts...`      | Rate limit exceeded                            |
| 500         | Internal server error                      | An unexpected error occurred                   |

#### Usage Examples

**cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**JavaScript (Fetch):**

```javascript
fetch('http://localhost:8080/api/auth/login', {
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
  .then(data => {
    console.log(data);
    // Store tokens securely
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  })
  .catch(error => console.error('Error:', error));
```

---

### POST /auth/refresh

Refreshes an access token using a valid refresh token.

#### Request

**URL:** `/api/auth/refresh`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** Not required (uses refresh token in body)

**Body Parameters:**

| Parameter     | Type   | Required | Description                    |
|---------------|--------|----------|--------------------------------|
| refreshToken  | string | Yes      | Valid refresh token            |

**Example Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refrescado exitosamente.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

| Status Code | Error Message                              | Description                                    |
|-------------|--------------------------------------------|------------------------------------------------|
| 400         | `Refresh token es requerido.`              | Refresh token field is missing                 |
| 401         | `Refresh token inválido.`                  | Token is malformed or invalid                  |
| 401         | `Refresh token expirado.`                  | Refresh token has expired                      |
| 500         | Internal server error                      | An unexpected error occurred                   |

#### Usage Examples

**cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**JavaScript (Fetch):**

```javascript
const refreshToken = localStorage.getItem('refreshToken');

fetch('http://localhost:8080/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: refreshToken
  })
})
  .then(response => response.json())
  .then(data => {
    console.log(data);
    // Update stored tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  })
  .catch(error => console.error('Error:', error));
```

---

### POST /auth/logout

Revokes the current access token, effectively logging out the user.

#### Request

**URL:** `/api/auth/logout`

**Method:** `POST`

**Authentication:** Required (Bearer token in header)

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente."
}
```

**Error Responses:**

| Status Code | Error Message                          | Description                    |
|-------------|----------------------------------------|--------------------------------|
| 401         | `Access denied. No token provided.`    | Missing Authorization header   |
| 500         | Internal server error                  | An unexpected error occurred   |

#### Usage Examples

**cURL:**

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**JavaScript (Fetch):**

```javascript
const token = localStorage.getItem('accessToken');

fetch('http://localhost:8080/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(data);
    // Clear stored tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  })
  .catch(error => console.error('Error:', error));
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

3. **Login**
   - User calls `POST /auth/login` with confirmed email and password
   - Server validates credentials and returns access + refresh JWT tokens
   - Client stores tokens securely (e.g., localStorage, secure cookies)

4. **API Access**
   - Client includes access token in Authorization header for protected requests
   - Server validates token, checks revocation, and grants access
   - If access token expires, client uses refresh token to get new tokens

5. **Token Refresh**
   - When access token expires, client calls `POST /auth/refresh` with refresh token
   - Server validates refresh token and returns new access + refresh tokens
   - Client updates stored tokens

6. **Logout**
   - User calls `POST /auth/logout` with current access token
   - Server adds token to revocation list (blacklist)
   - Client clears stored tokens
   - Future requests with revoked token are denied

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

### JWT Security

- **Token Expiration:** Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Token Revocation:** Logout adds tokens to a blacklist stored in database
- **Secure Secrets:** Unique random secrets for access and refresh tokens (256-bit)
- **Rate Limiting:** 10 authentication attempts per 15 minutes per IP
- **Token Validation:** Server verifies token signature, expiration, and revocation on each request
- **Stateless Authentication:** No server-side sessions, tokens contain all necessary user info

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

Rate limiting is implemented on authentication endpoints (`/register`, `/login`) with the following limits:

- **Window:** 15 minutes
- **Max Requests:** 10 per IP address
- **Response:** 429 Too Many Requests with custom message

---

## Changelog

### Version 1.1.0 (Current)

- JWT authentication with access and refresh tokens
- Login endpoint with token generation
- Token refresh endpoint
- Secure logout with token revocation
- Protected routes with authentication middleware
- Rate limiting on auth endpoints (10 requests per 15 minutes)
- Unique random JWT secrets for production security
- Comprehensive test coverage for all auth features

### Version 1.0.0

- Initial release
- User registration endpoint
- Email confirmation endpoint
- Password validation
- Email validation
