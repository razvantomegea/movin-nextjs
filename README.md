# Movin App

A fitness tracking app with rewards, built with Next.js and Capacitor for cross-platform deployment.

## Features

- Track steps, workouts, and fitness goals
- Earn rewards for completing activities
- Progressive Web App (PWA) support
- Native iOS and Android deployment via Capacitor
- Dark/Light theme support

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- For iOS: macOS with Xcode 13+
- For Android: Android Studio with SDK tools

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/movin-app.git
cd movin-app
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Initialize Capacitor
\`\`\`bash
npm run cap:init
\`\`\`

### Development

#### Web Development

\`\`\`bash
npm run dev
\`\`\`

#### Building for Production

\`\`\`bash
# Build for web (PWA)
npm run build

# Build for mobile platforms
npm run build:mobile
\`\`\`

### Deploying to Mobile Platforms

#### Android

\`\`\`bash
# Add Android platform (if not already added)
npm run cap:add:android

# Sync web code to Android project
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
\`\`\`

In Android Studio:
1. Wait for Gradle sync to complete
2. Click "Run" to build and run on an emulator or connected device

#### iOS

\`\`\`bash
# Add iOS platform (if not already added)
npm run cap:add:ios

# Sync web code to iOS project
npm run cap:sync

# Open in Xcode
npm run cap:open:ios
\`\`\`

In Xcode:
1. Select a development team in the Signing & Capabilities tab
2. Select a device or simulator
3. Click "Run" to build and run the app

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components
- `/public` - Static assets
- `/android` - Android project (after adding the platform)
- `/ios` - iOS project (after adding the platform)

## Capacitor Configuration

The Capacitor configuration is in `capacitor.config.ts`. You can modify this file to change app settings, plugins, and more.

## Adding Capacitor Plugins

\`\`\`bash
npm install @capacitor/plugin-name
npx cap sync
\`\`\`

## Troubleshooting

### iOS Build Issues

- Make sure you have the latest Xcode command line tools: `xcode-select --install`
- Check that your Apple Developer account has the necessary provisioning profiles

### Android Build Issues

- Make sure you have the latest Android SDK tools
- Check that the Android SDK path is correctly set in your environment

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

Let's create a .gitignore file to exclude Capacitor-generated files:

```plaintext file=".gitignore"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Capacitor
/android/
/ios/
/dist/
capacitor.config.json
