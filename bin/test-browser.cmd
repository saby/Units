echo *** Run unit tests via browser ***

node -v
node node_modules/selenium-standalone/bin/selenium-standalone install
node "%~dp0\..\list.build"
node "%~dp0\..\scripts\queue" "%~dp0\..\scripts\app" "%~dp0\..\browser.run"