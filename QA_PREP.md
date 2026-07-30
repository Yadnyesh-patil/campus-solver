# 🛡️ Campus Solver - Judge Q&A Prep

Prepare for the toughest questions the hackathon judges might throw at you. Memorize these key talking points.

### 1. Is the AI real? How does it work?
**Answer:** Yes, it's real. When a user submits a complaint (via text or voice-to-text), we send the unstructured string to an LLM API with a strict system prompt. The LLM acts as a classifier, returning a structured JSON object containing the category, department, priority level, sentiment, and an urgency score (1-10). We parse this JSON to auto-fill the form. 

### 2. What happens when the AI API is down or rate-limited?
**Answer:** We built a resilient system. If the LLM API fails, times out, or gets rate-limited, we immediately catch the error and fall back to a local, regex-based smart keyword matching function. For example, if the text contains "wire", "shock", or "light", the fallback automatically maps it to the Electrical department. The user experiences zero downtime.

### 3. How do you handle duplicate complaints?
**Answer:** During the form submission flow, our AI compares the new complaint's keywords and location against open complaints from the last 48 hours. If there's a high semantic match (e.g., two people complaining about the fan in Room 402), we surface a warning to the user: "This issue may have already been reported," showing the existing ticket status. This drastically reduces staff workload.

### 4. What's the tech stack and why did you choose it?
**Answer:** We chose Next.js 16 (App Router) with TypeScript for robust, type-safe full-stack development. Tailwind v4 for rapid UI styling, and Framer Motion for premium UX. For the backend, we used Supabase because it gives us a scalable PostgreSQL database, secure Row Level Security (RLS) for our three user roles, and WebSockets for real-time dashboard updates without polling.

### 5. How does SLA (Service Level Agreement) escalation work?
**Answer:** Every category has a predefined SLA (e.g., electrical issues = 24h, plumbing = 48h). When a ticket is created, a deadline timestamp is set. The frontend shows a countdown timer. If the current time surpasses the deadline and the status isn't "Resolved", the system visually flags it as "Breached" and auto-escalates it to the Admin dashboard, triggering high-priority notifications.

### 6. Can this scale to multiple campuses?
**Answer:** Yes. Our database schema is designed with extensibility in mind. By introducing a `campus_id` or `organization_id` foreign key to our core tables (Users, Complaints, Departments), we can easily implement multi-tenant architecture. Supabase RLS policies would ensure data isolation between campuses.

### 7. What about data privacy?
**Answer:** We enforce strict data privacy using Supabase Row Level Security (RLS). Students can only read and update their own complaints. Staff can only see complaints assigned to their department. Only authorized Admins have a global view. No one can bypass these rules, even if they manipulate the frontend API calls.

### 8. How is this different from a Google Form?
**Answer:** A Google Form is a static data collection tool. Campus Solver is a dynamic workflow engine. Google Forms don't have automatic department routing, SLA countdowns, real-time staff dashboards, duplicate detection, or interactive status timelines. We close the feedback loop that Google Forms leave open.

### 9. What's the business model?
**Answer:** It's a B2B SaaS model. We would sell this to university administrations or large corporate campuses on an annual subscription basis, tiered by the number of active staff users or total student population. The ROI for the university is reduced maintenance overhead, better infrastructure lifespan, and higher student satisfaction.

### 10. How would you deploy this at VIT right now?
**Answer:** We'd start with a pilot program in one specific hostel block. We'd onboard 5 maintenance staff members, put up QR codes in the hallways linking to the submission portal, and have students report issues for 2 weeks. We'd measure the average time-to-resolution compared to the old paper-based system to prove value before a campus-wide rollout.

### 11. What was the hardest technical challenge you faced?
**Answer:** Managing the complex role-based routing in Next.js while keeping the UI snappy. Ensuring that a Student couldn't accidentally navigate to the Admin dashboard, while maintaining context (like active filters) when users moved between pages. We solved this with a robust middleware and layout-level context providers. Also, integrating the Web Speech API seamlessly with the LLM categorization took significant tuning.

### 12. How does role-based access work?
**Answer:** It happens at two levels. On the frontend, Next.js middleware checks the user's role in their JWT token and redirects unauthorized access (e.g., a student trying to access `/admin`). On the backend, Supabase RLS acts as the ultimate source of truth, ensuring that database queries only return rows the user is permitted to see, based on their `role` column.

### 13. What happens if the internet goes down?
**Answer:** Currently, it requires an active connection for real-time sync and AI processing. However, because it's built on web technologies, our immediate next step would be converting it into a PWA (Progressive Web App) with local caching, allowing students to draft complaints offline and automatically sync them when they reconnect to campus Wi-Fi.

### 14. What's your competitive advantage over existing college ERPs?
**Answer:** Most college ERPs are clunky, outdated, and painful to use. They were built 15 years ago. Campus Solver is built for Gen Z. It's mobile-first, incredibly fast, uses voice and AI to reduce friction, and looks like a modern consumer app. We focus 100% on grievance resolution rather than trying to be a bloated all-in-one ERP.

### 15. What would you build in the next 3 months?
**Answer:** 
1. **WhatsApp Bot Integration:** Allow students to submit issues simply by texting a WhatsApp number.
2. **Predictive Maintenance Analytics:** Use ML to analyze historical data and predict when specific infrastructure (like AC units in a specific block) are likely to fail next.
3. **Inventory Management:** Link staff repairs to a parts inventory so admins know exactly how many lightbulbs or pipes are being used per month.
