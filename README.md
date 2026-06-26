# Connectify

A modern real-time random chat platform built with Next.js and Firebase. Connect with strangers around the world via text or video chat.

## 🚀 Live Features

- **Real-time Video Chat** — WebRTC peer-to-peer video with mic/camera controls, country filter, and gender selector
- **Real-time Text Chat** — Firestore-powered instant messaging with stranger matching
- **User Profiles** — Customizable display name, profile photo, university, and course
- **Live Online Counter** — Real-time presence tracking showing active users
- **Safety Page** — Community guidelines and safety tips
- **Authentication** — Google OAuth and Email/Password sign-in via Firebase Auth

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Auth | [Firebase Authentication](https://firebase.google.com/docs/auth) |
| Video | [WebRTC](https://webrtc.org/) (peer-to-peer, STUN servers) |
| Fonts | Space Grotesk + Inter (Google Fonts) |
| Icons | [Lucide React](https://lucide.dev/) |
| Deployment | [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) |

## 📁 Project Structure

```
src/
├── app/
│   ├── chat/
│   │   ├── text/        # Real-time text chat page
│   │   └── video/       # WebRTC video chat page
│   ├── faq/             # Help center / FAQ
│   ├── login/           # Auth page (Google + Email)
│   ├── profile/         # User profile customization
│   ├── safety/          # Safety guidelines
│   └── page.tsx         # Home page
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx
│   │   ├── ConditionalSidebar.tsx
│   │   └── Footer.tsx
│   └── ui/              # shadcn/ui components
├── firebase/            # Firebase config, hooks, providers
└── hooks/               # Custom React hooks
```

## 🔧 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mistOfTime/Connectify.git
cd Connectify
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) and update `src/firebase/config.ts` with your credentials.

Enable these Firebase services:
- **Authentication** — Google provider + Email/Password
- **Firestore** — with the following rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    match /videoChatRooms/{roomId} {
      allow read, write, delete: if request.auth != null;
      match /offerCandidates/{doc} { allow read, write: if request.auth != null; }
      match /answerCandidates/{doc} { allow read, write: if request.auth != null; }
      match /messages/{msg} { allow read, write: if request.auth != null; }
    }
    match /textChatRooms/{roomId} {
      allow read, write, delete: if request.auth != null;
      match /messages/{msg} { allow read, write: if request.auth != null; }
    }
    match /presence/{userId} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002)

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Home — online counter, feature cards |
| `/login` | Sign in with Google or Email |
| `/profile` | Customize name, photo, university, course |
| `/chat/text` | Real-time text chat with strangers |
| `/chat/video` | WebRTC video + audio chat |
| `/safety` | Community rules and safety tips |
| `/faq` | Help center |

## 👤 Author

Made by [@freedom15073](https://www.instagram.com/freedom15073/)
