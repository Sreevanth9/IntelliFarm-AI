# IntelliFarm AI

IntelliFarm AI is a MERN smart agriculture platform for farmers. It combines public website pages with an authenticated dashboard experience for weather intelligence, crop guidance, fertilizer advice, market awareness, government schemes, community support, and an AI farming assistant.

## Features

- Public website routes for home, about, services, and contact
- Dashboard/app routes for farm workflows
- Google OAuth-based authentication flow
- Protected dashboard, profile, and community routes
- Weather and forecast services
- Gemini-powered crop, fertilizer, and farming guidance
- Central frontend API client, constants, and theme files
- Reusable layout, loader, empty state, navbar, sidebar, and footer components

## Architecture

- `client/` contains the React frontend.
- `server/` contains the Express, MongoDB, auth, weather, and AI APIs.
- `server/config/` contains DB and external API configuration.
- `server/utils/` contains reusable backend helpers.
- `client/src/services/api.js` centralizes frontend API access.
- `client/src/layouts/MainLayout.jsx` owns the app shell for dashboard pages.

## Folder Structure

```text
IntelliFarm-AI/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   └── package.json
├── docs/
├── screenshots/
├── README.md
└── .gitignore
```

## Installation

Install and run the backend:

```bash
cd server
npm install
npm run dev
```

Install and run the frontend:

```bash
cd client
npm install
npm start
```

## Environment Variables

Server:

```text
MONGO_URI=
GEMINI_API_KEY=
OPENWEATHER_API_KEY=
CLIENT_REDIRECT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URL=
ACCESS_TOKEN_JWT_SECRET=
REFRESH_TOKEN_JWT_SECRET=
ACCESS_TOKEN_EXPIRETIME=15m
REFRESH_TOKEN_EXPIRETIME=7d
APPLICATION_TYPE=dev
COOKIE_DOMAIN=localhost
```

Client:

```text
REACT_APP_SERVER_ENDPOINT=http://localhost:3030
REACT_APP_GEMINI_KEY=
REACT_APP_GOOGLE_CLIENT_ID=
REACT_APP_GOOGLE_CLIENT_SECRET=
REACT_APP_GOOGLE_OAUTH_REDIRECT_URL=
```

## APIs Used

- Google Gemini API for AI farming guidance
- OpenWeather API for live weather and forecasts
- Google OAuth API for authentication
- MongoDB for users, chats, and chat history

## Screenshots

Store project screenshots in `screenshots/`:

- `homepage`
- `weather`
- `dashboard`
- `ai-assistant`
- `crop-advisor`

## Future Scope

- Production deployment
- Stronger auth hardening
- API caching and optimization
- Advanced crop recommendation models
- Farmer-specific saved reports and alerts
