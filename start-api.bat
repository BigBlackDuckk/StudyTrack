@echo off
cd /d "C:\Users\hernandez\3D Objects\StudyTrack-main\backend"
echo Instalando dependencias (se necessario)...
npm install
echo.
echo Iniciando a API StudyTrack...
echo Acesse: http://localhost:3333
echo Pressione Ctrl+C para parar
echo.
npm run dev
pause