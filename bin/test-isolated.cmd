echo *** Run unit tests via Node.js ***

node -v
node "%~dp0\..\scripts\mocha" -t 10000 -R xunit "%~dp0\..\isolated.run"
