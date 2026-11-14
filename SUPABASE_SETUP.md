# STARSKY — Supabase Setup & Architecture Guide

## Overview

STARSKY uses a normalized PostgreSQL schema with Row-Level Security (RLS), Supabase Authentication, and Supabase Storage for profile photographs and resume documents.

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured in `.env.local`, the application connects to your live Supabase PostgreSQL instance.

When Supabase environment variables are not configured in `.env.local`, STARSKY transparently informs you via a status indicator and operates against a **server-side persistent database store** (`data/starsky-db.json`) with full server-side validation, role-based access control, password hashing, session cookies, and complete CRUD persistence so you can evaluate and test every workflow immediately without pretending a remote cloud connection is active.

---

## Step-by-Step Supabase Cloud Setup

1. **Create a Supabase Project**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project named `starsky`.

2. **Run the Database Migration**
   - Open the **SQL Editor** in your Supabase dashboard.
   - Paste the contents of [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) and run the script.
   - This creates all 22 normalized tables, foreign keys, indexes, unique constraints, and Row-Level Security (RLS) policies.

3. **Create Storage Buckets**
   - In Supabase **Storage**, create two buckets:
     - `avatars` (Public bucket for profile photographs and category thumbnails, max file size 5MB, allowed MIME types: `image/jpeg`, `image/png`, `image/webp`).
     - `documents` (Private/authenticated bucket for student resumes/CVs, max file size 10MB, allowed MIME types: `application/pdf`).

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API**.
   - Restart the Next.js server (`npm run dev`).

