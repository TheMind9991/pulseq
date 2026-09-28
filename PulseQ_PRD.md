# PulseQ — Product Requirements Document

Version: 1.0 (draft)
Date: 28 September 2026
Owner: Hasan
Status: For review

## 1. Overview

PulseQ (pulseq.app) is a question bank platform for Egyptian medical students, built around the Kasr Al Ainy curriculum. It lets students practise exam-style MCQs by subject and topic, sit timed mock exams, and track their performance. It also gives faculties an admin layer to manage content and, in future, run PulseQ under their own branding.

Current state: a Next.js 14 (App Router) and Firebase (Firestore, Auth, Storage) build covering authentication, onboarding, admin dashboards, Excel question upload, exam session generation and a live exam context. Active development paused in late July 2026. This PRD defines what is needed to take the product from working build to a launched, revenue-generating platform.

## 2. Problem statement

Egyptian medical students prepare for exams using scattered material: WhatsApp-shared PDFs, unverified question dumps, and international banks (UWorld, Amboss) that do not match the local curriculum, exam style or emphasis.

Consequences:
- Low-quality or incorrect questions circulate with no accountability.
- Students cannot see how they perform against a benchmark.
- Content is not mapped to the faculty syllabus, so revision is inefficient.
- Faculties have no sanctioned, trackable practice tool for their students.

## 3. Goals and non-goals

**Goals**
- G1. Give students a curriculum-aligned, high-quality question bank with clear explanations.
- G2. Make practice measurable: per-topic accuracy, weak-area identification, progress over time.
- G3. Give admins an efficient way to load, review and maintain questions at scale.
- G4. Support a white-label offering for private Egyptian medical faculties.
- G5. Reach a sustainable ad-supported revenue model, with an ad-free upgrade as a secondary revenue line.

**Non-goals (v1)**
- Full learning management system (lectures, video, assignments).
- Native mobile apps (responsive web first; PWA considered later).
- AI-generated questions published without human review.
- Coverage of non-medical faculties.
- Gating by *content* — subject, topic, or question type are never restricted by payment status. The only levers are ads and daily usage caps (Section 6.6).

## 4. Target users

**Primary:** Medical students (years 1–6) at Kasr Al Ainy and other Egyptian faculties, preparing for module, final and licensing exams. Mostly mobile users, Arabic and English speakers, cost-sensitive.

**Secondary:** Interns and residents revising for postgraduate exams (later phase).

**Admin users:** Content editors (doctors and senior students) who write and review questions; the platform owner.

**Institutional customers:** Private medical faculties (for example Newgiza University) wanting a white-label deployment.

## 5. User stories

**Student**
- As a student, I can sign up, choose my faculty, year and modules, so content is tailored to me.
- As a student, I can practise questions in untimed "tutor" mode with an explanation after each answer.
- As a student, I can sit a timed mock exam that mimics the real exam format.
- As a student, I can filter questions by subject, topic, difficulty and status (unseen, incorrect, flagged).
- As a student, I can flag a question, add personal notes, and report an error.
- As a student, I can see my accuracy by subject and topic and get a list of my weakest areas.
- As a student, I can resume an interrupted session without losing progress.
- As a student, I get full access to the entire question bank and exam mode for free, with ads shown on the dashboard and session-builder screens.
- As a student, I can pay EGP 150/month to remove ads, with no other change to what I can do on the platform.

**Admin / editor**
- As an admin, I can bulk upload questions from an Excel template with validation and clear error reporting.
- As an admin, I can create and edit single questions with images, explanation and references.
- As an admin, I can review, approve or reject submitted questions and student error reports.
- As an admin, I can manage users and see who has an ad-free subscription.
- As an admin, I can view usage and content analytics.

**Institution (white-label)**
- As a faculty administrator, I can see PulseQ under our branding and domain, with our own student cohort and question set.
- As a faculty administrator, I can view cohort-level performance reports.

## 6. Functional requirements

**6.1 Authentication and onboarding**
- Email/password plus Google sign-in (Firebase Auth).
- Onboarding captures faculty, academic year and modules.
- Role-based access: student, editor, admin, institution admin.
- Password reset and email verification.

**6.2 Question bank**
- Question types: single best answer MCQ (v1); extended matching and image-based questions (v1.1).
- Each question: stem, options, correct answer, explanation, subject, topic, difficulty, source/reference, optional image, status (draft, in review, published, retired).
- Content taxonomy mapped to the Kasr Al Ainy curriculum: subject → topic → subtopic.
- Support for Arabic and English content, with right-to-left rendering where needed.

**6.3 Practice and exam engine**
- Tutor mode: immediate feedback and explanation.
- Timed exam mode: configurable question count and duration, no feedback until submission, review at the end.
- Custom session builder: select subjects, topics, difficulty and question status.
- Session persistence: auto-save answers; resume on any device.
- Question navigation panel, flagging, and strike-through of options.
- All question content, subjects, and question types are available to every registered user regardless of payment status. Free-tier accounts have a daily usage cap (Section 6.6) on volume, not on what they can access.

**6.4 Analytics and progress**
- Score and time per session.
- Accuracy by subject and topic; trend over time.
- Weak-area list with a one-tap "practise weak topics" action.
- Percentile against other users (once cohort size supports it).

**6.5 Admin dashboard**
- Excel bulk upload with a downloadable template, row-level validation, duplicate detection and a preview before commit.
- Question editor with review workflow (draft → review → published).
- Error-report queue from students.
- User management and role assignment.
- Ad-free subscriber list and billing status.
- Content coverage view (questions per topic) to show gaps.

**6.6 Monetization: ads + daily caps, with a paid ad-free/unlimited upgrade**
- Every registered user has access to the entire question bank, every subject, tutor mode, timed exams and full analytics — content is never gated by payment status. What differs between free and paid is volume and ads, not access.
- Free tier:
  - Banner ad units on the dashboard and the practice/exam session-builder screens (not mid-question or on the question/answer screen itself — the core practice experience stays ad-free for everyone, paying or not, to protect the study experience and avoid disrupting timed exams).
  - A daily cap of 100 answered questions (tutor mode) and 60 minutes of timed-exam mode, both resetting at the start of each day. Once either cap is hit, that mode is blocked for the rest of the day with a clear message and an upgrade prompt — this is a hard stop, not a soft warning, so the value of upgrading is unambiguous.
  - The two caps are independent: hitting the question cap doesn't block exam mode and vice versa, though in practice a timed exam also consumes questions (Section 6.3), so the two interact naturally.
- Ad-free/unlimited tier: EGP 150/month, removes all ad placements *and* both daily caps. A single upgrade buys both — there is no separate "remove ads only" or "unlimited only" option in v1, to keep pricing and the upgrade pitch simple.
- Local payment methods are essential for the upgrade (Fawry, Vodafone Cash, InstaPay, cards). Provider to be selected.
- Promo and institution codes may grant complimentary ad-free/unlimited access (e.g. for content editors, faculty partners, or promotional periods).
- The exact cap numbers (100 questions/day, 60 minutes of exam mode/day) are a starting hypothesis, not a permanent commitment — monitor what fraction of free users actually hit either cap in the first weeks post-launch and adjust if the caps prove too generous (no upgrade pressure) or too tight (frustrates genuine light users).

**6.7 White-label (phase 2)**
- Per-tenant branding (logo, colours, domain).
- Tenant-scoped users, content and analytics.
- Cohort reporting for faculty administrators.
- Open question: whether a white-label faculty deployment shows ads at all, or is ad-free by default as part of the institutional agreement (Section 12).

**6.8 Notifications**
- Optional study reminders and exam-date countdown (email first; push later).

## 7. Non-functional requirements

**Performance**
- Question page load under 2 seconds on a typical Egyptian 4G connection.
- Exam session start under 3 seconds.
- Ad units must not block or delay the render of question content or exam timers — ads load asynchronously and never sit on the critical path of the practice/exam experience.

**Reliability**
- Target 99.5% availability, higher during exam periods.
- No loss of answers on connection drop (local queue and sync).
- If the ad network fails to serve or is blocked (ad blockers, network issues), the app must degrade gracefully — an empty ad slot, never a broken layout or an error blocking the rest of the page.

**Security and privacy**
- Firestore security rules enforce role and tenant access; no client-side trust for admin actions.
- Replace any hard-coded or injected elevated roles (for example the current "God Mode" injection) with a properly managed admin claim set through server-side custom claims.
- Question content protected against bulk scraping (rate limiting, authenticated access, watermarking considered).
- Minimal personal data collected; compliance with the Egyptian Personal Data Protection Law.
- Ad network data collection (cookies/tracking) disclosed in the privacy policy; a consent banner is required if the chosen ad network requires it for compliance in Egypt/EU-adjacent regulations.

**Scalability**
- Support 10,000 concurrent users during peak exam weeks without manual intervention.
- Firestore data model and indexes designed to keep read costs predictable.

**Accessibility and localisation**
- Mobile-first responsive design.
- Full Arabic and English UI with RTL support.

## 8. Content strategy

Content quality is the main differentiator and the main risk.

- Launch target: an initial bank of at least 3,000 reviewed questions across core preclinical and clinical modules (to be refined by module).
- Every published question is reviewed by a second person and carries an explanation and reference.
- Copyright: only original or properly licensed questions; no copying from commercial banks or past-paper compilations without permission.
- Student error reports feed a continuous correction loop.
- AI may assist drafting and explanation generation, but nothing is published without human review.
- Recruit a small panel of paid or credited editors (senior students, residents) with a clear rate per reviewed question.

## 9. Success metrics

**Acquisition**
- Registered users; sign-up to first-session conversion.

**Engagement**
- Weekly active users; questions answered per active user per week.
- Day-7 and day-30 retention.
- Mock exams completed per user per month.
- Since content is never gated (only daily volume for free users), engagement metrics below the 100-question/60-minute caps reflect genuine product usage; track what fraction of active free users hit either cap regularly, since that population is both the best upgrade signal and the group whose experience is most shaped by the cap.

**Content quality**
- Error-report rate per 1,000 answered questions (target: falling month on month).
- Percentage of questions with explanation and reference (target: 100%).

**Business**
- Ad revenue: impressions served, effective CPM, monthly ad revenue.
- Ad-free conversion rate (% of registered users who pay to remove ads).
- Monthly recurring revenue from ad-free subscriptions.
- Number of institutional pilots signed.

Suggested launch targets (to be validated): 1,000 registered users within the first exam cycle after public launch, with ad-free conversion and ad revenue-per-user both tracked from week one to establish a baseline (no prior data exists for either lever); one signed faculty pilot within six months.

## 10. Release plan

**Phase 0 — Stabilise (2–3 weeks)**
- Audit existing build; fix known issues; replace role injection with proper custom claims; harden security rules.
- Finalise data model and Excel upload template.

**Phase 1 — MVP launch (6–8 weeks)**
- Tutor and timed exam modes, session resume, basic analytics — available in full to every user from day one.
- Seed content for two or three high-demand modules.
- Ad integration (dashboard + session-builder placements) and the ad-free payment flow, with at least two local payment methods.
- Closed beta with a small student group; fix, then public launch before a major exam window.

**Phase 2 — Growth (following 2–3 months)**
- Weak-area engine, custom sessions, notes and flagging refinements.
- Image-based questions; expanded content coverage.
- Referral and promo mechanics; WhatsApp-friendly sharing.
- Ad placement/frequency tuning based on real engagement and revenue data.

**Phase 3 — Institutions**
- White-label tenancy, cohort reports, faculty onboarding.
- Pilot with a private faculty using the existing pitch deck and outreach.
- Decide and implement whether white-label tenants show ads (Section 12).

## 11. Dependencies and risks

**Risks**
- R1. Content volume and quality. *Mitigation:* editor panel, review workflow, error-report loop, phased module rollout.
- R2. Copyright exposure from sourced questions. *Mitigation:* original or licensed content only; clear contribution terms for editors.
- R3. Piracy and scraping of the bank. *Mitigation:* rate limits, authenticated access, watermarking, monitoring for leaks.
- R4. Ad revenue may be low at launch scale. Egyptian/regional CPMs are typically modest, and 1,000–few-thousand users will not generate meaningful ad income on their own. *Mitigation:* treat ad revenue as a secondary, scale-dependent line, not the primary bet; the daily caps pushing genuinely heavy users toward the paid upgrade are likely the larger near-term revenue driver; do not delay launch waiting for ad revenue to prove itself.
- R5. Ad experience could hurt retention if intrusive. *Mitigation:* ads confined to dashboard/session-builder only, never during active question-answering or timed exams (Section 6.6); monitor retention before/after ad rollout in the beta.
- R6. Daily caps (100 questions / 60 min exam mode) could frustrate students during genuine cramming periods (e.g. the week before an exam), pushing them to a competitor rather than to upgrade. *Mitigation:* monitor cap-hit rate and complaint/churn signals closely in the first exam cycle post-launch; the cap thresholds are explicitly provisional (Section 6.6) and should move if this risk materializes.
- R7. Payment friction in Egypt for the paid upgrade. *Mitigation:* local wallets and Fawry from day one.
- R8. Firestore cost growth with heavy reads. *Mitigation:* data modelling, caching, query discipline, budget alerts.
- R9. Founder bandwidth (clinical internship, MRCS preparation). *Mitigation:* strict MVP scope, delegated content review, defer white-label until MVP proves demand.
- R10. Competition from free WhatsApp material and larger regional platforms. *Mitigation:* curriculum alignment, quality, a generous free tier (100 questions/day covers most single-session study habits) removes the price objection for most users, faculty endorsement.

**Dependencies**
- Ad network account approval (e.g. Google Ad Manager/AdSense) — note that ad network approval can be slow or require a minimum traffic/content bar; apply early, in parallel with Phase 0.
- Payment provider approval for the ad-free upgrade.
- Editor recruitment.
- Faculty relationships for endorsement and pilots.

## 12. Open questions

1. Which ad network/provider — confirm Google Ad Manager/AdSense is viable for this traffic profile and content category (medical education) before committing engineering time to integration.
2. Ad frequency/density on the dashboard and session-builder screens — how many units, how prominent, balanced against not looking cheap or hurting trust in a medical-education product.
3. Does a white-label faculty deployment show ads and enforce daily caps at all, or does the institutional agreement include unlimited/ad-free access for its students by default?
4. Whether the 100-question/60-minute caps should flex around exam periods (e.g. a temporary higher cap in the weeks before major exams) or stay flat year-round — flat is simpler to build and reason about, and is the default assumption unless decided otherwise.
5. Which modules or years launch first?
6. Who owns and licenses content contributed by editors?
7. Is an Arabic UI required at launch or can it follow?
8. Should white-label be built into the data model now (tenant ID everywhere) even if launched later? Recommended: yes, to avoid a costly migration.
9. Is the Next.js/Firebase stack to be kept, or is any re-architecture warranted before scaling?
10. What is the realistic weekly time you can commit alongside internship and exam preparation?
