# SevaMitr (सेवामित्र) — Rural Cognitive Healthcare & Dementia Telemetry Cloud Platform

[![Production Deployment](https://img.shields.io/badge/Vercel-Live%20Deployment-000000?style=for-the-badge&logo=vercel)](https://seva-mitr.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Android APK](https://img.shields.io/badge/Android%20App-v1.2.2%20Release-214935?style=for-the-badge&logo=android)](https://github.com/sainiks/northeast-dementia-care/releases/latest)

**SevaMitr** is a digital health platform designed for early cognitive screening, continuous biomarker tracking, and circadian sundowning detection in elderly patients living with dementia in rural and low-resource regions of India (including the North Eastern Region).

Coupled with the **Northeast Dementia Care Flutter App**, SevaMitr bridges the gap between rural household monitoring and specialist neurological care.

---

## 🌟 Live Links & Resources

- **Live Web Platform**: [https://seva-mitr.vercel.app](https://seva-mitr.vercel.app)
- **Caregiver Dashboard**: [https://seva-mitr.vercel.app/caregiver](https://seva-mitr.vercel.app/caregiver)
- **Patient Kiosk & Games**: [https://seva-mitr.vercel.app/patient](https://seva-mitr.vercel.app/patient)
- **Patient Directory & Registry**: [https://seva-mitr.vercel.app/caregiver/patients](https://seva-mitr.vercel.app/caregiver/patients)
- **Mobile App Repository**: [sainiks/northeast-dementia-care](https://github.com/sainiks/northeast-dementia-care)
- **Latest Android Release (APK)**: [Download v1.2.2 APK (56.2 MB)](https://github.com/sainiks/northeast-dementia-care/releases/latest)

---

## 📖 New User Guide: How to Sign Up, Connect & Sync

Whether you are a **Family Caregiver**, an **ASHA Healthcare Worker**, or a **Clinician**, follow this guide to set up your account and sync data between the mobile app and website.

### 🧭 Where Should You Sign Up First?

> **Recommendation**: Sign up on the **Website first (Path A)** on your laptop or phone, register your patient profile, and then log in to the mobile app with the same credentials.

```mermaid
flowchart LR
    subgraph Step1["1. Web Registration"]
        W_Sign["Sign up on Website<br/>(Phone + Password)"]
        W_Pat["Register Patient<br/>(Name, Age, District)"]
    end

    subgraph Step2["2. Mobile Linking"]
        M_DL["Install APK<br/>on Tablet/Phone"]
        M_Auth["Log in with same Phone<br/>in Caregiver Mode"]
        M_Adopt["Auto-Links Cloud Patient<br/>to Local SQLite"]
    end

    subgraph Step3["3. Games & Live Sync"]
        M_Play["Elderly Plays 11 Games<br/>(Offline or Online)"]
        M_Sync["2G Micro-Batch Upload<br/>to SevaMitr Cloud"]
        W_Live["Live Telemetry on Website<br/>(Radar Chart, Sundowning, DCI)"]
    end

    Step1 --> Step2 --> Step3
```

---

### Path A (Recommended): Website First

#### 1. Create your Caregiver Account on the Web
1. Visit **[https://seva-mitr.vercel.app/signup](https://seva-mitr.vercel.app/signup)**.
2. Fill in:
   - **Full Name**: (e.g., *Kunal Saini*)
   - **Phone Number or Email**: (e.g., *7428530125*)
   - **Role**: Select **Family Caregiver** or **ASHA Worker**
   - **Password**: Set your secure password
3. Click **Create Account**. You will be taken directly to your **Caregiver Dashboard**.

#### 2. Register Your Patient Profile
1. On your Caregiver Dashboard, click the green **`+ Register Patient`** button (or go to [Patient Directory](https://seva-mitr.vercel.app/caregiver/patients)).
2. Fill in the patient details:
   - **Full Name**: (e.g., *Kunal Saini* or *Mridula Hazarika*)
   - **Age & Gender**
   - **Region / District**: (e.g., *Kamrup Rural, Assam* or *Delhi*)
   - **Primary Language**: (Assamese, Bengali, Hindi, or English)
   - **Dementia Stage**: (MCI, Mild, or Moderate)
3. Click **Register Patient**. Your patient is now permanently recorded in the cloud registry.

#### 3. Install the Mobile App on the Patient's Device
1. Download the latest **[`app-release.apk`](https://github.com/sainiks/northeast-dementia-care/releases/latest)** on the patient's Android phone or tablet.
2. Tap the downloaded file to install it. (Allow "Install Unknown Apps" if prompted by Android).

#### 4. Connect & Sync Mobile App with Your Web Account
1. Open the **Northeast Dementia Care** app.
2. On the Patient Home screen, tap the gold **Caregiver Lock Icon** 🔒 in the top-right corner.
3. Enter your Caregiver PIN (default is `1234` or whatever PIN was chosen).
4. In the Caregiver Mode screen, scroll down to the **"Caregiver Cloud Account & Authentication"** card.
5. Tap **"Sign In with Phone / Email"**.
6. Enter the **exact same Phone Number** and **Password** you used on the website.
7. Tap **"Log In & Sync"**.
8. ✅ **Instant Cloud Adoption**: The app connects to SevaMitr Cloud, recognizes your registered patient, and links the local database directly to your cloud profile!

#### 5. Play Games and View Live Telemetry
1. Hand the device to your patient to play any of the **11 Cognitive Games** (*Bijuli Tap, Bikhama Khoj, Smriti Setu, Double Decision*, etc.).
2. The app measures reaction speed, hesitation latency, confusion loops, and tremor jitter score.
3. Whenever connected to the internet (even slow 2G), the app automatically micro-batches and uploads game sessions to the cloud.
4. Refresh your [Web Caregiver Dashboard](https://seva-mitr.vercel.app/caregiver) to see:
   - **Cognitive Radar Chart**: Multi-domain cognitive strengths and weaknesses.
   - **Circadian Sundowning Timeline**: Diurnal shift comparison (Morning 8 AM–3 PM vs Evening 4 PM–11 PM).
   - **Recent Activity Feed**: Chronological game session logs with scores and latency.
   - **Patient Switcher**: Toggle between multiple patient profiles if you care for more than one person.

---

### Path B: Mobile App First (Offline Rural Setup)

If you are in a remote village without immediate PC access, you can set up everything from the phone:

1. **Install App**: Open the APK and complete the initial patient setup on the phone. The app is **100% functional offline**.
2. **Unified Caregiver Registration in Mobile App**:
   - Tap the gold Lock 🔒 -> enter PIN `1234`.
   - In the **"Caregiver Cloud Account & Authentication"** card, tap **"Sign In / Register with Phone & Password"**.
   - The app presents the exact same Neo-Brutalist registration interface as the website:
     - **Segmented Pill Switcher**: Switch to `REGISTER`.
     - **Full Name**: Enter caregiver full name.
     - **Caregiver Registration Banner**: Clinical guidance indicating patients are registered by caregivers.
     - **Caregiver Designation**: Select *Family Member / Primary Caregiver*, *ASHA / Anganwadi Community Health Worker*, or *Clinical Doctor / Medical Officer*.
     - **Phone / ID & Region**: Enter your phone number and district (e.g. `Kamrup Rural, Assam`).
     - **Password**: Enter password with eye toggle.
   - Tap **"CREATE ACCOUNT"** (or use the one-tap **"Use Hackathon Demo Account"**).
   - Your local offline patient is immediately scoped and adopted into your cloud account!
3. **Log in on the Website Anytime**:
   - Open [https://seva-mitr.vercel.app](https://seva-mitr.vercel.app) on any browser.
   - Enter your phone number and password.
   - Your patient profile, cognitive radar chart, and all 11 game session metrics are instantly live!

---

## 🎮 The 11 Cognitive Assessment Games

| Game Key | Clinical Domain | Description & Biomarkers Measured |
| :--- | :--- | :--- |
| **Smriti Setu** | Visuospatial Memory | Tile-matching memory recall test; measures accuracy and hesitation. |
| **Doharani** | Executive Function | Audio-visual sequence replication task; measures error count and working memory. |
| **Rang & Tanti** | Selective Attention | Cultural Stroop test; measures cognitive interference and inhibitory control. |
| **Shabda Tarang** | Auditory Discrimination | Regional sound identification test; measures auditory response delay. |
| **Bazaar Saathi** | Calculation & Math | Local market currency calculation; tests functional daily living budgeting. |
| **Double Decision** | Useful Field of View (UFOV) | Central and peripheral speed threshold testing; measures visual processing speed in ms. |
| **Sound Sweeps** | Auditory Speed | Upward vs downward frequency sweeps; measures auditory Inter-Stimulus Interval (ISI). |
| **Target Tracker** | Divided Attention | Multi-Object Tracking (MOT); tests dynamic trajectory tracking. |
| **Speed Maze** | Visuomotor Processing | Navigational maze solving; evaluates spatial planning and motor tremors. |
| **Bijuli Tap** | Reaction & Inhibition | Lightning Go/No-Go task; measures reaction latency and motor commission errors. |
| **Bikhama Khoj** | Visual Search | Feature conjunction visual search; assesses spatial scanning and odd-one-out speed. |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Mobile["Flutter Mobile App (Android)"]
        M_UI["Neo-Brutalist Organic UI"]
        M_Bio["Biomarker Extractor (Latency, Tremor, Loops)"]
        M_DB[("Local SQLite (WAL Mode)")]
        M_Sync["SevaMitrSyncService (2G Micro-Batch)"]
    end

    subgraph Cloud["Next.js 14 Cloud Backend (Vercel)"]
        API_Auth["/api/auth (Phone/Email + Password)"]
        API_Pat["/api/patients (Deduplication & Directory)"]
        API_Sess["/api/patients/[id]/sessions (Epoch Timestamps)"]
        API_Sync["/api/sync (Micro-batch Ingestion)"]
        API_Ana["/api/analytics (Sundowning & DCI)"]
    end

    subgraph DB["Persistence Layer"]
        Prisma["Prisma Client ORM"]
        Postgres[("Neon Serverless PostgreSQL")]
    end

    M_Bio --> M_DB
    M_DB <--> M_Sync
    M_Sync <==>|Encrypted REST / JSON| Cloud
    Cloud --> Prisma
    Prisma <--> Postgres
```

---

## 💻 Running the Web Platform Locally

### Prerequisites
- Node.js 18.x or 20.x
- npm or pnpm
- PostgreSQL database (e.g. Neon, Supabase, or local PostgreSQL)

### Setup Instructions
```bash
# 1. Clone repository
git clone https://github.com/mehuldotdev/SevaMitr.git
cd SevaMitr

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create .env file with your PostgreSQL connection string:
# DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# 4. Generate Prisma Client
npx prisma generate

# 5. Run Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security, Privacy & Clinical Compliance

- **Patient Data Sovereignty**: All cognitive game telemetry is stored offline on the patient's device by default. Cloud synchronization occurs only with explicit caregiver consent.
- **Role-Based Isolation**: Caregivers can only access patients registered under their account ID.
- **Non-Diagnostic Disclaimer**: SevaMitr is a clinical decision-support and telemetry monitoring tool; it does not generate autonomous medical diagnoses without physician oversight.

---

## 📄 License

All rights reserved by the repository owners. Developed for rural elderly healthcare in the North Eastern Region of India.
