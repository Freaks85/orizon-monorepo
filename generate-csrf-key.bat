@echo off
echo Generating CSRF secret key...
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
echo Copy this key to your .env.local as CSRF_SECRET=
pause
