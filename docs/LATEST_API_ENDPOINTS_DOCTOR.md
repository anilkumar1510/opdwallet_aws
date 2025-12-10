# Doctor Portal API Endpoints

This document lists all API endpoints used by the Doctor Portal (web-doctor).

---

## Doctor Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/doctor/login | Doctor login with credentials |
| POST | /auth/doctor/logout | Doctor logout |
| GET | /auth/doctor/profile | Get doctor profile |
| PATCH | /auth/doctor/profile | Update doctor profile |

---

## Doctor Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctor/appointments/counts | Get appointment counts by date |
| GET | /doctor/appointments/today | Get today's appointments |
| GET | /doctor/appointments/date/:date | Get appointments by date |
| GET | /doctor/appointments/upcoming | Get upcoming appointments |
| GET | /doctor/appointments/:appointmentId | Get appointment details |
| PATCH | /doctor/appointments/:appointmentId/complete | Mark appointment complete |
| PATCH | /doctor/appointments/:appointmentId/confirm | Confirm appointment |

---

## Digital Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/digital-prescriptions | Create digital prescription |
| PATCH | /doctor/digital-prescriptions/:prescriptionId | Update digital prescription |
| GET | /doctor/digital-prescriptions | Get doctor's digital prescriptions |
| GET | /doctor/digital-prescriptions/:prescriptionId | Get prescription details |
| POST | /doctor/digital-prescriptions/:prescriptionId/generate-pdf | Generate prescription PDF |
| GET | /doctor/digital-prescriptions/:prescriptionId/download-pdf | Download prescription PDF |
| DELETE | /doctor/digital-prescriptions/:prescriptionId | Delete prescription |

---

## Uploaded Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /doctor/prescriptions/upload | Upload prescription file |
| GET | /doctor/prescriptions | Get doctor's uploaded prescriptions |
| GET | /doctor/prescriptions/:prescriptionId | Get prescription details |
| GET | /doctor/prescriptions/:prescriptionId/download | Download prescription file |
| DELETE | /doctor/prescriptions/:prescriptionId | Delete prescription |

---

## Video Consultations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /video-consultations/start | Start video consultation (doctor) |
| POST | /video-consultations/:consultationId/end | End consultation |
| GET | /video-consultations/:consultationId/status | Get consultation status |
| GET | /video-consultations/doctor/history | Get doctor's consultation history |

---

## Medical Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /medicines/search | Search medicines by query |
| GET | /diagnoses/search | Search diagnoses by query |
| GET | /diagnoses/categories | Get diagnosis categories |
| GET | /symptoms/search | Search symptoms by query |
| GET | /symptoms/categories | Get symptom categories |

---

## Appointments (Read-only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /appointments/:appointmentId | Get appointment details |

---

**Total Endpoints: ~30**
