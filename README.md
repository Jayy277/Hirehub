# HireHub – Mini Internship & Freelance Portal

HireHub is a job and internship connection portal linking students and companies, with administrative oversight.

---

## Technical Stack
- **Frontend**: React (Vite) + Bootstrap 5 + Recharts
- **Backend**: Python + Flask (REST API)
- **Database**: MongoDB (using PyMongo client)
- **Authentication**: JSON Web Token (JWT)

---

## Directory Reorganization
The project is organized directly under:
- `backend/` - Flask API, models, routes, uploads, environment settings, and virtual environment.
- `frontend/` - Vite React App, page views, contexts, and style settings.

---

## 🚀 Getting Started

### 1. Database Requirement
Before running the backend, make sure **MongoDB** is installed and running on your local machine:
- Default connection URI: `mongodb://localhost:27017`
- If you use a custom cloud instance (like MongoDB Atlas), copy your connection string and use it in the `.env` file in the step below.

---

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd J:\Hirehub\backend
   ```
2. The virtual environment is already configured in `venv/`. To activate it on Windows:
   ```bash
   .\venv\Scripts\activate
   ```
3. (Optional) If you ever need to reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the environment:
   Create or modify the `.env` file in the `backend/` folder (a template `.env` is already created for you).
   Make sure to configure your SMTP settings for email notifications:
   ```ini
   MONGO_URI=mongodb://localhost:27017
   MONGO_DB_NAME=hirehub
   JWT_SECRET_KEY=super-secret-jwt-key-change-me
   
   # SMTP Email credentials (Gmail App Passwords or Mailtrap)
   MAIL_SERVER=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_username
   MAIL_PASSWORD=your_password
   MAIL_DEFAULT_SENDER=noreply@hirehub.com

   # Seeding Admin Credentials
   ADMIN_EMAIL=admin@hirehub.com
   ADMIN_PASSWORD=AdminPass123!
   ```
5. **Start the Backend Server**:
   ```bash
   python app.py
   ```
   *Note: On startup, the backend will check the database and **automatically seed** the default administrator account (if it doesn't already exist).*
   *Default Admin Seed: `admin@hirehub.com` / `AdminPass123!`*

---

### 3. Frontend Setup
1. Open a separate terminal and navigate to the `frontend` folder:
   ```bash
   cd J:\Hirehub\frontend
   ```
2. Dependencies are already installed (`npm install` has been run). To start the local development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the URL shown (usually `http://localhost:5173`).

---

## 🔒 Default Demo Accounts for Testing

To make verification easy, you can log in with:
1. **Admin account**:
   - Email: `admin@hirehub.com`
   - Password: `AdminPass123!`
2. **Student and Company Registration**:
   - Navigate to the **Register** page on the top right.
   - Choose the role (Student or Company) and create a test account.
   - Log in to experience their respective dashboard panels.
