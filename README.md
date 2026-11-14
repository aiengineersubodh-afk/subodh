# STARSKY — Connecting Research Minds. Creating Opportunities.

STARSKY is a full-stack academic research collaboration and internship discovery platform connecting **PhD Scholars** with **Undergraduate and Postgraduate Students** across Engineering, Medical Sciences, Fundamental Sciences, Management, Commerce, Arts & Humanities, Law, Agriculture, and Interdisciplinary Research.

---

## Key Features

1. **Corporate Brand & Design System**
   - Clean, non-blue corporate aesthetic inspired by TCS (`#FFFFFF` primary background, `#F7F8FA` secondary background, `#202124` charcoal typography, `#666666` secondary text, `#F36F21` warm orange accent, `#E5E7EB` borders).

2. **Public Website (CMS-Driven)**
   - **Home Page (`/`)**: Hero section, active announcements, platform statistics, How STARSKY Works, Explore Academic Domains, Why Choose STARSKY, Featured PhD Scholars, Research Opportunities, Testimonials, and CTA.
   - **Explore Domains & PhD Scholar Directory (`/explore`)**: 9 Academic Domains + 50+ Specializations dynamically managed from the Admin Panel, plus PhD Scholar Directory and Open Internships with multi-criteria search & filtering.
   - **Detailed PhD Scholar Profile (`/scholars/[id]`)**: Full academic biography, publications, projects, ORCID/Scholar links, open internships, and prominent orange **"Apply for Internship"** button with a 2-step Review & Submit application modal.
   - **About Us (`/about`)**, **Careers (`/careers`)**, and **Contact Us (`/contact`)**.

3. **Role-Based Authentication & Onboarding**
   - **Login (`/login`)**, **Registration (`/register`)** with account role selection (`Student` or `PhD Scholar`), and **Admin Login (`/admin/login`)**.
   - **Student Onboarding (`/onboarding/student`)** & **PhD Scholar Onboarding (`/onboarding/scholar`)**.
   - Server-signed HTTP-only HMAC session cookies and strict server-side role verification.

4. **Student Dashboard (`/dashboard/student`)**
   - Overview metrics, Profile completion, My Applications table (with search, status filter, View Details, and Withdraw), Saved Scholars, My Profile, and Settings.

5. **PhD Scholar Dashboard (`/dashboard/scholar`)**
   - Overview metrics, My Profile, My Internships (Create, Edit, Publish/Close, Delete), **Students Section** (cards for all student applicants to the scholar's internships), Applications Management (Shortlist, Accept, Reject, Under Review, Private Review Notes), and Settings.

6. **Master Admin Panel (`/admin`)**
   - 17-section control center: Dashboard & 5 visual charts, Students, PhD Scholars (credential verification), Internship Moderation, Applications, Academic Domains, Specializations, Home Page CMS, About Us CMS, Careers, Contact Messages, Testimonials, Announcements, Website Settings, Admin Management, and Activity Logs.

---

## Running Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Demo Evaluation Accounts (Pre-seeded & Marked as Demo Data)

| Role | Email | Password | Portal |
| :--- | :--- | :--- | :--- |
| **Student** | `aarav.sharma@nitk.edu.in` | `Student@2026` | `/login` |
| **PhD Scholar** | `ananya.raghavan@iisc.ac.in` | `Scholar@2026` | `/login` |
| **Super Admin** | `admin@starsky.edu` | `Admin@2026` | `/admin/login` |

For Supabase Cloud PostgreSQL setup, see [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) and [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).

