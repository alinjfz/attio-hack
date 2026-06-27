# Image generation prompts

Replace the SVG placeholders in `pitch.html` with generated PNG/WebP files. Keep the same filenames (without extension change) or update the `<img src>` paths in the HTML.

| File | Dimensions | Used in |
|------|------------|---------|
| `logo.png` | 512×512 | Nav, footer |
| `hero.png` | 1920×1080 | Hero section |
| `architecture.png` | 1600×900 | Architecture section |

---

## logo.png

**Prompt:**
```
Minimal vector app icon for "Recruiting Copilot". Concept: abstract person silhouette merged with a fit-score gauge or magnifying glass, plus a small checkmark representing human approval before CRM write-back. Geometric, balanced, recognizable at 64px. Flat design, 2–3 colors max: deep slate blue primary, green accent for approval/checkmark, optional subtle amber dot for tier signal. Clean rounded square app icon format, no gradients or heavy shadows. Professional recruiting + CRM SaaS identity. Simple, memorable, not generic AI robot head.
```

**Negative prompt:**
```
photorealistic, 3D render, complex details, thin lines that blur at small size, robot face, brain icon, gradient overload, text inside icon, multiple competing symbols
```

---

## hero.png

**Prompt:**
```
Professional SaaS hero illustration for "Recruiting Copilot", an AI recruiting assistant embedded inside a modern CRM. Scene: a recruiter at a laptop reviewing a candidate profile in a clean, minimal CRM interface. On screen: fit score percentage (e.g. 87%), tier badge labeled Strong in green, pros/cons bullet points, and a prominent Approve button — emphasizing human-in-the-loop before anything writes to the CRM. Soft split composition: human recruiter on one side, polished product UI on the other. Style: modern B2B SaaS, Attio-inspired minimalism, light background, soft shadows, white and slate gray with accent colors green (Strong), blue (Good), amber (Weak). Calm, trustworthy, professional — not sci-fi, not cyberpunk. Wide cinematic composition, high detail, crisp and readable at thumbnail size.
```

**Negative prompt:**
```
robot hiring people, dark cyberpunk, neon glow, cluttered dashboard, stock photo watermark, generic corporate clip art, too much text, illegible UI text, cartoonish, overly futuristic AI brain imagery
```

---

## architecture.png

**Prompt:**
```
Clean isometric architecture infographic for "Recruiting Copilot" recruiting AI pipeline. Center node: Attio CRM labeled "Context Hub" with candidate profile and role data. Left flow: CV text + role description inputs. Middle pipeline stages in sequence: (1) Semantic Fit Scoring, (2) AI Draft Generation, (3) Human Approval Gate. Right output: CRM fields updated only after approval — fit score, tier, HM note, submittal draft. Optional side branch: n8n webhook workflow mirroring the same pipeline. Style: modern B2B tech infographic, soft blue and white palette, subtle green/blue/amber for tier states, thin connecting arrows, rounded node cards, light background. Isometric or flat infographic style, minimal labels, no clutter, professional hackathon submission quality. Readable at medium size, clean lines, no photorealism.
```

**Negative prompt:**
```
photorealistic, messy flowchart, hand-drawn sketch, dark background, too many logos, tiny unreadable text, 3D glass morphism overload, corporate PowerPoint clipart
```

**Add labels in Figma after generation** (generators often garble text):
```
Attio CRM → CV + Role → Fit Scoring → Draft Generation → Human Approval → Write-back
Side path: n8n → Webhook API → Same Core Pipeline
```

---

## After generating

1. Save files to `docs/assets/` as `logo.png`, `hero.png`, `architecture.png`
2. In `docs/pitch.html`, change each `src="assets/logo.svg"` (etc.) to `.png`
3. Optional: add `hero.webp` variants for smaller file size
