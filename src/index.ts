import * as testRunner from 'vscode/lib/testrunner';

// https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options
testRunner.configure({
    ui: 'tdd',
    useColors: true,
    timeout: 15000,
    reporter: 'mocha-junit-reporter',
    reporterOptions: {
        mochaFile: '../../junit.xml',
        toConsole: true,
    }
} as any);

module.exports = testRunner;
