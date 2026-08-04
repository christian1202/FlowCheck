# FlowCheck — Features & Specifications

FlowCheck provides streamlined event management, public pre-registration, QR code ticket generation, live QR scanning with Web Audio sound feedback, and attendee management.

---

## Feature Matrix

| Feature | Target Audience | Auth Required? | Status |
|---|---|---|---|
| **Public Pre-Registration** | Attendees / Public Users | No (Public Route) | ✅ Live |
| **QR Ticket Generation & Ticket Lookup** | Attendees | No | ✅ Live |
| **Google OAuth Login** | Event Admins / Staff | Yes | ✅ Live |
| **Event Creation & Editing** | Event Admins | Yes (`owner` / `editor`) | ✅ Live |
| **Team Management** | Event Admins | Yes (`owner` / `editor`; role-integrity guards protect owners) | ✅ Live |
| **QR Code Scanner PWA** | Door Scanners | Yes (`owner` / `editor` / `scanner`) | ✅ Live |
| **Web Audio API Feedback** | Door Scanners | Yes | ✅ Live |
| **Attendee Dashboard & Filtering** | Event Admins | Yes | ✅ Live |
| **Attendee CSV Export** | Event Admins | Yes | ✅ Live |
| **Google Sheets Sync** | Event Admins | Yes (cron + queue) | ✅ Live |
| **Hover Prefetch (instant navigation)** | Event Admins | Yes | ✅ Live |
| **Edge-Cached Registration Pages (ISR)** | Attendees / Public Users | No | ✅ Live |

---

## Core Feature Descriptions

### 1. Public Pre-Registration
- **No Account Required**: Anyone with an event link (`/events/[slug]/register`) can complete the pre-registration form.
- **Form Fields**: Full Name, Email Address, Local Congregation/Chapter, District, Zone, and Duty (Tungkulin).
- **Validation**: Enforces capacity limits (`max_attendees`), checks event status (`open`), verifies expiration (`closes_at`), and prevents duplicate emails for the same event.
- **Instant QR Ticket**: Upon successful submission, attendees receive an instant QR code token on screen with a download button, as well as an email lookup option to retrieve their ticket later.

### 2. QR Code Scanner PWA with Web Audio API Feedback
- **Web-Based Scanner**: Uses `html5-qrcode` to scan QR code tickets using mobile rear cameras or desktop webcams.
- **Audio Feedback**: Utilizes Web Audio API synthesized tones (zero static audio files) for audio cues:
  - **Success**: Two-tone chime (880 Hz → 1174.66 Hz) for valid check-ins.
  - **Duplicate**: Double beep (660 Hz) when scanning an already checked-in ticket.
  - **Error / Closed**: Low descending tone (440 Hz → 220 Hz) for invalid QR codes or closed events.
- **Visual Overlays**: Displays instant full-screen color-coded overlays (Green, Yellow, Red) with attendee information (Name, Local, Duty).

### 3. Team & Permission Roles
- **Owner**: Full permissions over event settings, details, team members, and deletion.
- **Editor**: Can edit event information, view attendees, and run QR scanner.
- **Scanner**: Restricted to scanner PWA interface only.

### 4. Attendee Dashboard & Live Metrics
- Live tracking of registered vs checked-in attendees.
- Filter by status (`registered`, `checked_in`), search by attendee name or email.
- Real-time statistics and check-in timeline.
- CSV export (`/api/export-attendees`, admin-scoped) and automatic Google Sheets sync.

### 5. Performance Features
- **Hover prefetch**: hovering any dashboard link or event card prefetches the route and warms the target page's data caches (KV-backed), so navigation paints near-instantly.
- **Edge-cached registration pages**: public `/events/[slug]/register` pages are ISR-cached at the edge (~30–60s) and invalidated on publish/update/delete.
- **Data caching**: all page-facing queries run through tenant-scoped `unstable_cache` (30–60s TTL) with `revalidateTag` invalidation on every mutation.
