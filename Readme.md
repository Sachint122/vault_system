# File Vault API

A production-ready File Vault REST API built with Node.js, Express.js, and MongoDB featuring SHA-256 based file deduplication, occurrence tracking, and optimized storage management.

---

# Project Setup

This project was scaffolded using my custom CLI package [devil-backend-nodejs](https://www.npmjs.com/package/devil-backend-nodejs), `npx devil-backend-nodejs vault_system` which automates production-ready backend architecture setup and reduces repetitive backend engineering tasks.

The CLI helped standardize:

* Scalable folder structure
* Express server setup
* MongoDB configuration
* Middleware architecture
* Error handling utilities
* Authentication-ready structure
* Production-oriented backend patterns

This significantly improved development speed, maintainability, and consistency across projects.

---

# Features

## SHA-256 File Deduplication

Every uploaded file is hashed using SHA-256 before permanent storage.

If the same file is uploaded again:

* The file is NOT stored physically again
* Existing metadata is reused
* `occurrenceCount` is incremented

This prevents redundant storage usage and optimizes disk utilization.

---

## Occurrence-Based File Deletion

Deletion logic is reference-count based.

### Behavior:

* If `occurrenceCount > 1`

  * Only occurrence count is decremented
  * Physical file remains stored

* If `occurrenceCount === 1`

  * Physical file is permanently deleted
  * MongoDB metadata is removed

This ensures safe and optimized file lifecycle management.

---

## Optimized Storage Tracking

The API tracks:

* Total unique stored files
* Total occupied storage size
* Human-readable storage statistics

Duplicate uploads do NOT increase storage usage.

---

# Tech Stack

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* Multer
* Crypto (SHA-256)

---

# Installation & Setup

## Clone Repository

```bash
git clone https://github.com/Sachint122/vault_system.git
cd vault_system
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/vault_system
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

---

## Run Development Server

```bash
npm run dev
```

---

## Run Production Server

```bash
npm start
```

---

# API Endpoints

## Upload File

POST `/files`

Uploads a file and performs SHA-256 duplicate detection.

---

## Get Files

GET `/files`

Returns:

* File metadata
* occurrenceCount
* totalOccupiedSize
* readable storage statistics

---

## Delete File

DELETE `/files/:id`

Performs occurrence-based deletion logic.

---

# Response Features

* Clean production-ready API responses
* Human-readable file sizes
* Optimized serialization
* Frontend-friendly response formatting
* Secure internal field hiding

---

# Architecture Highlights

* Modular backend architecture
* Centralized error handling
* Reusable utilities
* Async handler pattern
* Validation-ready structure
* Production-oriented response handling
* Scalable code organization

---

# Bonus Architecture Support

The backend scaffold generated through `devil-backend-nodejs` already includes JWT authentication utilities, auth middleware support, validation structure, and production-ready security patterns.

Although authentication was marked as an optional bonus requirement in the assignment, the File Vault APIs were intentionally kept publicly accessible to simplify evaluation, testing, and API verification workflow.

The architecture is already auth-ready and can be extended to protected routes without major structural changes.

---

# Storage Note

This implementation currently uses local filesystem storage for assignment simplicity and faster development.

Since platforms like Render use ephemeral storage, uploaded files may not persist across redeployments or instance restarts.

For production-grade scalability, cloud object storage solutions such as:

* AWS S3
* Cloudinary

would be preferred.

---

# Future Improvements

* Cloud storage integration
* File streaming
* Background cleanup jobs
* Role-based access control
* File access permissions
* Swagger/OpenAPI documentation
* Redis caching
* Queue-based processing

---

# Live Deployment

Render URL:

[https://vault-system.onrender.com/](https://vault-system.onrender.com/)

---

# Author

Sachin Tiwari

GitHub:
[https://github.com/Sachint122](https://github.com/Sachint122)
