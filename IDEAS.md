# AirGuard — Feature Ideas for India Innovates 2026

## What We Already Have (Current State)
- 10 dashboard pages, 15 API routes, 28 live CPCB stations
- XGBoost source classification, Prophet/LSTM forecasting, IDW/Kriging interpolation
- AI enforcement notices (Groq LLM), what-if simulator, GRAP compliance
- Command center, citizen complaints, PDF reports, AI copilot, notifications
- Supabase persistence, Clerk auth, editorial design system

---

## TIER 1: HIGH IMPACT, BUILDABLE NOW
*These can be built in the existing Next.js + Supabase stack*

### 1. Personal Exposure Calculator
**What:** User enters their daily route (home ward → work ward → school ward) and time spent in each. System calculates their cumulative PM2.5 exposure in μg/m³·hours and compares against WHO daily limits (15 μg/m³ 24h average).
**Why it wins:** Makes air quality PERSONAL. A judge can enter their own route and see their exposure score. No competing platform does per-route cumulative exposure.
**Implementation:** New page `/dashboard/exposure` — ward selector for morning/afternoon/evening locations, time sliders, computes weighted average from ward AQI data.

### 2. Pollution Source Heatmap by Type
**What:** Instead of showing total AQI, let users toggle to see individual pollution source heatmaps — a "construction dust" layer, a "vehicular traffic" layer, a "biomass burning" layer. Shows WHERE each type dominates.
**Why it wins:** MCD officers can visually identify construction corridors vs traffic corridors vs burning hotspots. No other platform breaks down spatial distribution BY SOURCE TYPE.
**Implementation:** Extend `/api/wards` to return per-source contributions per ward. New toggle in the map component for 8 source layers.

### 3. Automated GRAP Compliance Scorecard
**What:** Each GRAP stage mandates specific actions (Stage III = ban construction). Track compliance per ward: "Construction sites active: 12 (violation), Water sprinkling logs: submitted, Truck entry permits: 3 denied." Generate a compliance percentage per ward.
**Why it wins:** This is exactly what the MCD Commissioner needs — not just data, but accountability. "Ward 42 is 68% compliant with GRAP Stage III."
**Implementation:** New Supabase table `grap_compliance` with ward_id, action_type, status, evidence_url. New page `/dashboard/compliance`.

### 4. Crowd-Sourced Pollution Verification
**What:** When AQI spikes in a ward, push a notification asking nearby citizens: "Is there visible construction dust in your area? [Yes] [No]". Aggregate citizen responses to validate sensor data and identify false positives.
**Why it wins:** Creates bidirectional data flow. Sensor says AQI spike → citizens CONFIRM on the ground → MCD has verified, court-admissible evidence.
**Implementation:** Extend complaints system with "verification requests" tied to AQI threshold crossings.

### 5. Health Impact Estimator
**What:** Using WHO dose-response relationships, estimate health impact per ward: "At current AQI levels, residents of Anand Vihar face 3.2× higher respiratory hospitalization risk compared to Siri Fort." Show estimated premature deaths averted if intervention X is applied.
**Why it wins:** Turns abstract AQI numbers into human impact. "This policy saves 14 lives per year" is more compelling than "reduces PM2.5 by 12%."
**Implementation:** Published WHO/IHME Global Burden of Disease coefficients. Relative Risk = exp(β × ΔPM2.5). New section in command center.

### 6. Multi-City Benchmark
**What:** Compare Delhi's AQI against Mumbai, Kolkata, Chennai, Bangalore in real-time. Show Delhi's rank and trend. WAQI has data for all major Indian cities.
**Why it wins:** Context matters. "Delhi is 3× worse than Mumbai today" is more actionable than "Delhi AQI is 342." Also useful for benchmarking policy effectiveness.
**Implementation:** Fetch WAQI feeds for 5-6 Indian cities. New section on landing page or dashboard.

### 7. School Safety Index
**What:** Dedicated page showing every school zone in Delhi with their ward's AQI, with a simple traffic-light system: GREEN = outdoor activities OK, YELLOW = limit outdoor time, RED = cancel outdoor activities, BLACK = consider closure. Auto-generates parent notification templates.
**Why it wins:** Judges who are parents will connect emotionally. MCD can send this to 1600+ Delhi schools daily.
**Implementation:** Schools data (even synthetic for demo) + ward AQI → threshold-based recommendations. New page `/dashboard/schools`.

### 8. Wind Corridor Analysis
**What:** Show pollution transport corridors based on real-time wind direction + AQI gradients. "North-westerly winds are carrying Anand Vihar's pollution toward Civil Lines." Arrow overlays on the map showing predicted pollution flow.
**Why it wins:** Explains WHY a clean ward suddenly spikes. Helps MCD identify upwind sources to target for enforcement.
**Implementation:** Use OWM wind data + IDW gradient to compute flow vectors. SVG arrow overlay on map.

### 9. Green Cover Correlation
**What:** Overlay NDVI (vegetation index) data from satellite imagery against AQI. Show correlation: wards with more green cover consistently have lower AQI. "Increasing green cover by 15% in Ward 42 would reduce AQI by ~20 points."
**Why it wins:** Gives MCD a POSITIVE action to take (plant trees) instead of only enforcement (ban things). Published research supports NDVI-AQI correlation.
**Implementation:** Synthetic NDVI grid (same approach as current satellite AOD module). Scatter plot showing green cover vs AQI.

### 10. Emergency Response Playbook
**What:** For each GRAP stage, show a step-by-step playbook with checkboxes: "Step 1: Notify all schools in red zones ☐, Step 2: Deploy anti-smog guns at 5 hotspots ☐, Step 3: Issue enforcement notices to top 10 violating wards ☐." Track completion.
**Why it wins:** Turns the dashboard from information display into action coordination. The commissioner can literally check boxes as actions are taken.
**Implementation:** New page `/dashboard/playbook` with GRAP-stage-specific action lists stored in Supabase.

---

## TIER 2: MEDIUM IMPACT, INNOVATIVE

### 11. AQI Prediction Confidence Dashboard
Show not just the forecast, but the MODEL CONFIDENCE for each prediction. "We are 92% confident Anand Vihar will exceed AQI 400 tomorrow." Uses the forecast confidence intervals but presents them as probability statements. Government decision-makers understand probability better than confidence bands.

### 12. Source Attribution Chain
When a ward has high AQI, trace back: "62% of Ward 42's PM2.5 comes from road dust → 3 construction sites active on NH-24 → Site permits issued by MCD Zone East → Officer: Rahul Sharma." Complete attribution chain from pollution to responsible party.

### 13. Cross-Border Pollution Tracker
Delhi's worst pollution comes from crop burning in Punjab/Haryana. Show a "Cross-Border Index" — percentage of Delhi's current AQI attributable to external sources vs local sources. Uses SAFAR data + wind direction analysis.

### 14. Economic Impact Calculator
"Today's AQI level costs Delhi ₹4.2 crore in lost productivity and healthcare." Uses published economic studies on air pollution costs per AQI point. Shows cumulative economic damage over days/weeks.

### 15. Citizen Report Card
Monthly/weekly report card per ward: "Your ward improved from AQI 280 to 210 this month. You submitted 3 complaints, 2 were resolved. Your ward ranks #42 out of 250." Gamifies citizen participation.

### 16. Dark Mode / Accessibility
Night shift officers need dark mode. Screen readers need ARIA labels. High contrast mode for outdoor visibility on tablets. This is a production readiness signal judges will notice.

### 17. Offline Mode (PWA)
Convert to Progressive Web App with service worker. Cache last known AQI data for offline viewing. Critical for field officers in areas with poor connectivity.

### 18. WhatsApp/Telegram Bot Integration
Most MCD officers use WhatsApp. Build a webhook that sends daily AQI briefings to WhatsApp groups. "Today's worst ward: Anand Vihar (AQI 452). GRAP Stage III active. 3 enforcement notices pending." Uses Twilio/WhatsApp Business API.

### 19. Comparative Intervention Analysis
Show a comparison matrix: "If you have ₹1 crore to spend, here are the 3 most cost-effective interventions ranked by AQI reduction per rupee." Uses published cost data for each intervention type.

### 20. Time-Lapse AQI Animation
Animate 24-hour AQI changes on the map. Show how pollution builds up during rush hours and dissipates at night. Play/pause/scrub timeline. Uses accumulated Supabase history.

---

## TIER 3: DIFFERENTIATORS FOR JUDGES

### 21. Real-Time Demo Mode
A button that simulates a pollution spike: "Watch the system respond in real-time." Shows alert generation, school notifications, enforcement notice creation, GRAP stage change — all animated in 30 seconds. Perfect for competition demo.

### 22. Data Export & Open Data
One-click CSV/JSON export of all data. Signal that the platform believes in open data. Government platforms should be transparent.

### 23. Audit Trail
Every enforcement notice, every complaint, every status change is logged with timestamp and user ID. Full audit trail for legal compliance. Government systems MUST have this.

### 24. Multi-Language Beyond Hindi/English
Add Punjabi and Urdu support. Delhi has significant populations speaking both. Shows awareness of the actual population demographics.

### 25. Accessibility Compliance (WCAG 2.1)
Screen reader support, keyboard navigation, color contrast ratios. Government platforms legally must be accessible. Few hackathon teams will think of this.
