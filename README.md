# UNIT-тесты в окружении WS

## Требования к вашему пакету
При подключении модулей (`*.module.js`) через плагин `js` для `requirejs`, пути до них будут разрешаться через файлы `contents.js` и `contents.json` в каталоге ресурсов. Вы должны позаботиться о его наличии.

## Тесты
Все подробности доступны на сайтах фреймворка [Mocha](https://mochajs.org/) и бибилиотеки [Chai](http://chaijs.com/).

Для организации моков и заглушек подключен пакет [Sinon](http://sinonjs.org/).

В тестах доступны глобальные переменные: `requirejs`, `define`, `assert`, `sinon`.

Файлы тестов должны именоваться по маске `*.test.js`. Пример теста `example.test.js`:

```javascript
   define(['MyPackage/MyModule'], function (MyModule) {
      'use strict';

      describe('MyPackage/MyModule', function () {
         var myInstance;

         beforeEach(function () {
            myInstance = new MyModule();
         });

         afterEach(function () {
            myInstance = undefined;
         });

         describe('.constructor()', function () {
            it('should return instance of MyModule', function () {
               assert.instanceOf(myInstance, MyModule);
            });
         });
      });
   });
```

## Настройка
Подключить модуль `ws-unit-testing` в виде зависимости в файле `package.json` вашего модуля:

    "dependencies": {
        "ws-unit-testing": "git+https://git.sbis.ru/ws/unit-testing.git#release-1.0"
    }

И установить его:

    npm install

Все файлы в примерах ниже должны создаваться в корневой папке вашего модуля.

## Запуск под Node.js
1. Создать файл, запускающий тесты `testing-node.js`:

```javascript
   var app = require('ws-unit-testing/isolated');

   app.run({
      root: './',//Путь до корневой папки модуля
      ws: 'WS.Core',//Путь до ядра WS (относительно root)
      resources: 'lib'//Путь к папке с библиотеками модуля (относительно root)
      //tests: 'test'//Можно указать путь к папке с тестами, если они лежат отдельно (относительно root)
      //reportFile: 'artifacts/xunit-report.xml'//Можно задать файл, в который следует сохранить отчет (относительно root)
   });
```

2. Запустить тесты:

        node node_modules/ws-unit-testing/mocha -t 10000 testing-node

## Генерация отчета о покрытии под Node.js
1. Скопировать в корневой каталог вашего модуля файл настроек `.istanbul.yml` (образец есть в корне этого модуля).
2. В параметре `reporting.dir` указать папку, в которой будет сгенерирован отчет. Например:

        dir: ./artifacts/coverage

3. Запустить генерацию отчета:

        node node_modules/ws-unit-testing/cover testing-node

4. В указанной папке появится отчет в формате HTML.

## Запуск через браузер
1. Создать файл, запускающий локальный http-сервер со страницей тестирования `testing-server.js`:

```javascript
   var app = require('ws-unit-testing/server');

   app.run(
       777,//Порт, на котором запустить сервер
       {
           root: './',//Путь до корневой папки модуля (относительно root)
           ws: 'WS.Core',//Путь до ядра WS (относительно root)
           resources: 'lib'//Путь к папке с библиотеками модуля (относительно root)
           //tests: 'test'//Можно указать путь к папке с тестами, если они лежат отдельно (относительно root)
       }
   );
```

2. Запустить сервер:

        node testing-server

3. Перейти на [страницу тестирования](http://localhost:777/) (номер порта заменить на указанный в `testing-server.js`).

## Запуск через Selenium webdriver
1. Создать файл, запускающий тесты через webdriver `testing-browser.js`:

```javascript
   var app = require('ws-unit-testing/browser');

   app.run(
      'http://localhost:777/?reporter=XUnit',//URL страницы тестирования, который будет доступен через запущенный testing-server.js
      'artifacts/xunit-report.xml'//Файл, в который следует сохранить отчет
   );
```


2. Запустить сервер:

        node testing-server

3. Запустить тестирование:

        node testing-browser


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

`WEBDRIVER_remote_enabled` - запускать на удаленном Selenium grid (по умолчанию - `0`; если заменить на `1`, то в `testing-browser.js` следует указать реальное имя хоста, на котором запущена сборка, вместо `localhost`)

`WEBDRIVER_remote_host` - хост, на котором запущен Selenium grid (по умолчанию - `localhost`)

`WEBDRIVER_remote_port` - порт, на котором запущен Selenium grid (по умолчанию - `4444`)

`WEBDRIVER_remote_desiredCapabilities_browserName` - браузер, в котором будут проводится тесты (по умолчанию - `chrome`)

`WEBDRIVER_remote_desiredCapabilities_version` - версия бразузера, в которой будут проводится тесты

✓ Abort the build if it's stuck

    Timeout minutes: 10
    Time-out actions: Abort the build

## Сборка
+Выполнить команду Windows (для тестирования под Node.js + отчет о покрытии)

    call npm config set registry http://npmregistry.sbis.ru:81/
    call npm install
    call node node_modules/ws-unit-testing/mocha -t 10000 -R xunit testing-node
    call node node_modules/ws-unit-testing/cover testing-node

+Выполнить команду Windows (для тестирования через webdriver + отчет о покрытии)

    call npm config set registry http://npmregistry.sbis.ru:81/
    call npm install
    call node node_modules/ws-unit-testing/queue testing-server testing-browser
    call node node_modules/ws-unit-testing/cover testing-node

## Послесборочные операции
Publish JUnit test result report

    XML файлы с отчетами о тестировании: artifacts/xunit-report.xml

    ✓ Retain long standard output/error

Publish documents

    Title: Отчет о покрытии

    Directory to archive: artifacts/coverage/lcov-report/
