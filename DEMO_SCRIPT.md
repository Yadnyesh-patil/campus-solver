# 🎤 Campus Solver - Demo Script (6 Minutes)

**Team Name:** [Your Team Name]
**Track:** Campus Problem Solver — Grievance Redressal & Maintenance Tracker

---

## 🕒 [0:00 - 0:30] The Hook (30s)
**Speaker:** [Speaker Name]
**Visual:** Blank screen, just speaker talking.

"Good [morning/afternoon] judges! How many of you have complained about a broken fan, a leaky tap, or slow Wi-Fi on campus... and then never heard back? 

You ask around, send WhatsApp messages, or fill out a paper register. Weeks pass. Nothing happens. You don't know who is responsible, and the admin doesn't know there's a backlog."

## 🕒 [0:30 - 1:30] The Problem & Solution (1min)
**Speaker:** [Speaker Name]
**Visual:** Title slide of "Campus Solver".

"The current workflow is completely broken. There's no tracking, no transparency, and zero accountability.

That's why we built **Campus Solver** — an AI-powered grievance management platform designed for speed, accountability, and transparency. It's not just a form; it's a smart routing engine. We use AI to instantly categorize complaints, predict urgency, enforce SLAs, and auto-route issues to the correct department so problems get solved, fast."

## 🕒 [1:30 - 4:30] Live Demo Walkthrough (3min)
**Speaker:** [Speaker Name]
**Visual:** Screen sharing the live Next.js application.

### Step 1: Student Submission & Voice AI
*(Action: Log in as Student - Rahul Kumar. Go to Dashboard).*
"Let's see it in action. I'm logged in as Rahul, a student. On my dashboard, I can see my active complaints. Let's submit a new one."
*(Action: Click 'Submit Complaint'. Click Voice Record button).*
"Instead of typing, I'll just use my voice."
*(Speak clearly):* "The ceiling fan in room 402 Hostel B is making a loud noise and not working."
*(Action: Stop recording. Wait 2 seconds for AI).*
"Watch this. The Web Speech API grabbed the transcript, and our AI instantly analyzed it. It categorized it as 'Electricity', assigned it to 'Electrical Maintenance', marked priority as 'High', and even picked up a 'Frustrated' sentiment."

### Step 2: Evidence & Duplicate Check
*(Action: Open camera/upload photo).*
"I can attach live photo evidence via the device camera."
*(Action: Click Submit).*
"Before submission, our AI does a quick check for duplicates. If someone else in room 402 already complained, it warns me. Let's proceed."

### Step 3: Staff Assignment & SLAs
*(Action: Open a new incognito window/switch tab. Log in as Staff).*
"Now, let's switch hats. I'm a maintenance staff member. I get a real-time notification."
*(Action: Show Staff Dashboard and click on the new complaint).*
"Here's Rahul's complaint. Notice this SLA timer? I have 24 hours to resolve high-priority electrical issues. If I don't, this escalates automatically to the Admin."
*(Action: Update status to 'In Progress', add a comment: "Parts ordered").*

### Step 4: Admin Oversight
*(Action: Switch tab. Log in as Admin).*
"Finally, the Admin view. The admin doesn't just see a list; they see the heartbeat of the campus."
*(Action: Show Analytics page).*
"Here are our department performance metrics. We can see which departments are hitting their SLAs and which are falling behind. We can also manage staff access and escalate blocked issues manually."

## 🕒 [4:30 - 5:30] Tech Deep-Dive (1min)
**Speaker:** [Speaker Name]
**Visual:** Show the architecture diagram or a slide with tech logos.

"Under the hood, this is a Next.js 16 App Router application written in TypeScript. 
- **AI Pipeline:** We use an LLM API to process unstructured text into strict JSON for categorization, sentiment, and urgency scoring (1-10). If the API fails, we have a smart keyword-based fallback.
- **Real-time:** We use Supabase for PostgreSQL, Auth, and real-time subscriptions, ensuring that the moment a student submits an issue, the staff dashboard updates instantly.
- **Frontend:** Styled with Tailwind v4 and animated with Framer Motion, it features a fully responsive mobile-first design with role-based routing protecting every endpoint."

## 🕒 [5:30 - 6:00] Impact & Future Vision (30s)
**Speaker:** [Speaker Name]
**Visual:** Final slide / "Thank You" slide.

"A university like VIT sees over 1,000 maintenance complaints a month. With Campus Solver, we guarantee zero lost complaints and measurable staff accountability. 

In the future, we plan to implement predictive maintenance using ML to spot failing infrastructure *before* it breaks, and expand this to a multi-campus SaaS model.

Thank you! We'd love to take your questions."

---
### 📝 Speaker Notes & Tips:
- **Practice the transitions:** Switching between Student, Staff, and Admin accounts quickly is the hardest part. Have 3 browsers open (Chrome, Firefox, Safari) or use 3 different Chrome profiles logged in simultaneously to avoid logging in and out during the demo.
- **Voice Demo:** Make sure your microphone is selected correctly before the presentation. If the room is too loud, have a typed text snippet ready to copy-paste as a fallback.
- **Keep the pace:** 6 minutes goes by incredibly fast. Do not get bogged down explaining code. Show the *impact* of the code.
