# UNIT-тесты в окружении WS

## [Запуск через браузер](http://localhost:1024/util/tests/unit/browser.html)

## Команды
- собрать список тестов:

		node util/tests/unit/list.build

- прогнать unit тесты через Node.js:

		node scripts/mocha -t 10000 util/tests/unit/isolated.run

- прогнать unit тесты через Node.js с отчетом в формате XUnit:

		node scripts/mocha -t 10000 -R xunit util/tests/unit/isolated.run

- сгенерировать [отчет о покрытии](http://localhost:1024/util/tests/unit/artifacts/coverage/lcov-report/index.html):

        node scripts/coverage util/tests/unit/coverage.run

## Запуск через Selenium webdriver
1. Установить selenium-standalone и webdriverio:

    a) Добавить в PATH путь к бинарникам Java (если его еще там нет, требуется для запуска selenium standalone server): `https://java.com/en/download/help/path.xml`

    б) Выполнить в консоли (в корневой папке репозитория):

        call npm install selenium-standalone@4.4.2 webdriverio@2.4.5
        call node node_modules/selenium-standalone/bin/selenium-standalone install

2. Выполнить в консоли (в корневой папке репозитория), предварительно запустив http-сервер (`node scripts/app`):

        node util/tests/unit/browser.run

# Jenkins
Настройки сборки в Jenkins

## Управление исходным кодом
✓ Multiple SCMs

    +GIT:

        Repository URL: git@git.sbis.ru:ws/data.git

        Credentials: gitread

        Branches to build: */master

        Additional Behaviours:

            +Advanced clone behaviours

                ✓ Shallow clone

    +GIT:

        Repository URL: git@git.sbis.ru:sbis/ws.git

        Credentials: gitread

        Branches to build: */master

        Additional Behaviours:

            +Advanced clone behaviours

                ✓ Shallow clone


            +Check out to a sub-directory:
                Local subdirectory for repo: WS.Core

## Среда сборки
✓ Inject environment variables to the build process

    Properties Content:
    TEST_ENV=build

Также могут оказаться полезными при запуске через Selenium:

`BROWSER_url_host` - хост, на котором запущен http server (имя машины, на которой осуществляется сборка) (по умолчанию - localhost)

`BROWSER_url_port` - port, на котором запущен http server (по умолчанию - 1024)

`WEBDRIVER_remote_enabled` - запускать на удаленном Selenium grid (по умолчанию - 0)

`WEBDRIVER_remote_host` - хост, на котором запущен Selenium grid (по умолчанию - localhost)

`WEBDRIVER_remote_port` - порт, на котором запущен Selenium grid (по умолчанию - 4444)

`WEBDRIVER_remote_desiredCapabilities_browserName` - браузер, в котором будут проводится тесты (по умолчанию - chrome)

`WEBDRIVER_remote_desiredCapabilities_version` - версия бразузера, в которой будут проводится тесты

✓ Abort the build if it's stuck

    Timeout minutes: 10
    Time-out actions: Abort the build

## Сборка
+Выполнить команду Windows (для тестирования в браузере через Selenium вместо test-isolated использовать test-browser)

    call npm config set registry http://npmregistry.sbis.ru:81/
    call bin\test-isolated
    call bin\test-coverage

## Послесборочные операции
Publish JUnit test result report

    XML файлы с отчетами о тестировании: util/tests/unit/artifacts/xunit-report.xml

    ✓ Retain long standard output/error

Publish documents

    Title: Отчет о покрытии

    Directory to archive: util/tests/unit/artifacts/coverage/lcov-report/
