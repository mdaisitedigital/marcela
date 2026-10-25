@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node.js 20 ou superior e abra este arquivo novamente.
  echo Download oficial: https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Preparando o aplicativo. Na primeira vez pode demorar alguns minutos...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias. Confira a conexao com a internet.
    pause
    exit /b 1
  )
)
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:3000/admin"
call npm start
pause
