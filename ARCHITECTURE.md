# System Architecture & Design Decisions

High-level architectural choices and trade-offs, focusing on the WebRTC mesh topology.

---

## 1. WebRTC Network Topology: Mesh (Peer-to-Peer)

I chose **Full Mesh** over an SFU/MCU topology. This means every participant connects directly to every other participant.

### Why Mesh?

1.  **Zero Infrastructure Cost (Serverless Media)**: 
    *   In a Mesh topology, media streams (Audio/Video) flow *directly* between participants (Peer-to-Peer).
    *   **Impact**: Our servers **do not process or relay media**. This dramatically reduces server costs to near zero, as bandwidth is the most expensive part of video hosting. We only pay for the lightweight signaling traffic (text commands).
    
2.  **Lowest Latency**:
    *   Because media travels directly from Peer A to Peer B without a middleman server, latency is theoretically the lowest possible (limited only by the physical distance between users).

    *   Privacy: The server never touches the media stream. It's truly End-to-End Encrypted (E2EE) by default. An SFU typically decrypts/re-encrypts media.

4    *   Complexity vs. Value: SFUs (Mediasoup, Janus) are complex to operate (codecs, CPU scaling). For small groups (2-5 people), Mesh gives us 80% of the value for 5% of the effort.

### The Trade-off (Honest Assessment)
*   **Scalability**: Mesh requires every client to upload their stream to every other client. If there are 5 users, each user sends 4 streams and receives 4.
*   **Limit**: This works great for < 6 users. Beyond that, client CPU and bandwidth become bottlenecks.
*   **Mitigation**: For this project scope, Mesh is the correct architectural choice. If we scaled to 20+ users, we would simply introduce an SFU middleware without changing the core signaling logic.

---

## 2. Technology Stack

### Frontend: Next.js 14 + TypeScript
*   **Why**: Next.js provides a robust framework for both static marketing pages (if needed) and dynamic app routes.
*   **SSR (Server Side Rendering)**: Allows us to perform auth checks and redirect users *before* the React app even hydrates, providing a secure and snappy user experience.
*   **Shadcn/UI**: Used for accessible, high-quality component design without the bloat of heavy component libraries.

### Backend: NestJS
*   **Why**: NestJS provides an Angular-like modular architecture on top of Node.js.
*   **Strict Structure**: It forces a clean separation of concerns (Controllers vs Providers/Services). This is crucial for a potential large-scale application where "spaghetti code" can become a liability.
*   **WebSocket Gateway**: NestJS has first-class support for Socket.io Gateways, making the signaling server implementation clean and declarative using decorators (`@SubscribeMessage`).

### Database: PostgreSQL + Prisma
*   **Why Relational?**: Users, Rooms, and Participants have clear relationships. 
    *   A `Room` *has many* `Participants`.
    *   A `User` *owns* a `Room`.
*   **Why Prisma?**: It provides end-to-end type safety. The database schema (`schema.prisma`) generates the TypeScript types used in the backend, preventing endless classes of runtime errors.

### Signaling: Socket.io
*   **Role**: Used **only** for signaling (Signaling Phase).
*   **Function**: Before peers can connect P2P, they need to verify they exist and exchange network information (ICE Candidates) and media capability (SDP Offers/Answers).
*   **Reliability**: Socket.io handles fallback (long-polling) if WebSockets are blocked by corporate firewalls, ensuring the signaling channel is robust.

---

## 3. High-Level Data Flow

### 1. Room Creation
1.  **Host** creates room via API (`POST /rooms`).
2.  Room ID returned. Host joins socket room `room-{id}`.

### 2. Signaling (The Handshake)
When **Guest** joins:
1.  **Join**: Emits `join-room`. Socket server adds them to the room.
2.  **Discovery**: Server notifies existing peers.
3.  **Negotiation**: 
    - Existing peers create an **SDP Offer**.
    - Server relays offer to Guest (without storing it).
    - Guest answers with **SDP Answer**.
    - Server relays answer back.
4.  **Traversal**: Peers exchange **ICE Candidates** (IP:Port pairs) through the server to find a path through firewalls/NATs.

### 3. Media Exchange (P2P)
1.  Once connected, the **Signaling Server is ignored**.
2.  Video/Audio flows directly via UDP between computers.
3.  **Signaling Server Re-engages** only for state changes (Mute toggle, User left, Kick).

---

## 4. Security
*   **Authentication**: JWT (JSON Web Tokens) for Hosts. Guests rely on ephemeral, cryptographically secure random IDs.
*   **Room Ownership**: Only the creator (Host) has the authority to issue `kick-participant` or `delete-room` commands. These are verified backend-side against the DB record.
