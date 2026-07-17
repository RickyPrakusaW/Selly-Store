# Seli Florist Flutter Web

Flutter Web storefront integrated with the local NestJS API.

## Local development

Start PostgreSQL, Redis, and the backend first:

```powershell
cd D:\seli_project\backend
npm run start:dev
```

Then resolve Flutter packages and use port `5173`, which is included in the backend's default CORS allowlist:

```powershell
cd D:\seli_project\frontend
flutter pub get
flutter run -d chrome --web-port 5173
```

The default API URL is `http://localhost:3000/api`. Override it for another environment without editing source:

```powershell
flutter run -d chrome --web-port 5173 --dart-define=API_BASE_URL=https://api.example.com/api
```

Access tokens remain in application memory. Refresh tokens are browser-managed `httpOnly` cookies; Dio's web adapter enables credentialed requests. Reloading the app attempts a refresh-cookie session restoration.

## Checks

```powershell
dart format lib test
flutter analyze
flutter test
```
