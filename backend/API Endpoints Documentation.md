# AdsNetwork API Endpoints Documentation

This document outlines the available endpoints for the AdsNetwork backend service.

## Base URL
```
http://localhost:8080
```

## Authentication
Most endpoints require authentication using a JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Health Check
```
GET /health
```
Verifies if the backend service is operational.

## Authentication Endpoints

### Register User
```
POST /auth/register
```
**Request Body:**
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "securepassword",
  "location": {
    "name": "Colombo",
    "lat": 6.9271,
    "lng": 79.8612,
    "geohash": "tc2m4z0f0"
  },
  "phone": "+94771234567"
}
```
**Response:** User details with JWT token

### Login
```
POST /auth/login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "location": {
    "name": "Kandy",
    "lat": 7.2906,
    "lng": 80.6337,
    "geohash": "tc31k23wn"
  }
}
```
**Response:** JWT token and user details

### Get User Profile
```
GET /auth/profile
```
**Headers:** Authorization token required  
**Response:** User profile information

## Advertisement Endpoints

### Create Advertisement
```
POST /advertisements
```
**Headers:** Authorization token required  
**Request Body:**
```json
{
  "title": "iPhone 13 Pro Max",
  "description": "Excellent condition, lightly used, box and charger included.",
  "price": "999.99",
  "location": {
    "name": "Colombo",
    "lat": 6.9271,
    "lng": 79.8612,
    "geohash": "tc2m4z0f0"
  },
  "category": "Electronics",
  "userEmail": "user@example.com",
  "photoUrls": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ]
}
```
**Response:** Created ad details with ID

### Get All Advertisements
```
GET /advertisements
```
**Response:** List of all advertisements

### Get Advertisement by ID
```
GET /advertisements/{adId}
```
**Response:** Details of the specified advertisement

### Get User's Advertisements
```
GET /advertisements/my-ads
```
**Headers:** Authorization token required  
**Response:** List of the authenticated user's advertisements

### Update Advertisement
```
PUT /advertisements/{adId}
```
**Headers:** Authorization token required  
**Request Body:** Fields to update (any of title, description, price, location, category, photoUrls)  
**Response:** Updated ad details

### Delete Advertisement
```
DELETE /advertisements/{adId}
```
**Headers:** Authorization token required  
**Response:** Confirmation of deletion

## Comment Endpoints

### Create Comment
```
POST /comments
```
**Headers:** Authorization token required  
**Request Body:**
```json
{
  "ad_id": 1,
  "sentiment": "good",
  "description": "Great product! Very satisfied."
}
```
**Note:** Sentiment must be a valid value.  
**Response:** Created comment details

### Get All Comments
```
GET /comments
```
**Response:** List of all comments

### Get Comment by ID
```
GET /comments/{commentId}
```
**Response:** Details of the specified comment

### Get Comments for Advertisement
```
GET /comments/ad/{adId}
```
**Response:** List of comments for the specified advertisement

### Delete Comment
```
DELETE /comments/{commentId}
```
**Headers:** Authorization token required  
**Response:** Confirmation of deletion

## CORS Support
The API supports CORS with the following configuration:
- Allowed origins: All (`*`)
- Allowed methods: POST, OPTIONS, GET, PUT, DELETE
- Allowed headers: Authorization, Content-Type, Accept, Origin, X-Requested-With
- Credentials allowed: Yes
- Max age: 3600 seconds

## Error Responses
All endpoints return appropriate HTTP status codes:
- 200/201: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing or invalid token)
- 404: Not Found
- 500: Internal Server Error