---
name: Email provider decision
description: Why this project sends transactional email via Resend, not Gmail/Google Workspace
---

# Transactional email sends via Resend

Outbound transactional email (quote/consultation/lead-marketplace notifications) goes through Resend, From `hello@boisehandyman.co`.

**Why:** A Gmail/Google Workspace approach was attempted and abandoned. The Gmail API only sends from the *authenticated* account or a *verified* send-as alias. The connected `google-mail` connector account turned out to be a *separate* Workspace (`admin@timberandlove.com`) that does NOT have `hello@boisehandyman.co` as a verified alias, so Gmail silently sent from the primary address. Reconnecting could not be confirmed to fix it, and `admin@timberandlove.com` / `hello@p5homeco.com` are entirely separate accounts.

**How to apply:**
- Do not re-attempt Gmail sending unless the connected Google account is confirmed to own `hello@boisehandyman.co` as a verified send-as alias (or as its primary).
- For Resend, the From domain (`boisehandyman.co`) must be a verified domain in the Resend account that owns `RESEND_API_KEY`. NOTE: the earlier "verified by a real test send" result applied to the OLD domain before the August 2026 rebrand; `boisehandyman.co` is a new domain and must be added and verified in Resend (SPF/DKIM/DMARC, see EMAIL_DELIVERABILITY_SETUP.md) before any send is trusted.
- Resend's `emails.send()` can return `{ data, error }` WITHOUT throwing on API-level failures — always inspect `result.error` at every call site, don't assume success after `await`.
