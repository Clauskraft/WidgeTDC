# WidgeTDC Mobile App

Android/iOS companion app for the WidgeTDC enterprise widget dashboard platform.

## Quick Start

```bash
# Install dependencies
cd apps/mobile
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## Environment Variables

Create a `.env` file in the mobile app directory:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:3001
```

For local development with Android emulator, use:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

## Features

- **Home Dashboard**: Quick access to all features and system status
- **Knowledge Search**: Search the vidensarkiv (knowledge archive) with Graph RAG
- **Notes**: Create, view, and manage notes synced with backend
- **Task Automation**: Review and approve TaskRecorder automation suggestions
- **Agent Control**: Monitor and trigger autonomous agents

## Architecture

```
apps/mobile/
├── App.tsx                 # Main entry point
├── src/
│   ├── api/
│   │   └── client.ts       # API client for MCP backend
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── NotesScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── AgentsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── store/
│   │   └── appStore.ts     # Zustand state management
│   └── theme/
│       └── colors.ts       # Theme colors
```

## Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Android App Bundle (Play Store)

```bash
eas build --platform android --profile production
```

## Health Check

The app automatically checks backend connectivity on startup. You can manually test:

1. Open the app
2. Go to Settings
3. Tap "Test forbindelse"

## Security Notes

- Agents cannot execute critical actions without user approval
- All API calls go through the authenticated MCP system
- TaskRecorder suggestions require explicit user consent

## Tech Stack

- **Expo** - React Native framework
- **React Navigation** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **TypeScript** - Type safety

