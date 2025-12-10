# Doctor Portal Frontend Pages

This document lists all frontend pages/routes in the Doctor Portal (web-doctor).

---

## Authentication

| Path | Description |
|------|-------------|
| / | Root page (redirects to login) |
| /login | Doctor portal login page with email/password authentication |

---

## Dashboard

| Path | Description |
|------|-------------|
| /doctorview | Main doctor dashboard with today's appointments and statistics |

---

## Appointments

| Path | Description |
|------|-------------|
| /doctorview/appointments | View and manage all upcoming appointments |
| /doctorview/appointments/[appointmentId] | View detailed appointment information |

---

## Video Consultations

| Path | Description |
|------|-------------|
| /doctorview/consultations/[appointmentId] | Start and manage video consultation session |

---

## Prescriptions

| Path | Description |
|------|-------------|
| /doctorview/prescriptions | View all prescriptions (digital and uploaded) |
| /doctorview/prescriptions/[prescriptionId] | View prescription details with download option |

---

**Total Pages: 8**
