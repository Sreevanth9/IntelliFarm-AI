# IntelliFarm AI 🌱🚜

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3_Storage-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/s3/)
[![AWS App Runner](https://img.shields.io/badge/AWS-App_Runner-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/apprunner/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-FF9900?logo=aws-amplify&logoColor=white)](https://aws.amazon.com/amplify/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**IntelliFarm AI** is a smart cloud agriculture platform designed to empower farmers with precision AI diagnostics, weather intelligence, and scalable cloud storage. Built with **React.js**, **Node.js Express**, and **Amazon Web Services (AWS)**.

---

## 🚀 Core Technology Stack

- **Frontend (React.js)**:
  - React 18, React Router v6, Redux Toolkit, Framer Motion
  - Lucide Icons, Vanilla CSS Design System with dark/light themes
  - Interactive **AWS Cloud Architecture Map & S3 Upload Tester** badge
- **Backend (Node.js & Express)**:
  - Node.js ES Modules, RESTful API architecture
  - **AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)**
  - Robust security: Helmet HSTS, Rate Limiters, CSRF protection, CORS
  - High-performance Server-Sent Events (SSE) AI streaming
- **Cloud & Storage (Amazon Web Services - AWS)**:
  - **Amazon S3**: Object storage for plant pathology scans, soil reports, and avatars
  - **AWS S3 Pre-signed URLs**: Direct browser-to-S3 secure uploads
  - **AWS App Runner / ECS**: Containerized Docker microservice deployment
  - **AWS Amplify / CloudFront**: High-speed CDN frontend distribution
- **Database & Intelligence**:
  - PostgreSQL / Supabase, Groq Qwen Vision AI & LLMs, OpenWeather API

---

## 🏛️ Architecture Overview

```text
IntelliFarm-AI/
├── client/                          # React.js SPA Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AwsCloudBadge/       # Interactive AWS Cloud Modal & S3 Tester
│   │   │   └── Navbar.tsx           # Topbar with AWS Cloud status badge
│   │   ├── pages/                   # DiseaseDetection, Dashboard, Profile, Weather
│   │   └── services/
│   │       └── awsApi.js            # Frontend client for AWS S3 and cloud endpoints
├── server/                          # Node.js + Express API Backend
│   ├── config/
│   │   └── aws.js                   # AWS SDK v3 Client & Region Configuration
│   ├── controllers/
│   │   ├── awsController.js         # S3 Upload, Presigned URLs, Status endpoints
│   │   └── cropController.js        # Crop AI + Amazon S3 archive integration
│   ├── routes/
│   │   └── awsRoutes.js             # /api/aws/status, /api/aws/s3/upload
│   └── services/
│       └── s3Service.js             # PutObject, GetSignedUrl, S3 health checks
├── Dockerfile                       # Multi-stage container build for AWS App Runner / ECS
├── docker-compose.yml               # Local & containerized cloud orchestration
├── amplify.yml                      # CI/CD specification for AWS Amplify
├── AWS_ARCHITECTURE.md              # Deep-dive AWS Architecture & Interview Guide
└── README.md
```

---

## 📦 Quick Start & Local Setup

### 1. Prerequisites
- Node.js 20+
- (Optional) AWS account for live S3 uploads (app includes built-in mock fallback)

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm start
```
The React app will be live at `http://localhost:3000` and communicate with Node.js at `http://localhost:5001`.

---

## ☁️ AWS Cloud Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/aws/status` | Returns AWS Cloud Infrastructure, Region, and S3 status |
| `POST` | `/api/aws/s3/upload` | Uploads leaf photos / files to Amazon S3 |
| `POST` | `/api/aws/s3/presigned-url` | Generates a time-limited AWS S3 PUT pre-signed URL |
| `GET` | `/api/aws/s3/download-url` | Generates a secure pre-signed GET download URL |

---

## 🚢 Deploying to AWS

Detailed step-by-step instructions for deploying to **AWS App Runner** and **AWS Amplify** are documented in [AWS_ARCHITECTURE.md](file:///Users/sreevanthv/Downloads/IntelliFarm-AI/AWS_ARCHITECTURE.md).

---

## 📄 License
This project is open source and available under the ISC License.
