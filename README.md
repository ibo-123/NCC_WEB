# 🚀 NCC_MSJ — Full-Stack Club Management Platform

> **NCC_MSJ** is a modern, secure, and scalable **full-stack web platform** designed to manage a university tech club ecosystem — including **members, attendance, achievements, courses, and admin operations** — all in one professional system.

Built with **Node.js, Express, MongoDB, and Next.js**, this platform follows **industry-grade architecture** and **security best practices** used in real SaaS products.

---

## 🌟 Features

### 🔐 Authentication & Security

- JWT-based login & registration system
- Password hashing with **bcrypt**
- Role-based access control (**Admin / Member**)
- Protected API routes
- Secure environment variables

### 👥 Member Management

- View and manage club members
- Update user profiles
- Delete users (Admin only)
- Role enforcement system

### 📊 Smart Dashboard

- Personalized user dashboard
- Attendance percentage calculation
- Achievement tracking
- Secure user data display

### 📝 Attendance System

- Event-based attendance tracking
- Duplicate attendance prevention
- Admin-controlled marking
- Attendance analytics

### 🏆 Achievements System

- Admin-controlled achievement creation
- User-based achievement viewing
- Timestamped recognition records

### 📚 Course Platform

- Add, update, and delete courses (Admin)
- Learning resources system
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
