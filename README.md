# PixelShrink Studio Android

This repository now includes a native Android app scaffold at:

- `./android`

The existing `frontend/` (React) and `backend/` (Python) folders are kept intact for future API/tool integration.

## Android stack

- Kotlin
- Jetpack Compose
- Navigation Compose
- Application ID: `com.pixelshrink.studio`
- Min SDK: 24
- Target/Compile SDK: 34
- Version: `1.0.0` (`versionCode = 1`)

## Implemented in the Android app

- Branded PixelShrink Studio home screen (light background + green accent)
- Hero section and category row
- Tool grid cards for:
  - Shrink Image
  - Remove Background
  - Crop Image
  - Image Filters
  - Moustachify
  - PDF → Word
  - Word → PDF
  - Compress Video
  - Video → MP3
  - AI Image Generator
  - Text to Image
- Placeholder destinations/screens for each tool
- Navigation shell ready for extending each tool flow

## Open in Android Studio

1. Open Android Studio.
2. Choose **Open**.
3. Select `./android` (the `android` folder in this repository).
4. Let Gradle sync complete.
5. Run the `app` configuration on an emulator/device.

## CLI build (from repo root)

```bash
cd android
./gradlew assembleDebug
```

## Next steps for real feature wiring

For each placeholder tool screen:
- Add file picker/camera/gallery UX
- Connect to existing backend APIs (or device-side processing)
- Add loading/progress/error/success states
- Add analytics and crash reporting

## Play Store readiness checklist (next)

1. **Set final package name** (if you want something different from `com.pixelshrink.studio`).
2. Generate upload keystore and configure signing.
3. Build release AAB:
   ```bash
   ./gradlew bundleRelease
   ```
4. Prepare Play Console listing assets:
   - App icon
   - Feature graphic
   - Phone screenshots
   - Short + full description
   - Privacy policy URL
5. Complete Data Safety form based on actual APIs/SDKs used.
6. Publish to Internal testing track first, then roll out production.
