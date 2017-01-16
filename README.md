# UNIT-тесты в окружении WS
Подключить модуль в виде зависимости в файле package.json вашего модуля:

    "dependencies": {
        "ws-unit-testing": "git+https://git.sbis.ru/ws/unit-testing.git#development"
    }

И установить:

    npm install

В корне вашго модуля должен находиться файл contents.js.

## Запуск под Node.js
1. Создать файл, запускающий тесты (testing-node.js):

        var path = require('path'),
           app = require('ws-unit-testing/isolated');

        app.run(
           path.join(process.cwd(), 'WS.Core'),//Путь до ядра WS
           process.cwd(),//Путь к папке модуля
           //'test'//Можно указать путь к папке с тестами (относительно папки модуля)
           //'artifacts/xunit-report.xml'//Можно задать файл, в который сбросить отчет
        );

2. Запустить тесты:

        node node_modules/ws-unit-testing/mocha -t 10000 testing-node

## Генерация отчета о покрытии под Node.js
1. Скопировать в корневой каталог вашего модуля файл настроек .istanbul.yml (образец есть в корне этого модуля).
2. В параметре reporting.dir указать папку, в которой будет сгенерирован отчет.
3. Запустить генерацию отчета:

        node node_modules/ws-unit-testing/cover testing-node

4. В указанной папке появится отчет в формате HTML.

## Запуск через браузер
1. Создать файл, запускающий локальный http-сервер (testing-server.js):

        var path = require('path'),
           app = require('ws-unit-testing/server');

        app.run(
           path.join(process.cwd(), 'WS.Core'),//Путь до ядра WS
           process.cwd(),//Путь к папке модуля
           'test',//Можно указать путь к папке с тестами (относительно папки модуля)
           777//Порт, на котором запустить сервер
        );

2. Запустить сервер:

        node testing-server

3. Перейти на [страницу тестирования](http://localhost:777/) (номер порта заменить на указанный в testing-server.js).

## Запуск через Selenium webdriver
1. Создать файл, запускающий тесты через webdriver (testing-webdriver.js):

        var path = require('path'),
           app = require('ws-unit-testing/browser');

        app.run(
           'http://localhost:777/?reporter=XUnit',//URL страницы тестирования
           'artifacts/xunit-report.xml'//Файл, в который сбросить отчет
        );


2. Запустить сервер:

        node testing-server

3. Запустить тестирование:

        node testing-webdriver


# Интеграция с Jenkins
Настройки сборки в Jenkins.

## Управление исходным кодом
✓ Multiple SCMs

    +GIT:

        Repository URL: git@path.to:your/module.git

        Credentials: gitread

        Branches to build: */master

        Additional Behaviours:

            +Advanced clone behaviours

                ✓ Shallow clone

## Среда сборки
✓ Inject environment variables to the build process

Доступные переменные окружения:

`WEBDRIVER_remote_enabled` - запускать на удаленном Selenium grid (по умолчанию - 0)

`WEBDRIVER_remote_host` - хост, на котором запущен Selenium grid (по умолчанию - localhost)

`WEBDRIVER_remote_port` - порт, на котором запущен Selenium grid (по умолчанию - 4444)

`WEBDRIVER_remote_desiredCapabilities_browserName` - браузер, в котором будут проводится тесты (по умолчанию - chrome)

`WEBDRIVER_remote_desiredCapabilities_version` - версия бразузера, в которой будут проводится тесты

✓ Abort the build if it's stuck

    Timeout minutes: 10
    Time-out actions: Abort the build

## Сборка
+Выполнить команду Windows (для тестирования в браузере через Selenium вместо testing-node.js использовать testing-webdriver.js)

    call npm config set registry http://npmregistry.sbis.ru:81/
    call node node_modules/ws-unit-testing/mocha -t 10000 -R xunit testing-node
    call node node_modules/ws-unit-testing/cover testing-node

## Послесборочные операции
Publish JUnit test result report

    XML файлы с отчетами о тестировании: artifacts/xunit-report.xml

    ✓ Retain long standard output/error

Publish documents

    Title: Отчет о покрытии

    Directory to archive: artifacts/coverage/lcov-report/
