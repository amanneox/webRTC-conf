# System Architecture & Design Decisions

This document explains the core architectural choices for this WebRTC video conferencing app.

---

## 1. The Core Decision: Mesh Topology

The single most important decision in any WebRTC app is the network topology. I chose **Full Mesh (Peer-to-Peer)** over an SFU (Selective Forwarding Unit) or MCU.

### Why I Chose Mesh

| Priority | Reason | Impact |
|----------|--------|--------|
| 1 | **Zero Media Server Cost** | Media never touches our servers. We only pay for lightweight signaling (text). Bandwidth is the #1 cost in video apps; we avoid it entirely. |
| 2 | **Simplicity** | No need to set up/manage Mediasoup, Janus, or Pion. For a small-group use case, Mesh is "good enough" without the ops overhead. |
| 3 | **Lowest Latency** | Media travels directly between users. No middleman = fastest possible path. |
| 4 | **True E2E Encryption** | The server never decrypts media. An SFU typically decrypts/re-encrypts streams, which is a privacy trade-off. |

### The Trade-off (Why Not Everyone Uses Mesh)

Mesh doesn't scale.

*   **Problem**: Each user uploads their stream to *every* other user. With 5 users, each person sends 4 streams and receives 4.
*   **Limit**: Works great for <6 users. Beyond that, client CPU/bandwidth become bottlenecks.
*   **My Mitigation**: For this project's scope (small meetings), Mesh is correct. If scaling to 20+ users, an SFU layer could be added *without* rewriting the signaling logic.

---

## 2. Technology Stack

### Frontend: Next.js + TypeScript
*   Chosen for its hybrid rendering (SSR for auth checks, CSR for the app).
*   **Shadcn/UI** provides accessible, unstyled components—no heavy library bloat.

### Backend: NestJS
*   Angular-like modular structure prevents "spaghetti code" as the app grows.
*   First-class **Socket.io Gateway** support makes signaling clean via decorators (`@SubscribeMessage`).

### Database: PostgreSQL + Prisma
*   Relational model fits the data: `User` **owns** `Room` **has many** `Participants`.
*   **Prisma** generates TypeScript types from the schema, preventing runtime type errors.

### Signaling: Socket.io
*   Used *only* for signaling (exchanging offers/answers/ICE candidates).
*   Provides fallback (long-polling) if WebSockets are blocked.

---

## 3. How the System Works (Data Flow)

### Phase 1: Room Creation
1.  Host calls `POST /rooms` → Room ID returned.
2.  Host connects to Socket.io and joins `room-{id}`.

### Phase 2: Signaling (The Handshake)
When a Guest joins:
1.  Guest emits `join-room`. Server adds them to the socket room.
2.  Server notifies existing peers: "new user joined."
3.  Existing peers create an **SDP Offer** (their media capabilities) and send it via the server.
4.  Guest receives the offer, creates an **SDP Answer**, sends it back.
5.  Both sides exchange **ICE Candidates** (network paths) to find a route through firewalls/NATs.

### Phase 3: Media Exchange (P2P)
1.  Once ICE completes, a direct UDP connection is established.
2.  **The signaling server is now ignored.** Video/audio flows peer-to-peer.
3.  Server re-engages only for state changes (mute, kick, leave).

---

## 4. Security Model

| Aspect | How It's Handled |
|--------|------------------|
| **Host Auth** | JWT tokens. Required for room creation/deletion. |
| **Guest Auth** | None required. Guests get ephemeral, random IDs. |
| **Room Ownership** | Only the host can kick/mute/delete. Verified server-side against DB. |
| **Media Privacy** | E2E encrypted by default (WebRTC SRTP). Server never sees media. |
