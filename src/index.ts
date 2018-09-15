import * as testRunner from 'vscode/lib/testrunner';

// https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options
if (process.env.CI) {
    testRunner.configure({
        ui: 'tdd',
        useColors: true,
        timeout: 15000,
        reporter: 'mocha-junit-reporter',
        reporterOptions: {
            mochaFile: 'junit.xml', // In local: ../../junit.xml
        }
    } as any);
} else {
    testRunner.configure({
        ui: 'tdd',
        useColors: true,
        timeout: 15000,
    } as any);
}


module.exports = testRunner;
