# Unolo Full Stack Intern - Research Assignment

## Overview

This is a separate research-based assignment in addition to the coding assignment. The goal is to evaluate your ability to research technical topics, understand trade-offs, and communicate your findings clearly.

**Expected Length:** 1-2 pages (500-800 words)  
**Format:** Markdown file named `RESEARCH.md`  
**Submit:** Along with your coding assignment

---

## Research Question

### Real-Time Location Tracking: Choose Your Architecture

Unolo's Field Force Tracker needs a new feature: **real-time location tracking**. Instead of manual check-ins, we want to continuously track field employees' locations and show them live on a manager's dashboard.

**Your task:** Research and recommend an architecture for implementing real-time location updates from mobile devices to a web dashboard.

---

## What to Cover

### 1. Technology Comparison

Compare at least **3 different approaches** for real-time communication:

- WebSockets
- Server-Sent Events (SSE)
- Long Polling
- HTTP/2 Push
- Third-party services (Firebase, Pusher, Ably, etc.)

For each approach, discuss:
- How it works (brief explanation)
- Pros and cons
- When to use it

### 2. Your Recommendation

Based on your research, recommend ONE approach for Unolo's use case. Justify your choice considering:

- **Scale:** 10,000+ field employees sending location updates every 30 seconds
- **Battery:** Mobile devices need to conserve battery
- **Reliability:** Updates should work on flaky mobile networks
- **Cost:** We're a startup with limited budget
- **Development time:** We have a small engineering team

### 3. Trade-offs

Explicitly discuss what trade-offs your recommendation involves:
- What are you sacrificing by choosing this approach?
- What would make you reconsider this choice?
- At what scale would this approach break down?

### 4. High-Level Implementation

Provide a brief outline of how you would implement this:
- What changes to the backend?
- What changes to the frontend/mobile?
- What infrastructure would you need?

---

## Evaluation Criteria

| Criteria | What We Look For |
|----------|------------------|
| **Research Depth** | Did you actually research multiple options? Are your facts accurate? |
| **Trade-off Analysis** | Do you understand there's no "perfect" solution? Can you articulate pros/cons? |
| **Practical Thinking** | Is your recommendation realistic for a startup? Did you consider cost, time, team size? |
| **Communication** | Is your writing clear and well-organized? Can a non-expert follow your reasoning? |
| **Honesty** | Do you acknowledge what you don't know? Do you avoid over-confident claims? |

---

## Tips

- **Don't just Google and copy.** We want YOUR analysis, not a summary of blog posts.
- **It's okay to say "I don't know."** If you're unsure about something, say so. We value honesty.
- **Include sources.** If you reference specific benchmarks or facts, link to where you found them.
- **Think like an engineer, not a student.** We don't want a textbook answer. We want to see how you'd make a real decision.

---

## Submission

Include `RESEARCH.md` in your GitHub repository alongside the coding assignment.

---

Good luck! We're excited to see your analysis. 🚀
