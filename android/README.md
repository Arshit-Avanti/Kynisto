# Kynisto Android shell

This module is a lightweight native WebView shell for the deployed Kynisto site. It does not duplicate or bundle the website frontend. Normal website, dashboard, chat, healthcare, queue, content, and data updates appear in the installed app after deployment.

Native changes (package name, permissions, notification SDKs, icons, Android integration) require a new APK/AAB.

## Release signing

Signing credentials stay outside the source tree. Set these environment variables before a release build:

- `KYNISTO_KEYSTORE_PATH`
- `KYNISTO_KEYSTORE_PASSWORD`
- `KYNISTO_KEY_ALIAS`
- `KYNISTO_KEY_PASSWORD`
- optional `KYNISTO_VERSION_CODE` and `KYNISTO_VERSION_NAME`

Build with `gradlew.bat assembleRelease bundleRelease`. Release builds fail rather than silently producing an unsigned artifact when signing configuration is missing.

Minimum Android version is Android 7.0 (API 24), target/compile API is 35, and the app supports responsive portrait and landscape layouts.
