---
name: SteelFab Virginia Dashboard Project
description: Context for building a SteelFab VA shop survey interactive dashboard for client David Spickard
type: project
---

New interactive dashboard for SteelFab's Virginia division shop survey, modeled closely on the Alpaca dashboard (in Alpaca-example/).

**Why:** David (client) wants a separate dashboard for SteelFab VA's shop survey, not integrated into the existing company-wide SteelFab dashboard.

**How to apply:** Use Alpaca-example/ as the reference codebase. Same stack: Chart.js, Shoelace UI, vanilla JS modules, CSV-driven.

## Data
- Source: hidden/SteelFab-VA-Shop.xlsx (67 respondents, all from Virginia - Emporia Shop as of March 2026)
- 3 locations in system: Virginia - Emporia Shop, North Carolina - Fayetteville Shop, Alabama - Roanoke Shop
- Build location filter even though only Emporia has data now (future surveys may add others)

## Filters (3 dimensions)
1. **Job Role** (12 options, multi-select): Crane operator, Detail coordinator, Fitter, Forklift operator, Leadperson/Supervisor, Machine operator, Maintenance, Painter, Programmer, Quality control, Welder, Other
   - 10/67 respondents picked multiple roles — treat multi-role the same as Alpaca did (expand rows)
2. **Location** (3 options): Virginia - Emporia Shop, NC - Fayetteville Shop, AL - Roanoke Shop
3. **Tenure** (NEW filter vs Alpaca): Less than 1 year, 1-3 years, 4-6 years, 7+ years

## THRIVE Questions (12 MCQ, same count as Alpaca)
- TRUST: Q25 (trust leaders), Q26 (trust coworkers)
- HEALTH: Q27 (anxious/stressed — REVERSE CODE), Q28 (overwhelmed — REVERSE CODE + GREEN comment Q29)
- RELATIONSHIPS: Q30 (feel known), Q31 (safety satisfaction)
- IMPACT: Q32 (motivated by values), Q33 (training/feedback satisfaction)
- VALUE: Q34 (recognition — GREEN comment Q35), Q36 (compensation — GREEN comment Q37)
- ENGAGEMENT: Q38 (opportunities to learn), Q39 (supplied with what needed)

## Green-highlighted comment fields (need display decision)
1. Q28 overwhelmed → Q29 "What makes you feel overwhelmed?"
2. Q34 recognition → Q35 "How do you feel about the recognition you receive at work?"
3. Q36 compensation → Q37 "Why or why not?"
David said "not sure how to display those comments — would be open to your thoughts."

## Company Values question
- Q40: Which SteelFab value is most important to you? (Teamwork:38, Integrity:11, Excellence:8, Reliability:7, Passion:3)
- Q41: Why is this value most important to you? (GREEN comment)
David said "would be open to how you think that might be displayed."

## Satisfaction (Yellow highlight — like Alpaca KPI)
- Q47: Overall, how satisfied are you with your job at SteelFab? (Extremely satisfied:29, Satisfied:27, Neither:9, Dissatisfied:2)

## Open-ended questions (need AI categorization before charts)
- Q42: During your first year at SteelFab, what obstacles did you face?
- Q43: What would motivate you to want to be a leader at SteelFab?
- Q44: What one thing would you need to make a career at SteelFab?
- Q45: What do you enjoy most about your job at SteelFab?
- Q46: What do you enjoy least about your job at SteelFab?
- Q48: (Optional) What one or two things would you change?

## Branding
- Logo assets: Alpaca-example/hidden/Reference_SteelFab/Assets/steel-fab1.png and steel-fab2.png
- Reference prior SteelFab dashboard: Alpaca-example/hidden/Reference_SteelFab/

## Protocol (per Alpaca precedent)
- Run AI categorization on open-ended questions, share proposed categories with David BEFORE building charts
- Same approach for green comment fields (likely same AI-categorize-then-chart)
