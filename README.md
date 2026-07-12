# AssetFlow 🏢

**AssetFlow** — Enterprise Asset & Resource Management System

A full-stack web application for managing enterprise assets, bookings, and resource allocation with real-time conflict detection.

## 🚀 Features

- **Asset Management** — Track and manage all enterprise assets
- **Booking System** — Schedule and manage asset bookings
- **Conflict Detection** — Real-time UI conflict simulation for booking screen
- **FastAPI Backend** — High-performance Python REST API
- **Database Schema** — Structured SQL schema for asset and resource data

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, FastAPI |
| Database | SQL (schema.sql) |

## 📁 Project Structure

```
AssetFlow/
├── index.html        # Main frontend UI
├── index.css         # Styles
├── app.js            # Frontend logic
├── schema.sql        # Database schema
└── backend/
    ├── main.py       # FastAPI app entry point
    ├── models.py     # Database models
    ├── schemas.py    # Pydantic schemas
    ├── crud.py       # CRUD operations
    └── seed_db.py    # Database seeding script
```

## ⚙️ Getting Started

### Backend
```bash
cd backend
pip install fastapi uvicorn sqlalchemy
uvicorn main:app --reload
```

### Frontend
Open `index.html` in your browser or serve with a local server.
