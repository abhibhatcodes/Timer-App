# TimerApp

TimerApp is a React Native-based timer application. This repository contains the source code and the APK for the app.

## Features
- Timer with customizable duration
- Clean UI and intuitive controls
- Built using React Native
- Implemented local storage (AsyncStorage) for data persistence and a history log for completed timers.
- User can start, pause, reset and delete timers.
- Added bulk actions, progress visualization, and user alerts for an enhanced user experience
- Added Dark mode support
  


> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

🤔 🤔 Assumptions Made During Development

    The app will primarily be run on devices/emulators with a properly set up development environment as per the React Native setup guide.
    Users have access to physical devices or emulators for testing Android and iOS builds.
    Code quality tools (like ESLint and Prettier) are installed and enforced during development.
    No platform-specific native modules (other than those included in React Native) were required for this app.

🔗 Download the APK

https://github.com/abhibhatcodes/Timer-App/releases/download/v1.0/app-release.apk

