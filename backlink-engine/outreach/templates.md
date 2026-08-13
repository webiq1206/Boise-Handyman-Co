# Outreach & acquisition templates

The engine drafts a personalized message from these per-channel templates and queues it in
`outreach/queue.json`. **Nothing sends automatically** - a human approves each batch. Placeholders
in `{{curly}}` are filled per opportunity. Keep every message honest, specific, and non-spammy;
generic mass-mail is what triggers the very penalties this program avoids.

**HOLD: do not enable sends until boisehandyman.co has SPF, DKIM, and DMARC verified in Resend.**
Outreach from an unauthenticated domain lands in spam and burns the new domain's reputation before
it has one. See EMAIL_DELIVERABILITY_SETUP.md at the repo root.

Signature block for all emails:
```
{{senderName}}
Boise Handyman Co · boisehandyman.co
{{senderPhone}} · Boise / Treasure Valley, ID
```

---

## 1. Self-serve profile / citation (Houzz, Angi, Yelp, BirdEye, Alignable, Chamber, citation pack)
No email. Engine produces a **submission packet** (`outreach/citations/{{id}}.json`) with the exact
NAP + fields to enter, and a checklist. A human (or a form-fill automation with approval) submits.
```
Business name: Boise Handyman Co
Category: Handyman / Home Repair Service
NAP: {{address}} · {{phone}} · boisehandyman.co
Hours / service area: Boise, Meridian, Eagle, Nampa, Star, Kuna, Middleton, Caldwell
Short desc (155 char): {{shortDescription}}
Long desc: {{longDescription}}
Photos: {{portfolioAssets}}
```

## 2. Association / program application (chamber of commerce, local trade and business groups)
```
Subject: Membership inquiry - Boise Handyman Co (local handyman service)

Hi {{orgName}} team,

We're a handyman service handling small home repairs, installs, and maintenance across the
Treasure Valley and would like to join {{orgName}} / apply to {{programName}}. Could you send
current membership requirements, dues, and the directory-listing details?

We focus on {{specialties}}. Happy to provide references.

Thanks,
{{signature}}
```

## 3. Digital PR - journalist query response (Featured/Qwoted, Statesman, BoiseDev)
```
Subject: Re: {{queryTitle}} - expert source (Boise handyman)

Hi {{journalist}},

Responding to your query on {{topic}}. I'm {{senderName}} with Boise Handyman Co, a home repair
and handyman service in Idaho's Treasure Valley.

{{2-4 sentence, genuinely useful, quotable answer with a concrete local data point or number}}

Feel free to quote directly. Credit: {{senderName}}, Boise Handyman Co (boisehandyman.co).
More detail or a photo on request.

{{signature}}
```
Rule: only respond when we can add real expertise/data. No filler. This keeps acceptance high and
protects sender reputation.

## 4. Unlinked brand-mention reclamation
```
Subject: Thanks for the mention - quick request

Hi {{name}},

Thank you for mentioning Boise Handyman Co in "{{pageTitle}}" ({{pageUrl}}) - we appreciate it.
Would you be open to linking the mention to our site so readers can find us directly?
{{ourUrl}} is the best page. Either way, thanks for the kind words.

{{signature}}
```

## 5. Resource-page / broken-link building
```
Subject: A resource for your {{pageTopic}} page

Hi {{name}},

I was reading your {{pageTopic}} page ({{pageUrl}}) - genuinely useful.
{{IF broken}} I noticed the link to {{deadTarget}} no longer resolves. {{ENDIF}}
We published a guide that may be a good fit for your readers: "{{ourGuideTitle}}" ({{ourGuideUrl}}) -
it covers {{whatItCovers}} for Treasure Valley homeowners.

No worries either way - just thought it might help.

{{signature}}
```

## 6. Supplier / manufacturer installer-locator request
```
Subject: Installer listing request - {{brandName}}

Hi {{brandName}} team,

Boise Handyman Co installs {{brandProducts}} for homeowners across the Treasure Valley. Could you
add us to your "Find an Installer" locator? Details:
{{NAP + service area + account/rep if any}}

Thanks,
{{signature}}
```

## 7. Local partnership (realtors, property managers, designers, stagers, photographers)
```
Subject: Referral partnership - home repairs + {{theirTrade}}

Hi {{name}},

We're a Treasure Valley handyman service and regularly work alongside {{theirTrade}}s - inspection
repair lists, make-ready punch lists, and small fixes their clients need handled quickly. We'd
love to explore a referral partnership and cross-list each other as trusted local resources
(a linked mention on each site's partners/resources page). Open to a quick call?

{{signature}}
```
