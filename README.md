# 🚀 Competitive Programmers Tracker Platform

> **Competitive Programmers Tracker** is a modern, secure, and scalable **full-stack web platform** designed to manage competitive programming activities, events, and learning resources for users and teams.

Built with **Node.js, Express, MongoDB, and Next.js**, this platform follows **industry-grade architecture** and **security best practices** used in real SaaS products.

---

## 🌟 Features

### 🔐 Authentication & Security

- JWT-based login & registration system
- Password hashing with **bcrypt**
- Role-based access control (**Admin / Member**)
- Protected API routes
- Secure environment variables

### 👥 User Management

- View and manage platform users
- Update user profiles
- Delete users (Admin only)
- Role enforcement system

### 📊 Smart Dashboard

- Personalized user dashboard
- Contest participation tracking
- Achievement tracking
- Secure user data display

### 🏆 Contest System

- Contest-based event tracking
- Duplicate registration prevention
- Admin-controlled contest creation
- Contest analytics

### 🏅 Achievements System

- Admin-controlled achievement creation
- User-based achievement viewing
- Timestamped recognition records

### 📚 Course Platform

- Add, update, and delete courses (Admin)
- Programming learning resources system
- Course difficulty levels:
  - Beginner
  - Intermediate
  - Advanced

---

## 🧠 System Architecture

```text
Frontend (Next.js / React)
        ↓ Axios
Backend (Node.js + Express)
        ↓ Controllers
MongoDB (Mongoose Models)
