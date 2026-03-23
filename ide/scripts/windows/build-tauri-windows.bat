@echo off
setlocal

cd /d "%~dp0\..\.."

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm no esta disponible en PATH.
  exit /b 1
)

where cargo >nul 2>nul
if errorlevel 1 (
  echo [ERROR] cargo no esta disponible en PATH.
  exit /b 1
)

echo [INFO] Construyendo la aplicacion Tauri para Windows...
call npm run tauri build
if errorlevel 1 (
  echo [ERROR] La build ha fallado.
  exit /b 1
)

echo [OK] Build completada.
echo [INFO] Revisa los artefactos en src-tauri\target\release\bundle

exit /b 0
