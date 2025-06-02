// tests/test-runner.ts
import type { TestResult } from './test-utils'; // Correct: test-utils.ts is in the same 'tests/' directory

interface TestSuite {
    name: string;
    tests: () => TestResult[];
}

const testSuites: TestSuite[] = [];

export function describe(suiteName: string, testsFn: () => TestResult[]): void {
    testSuites.push({ name: suiteName, tests: testsFn });
}

export function runAllTests(): { suiteName: string; results: TestResult[] }[] {
    const allResults: { suiteName: string; results: TestResult[] }[] = [];
    console.log('Starting all tests...');

    for (const suite of testSuites) {
        console.log(`\nRunning suite: ${suite.name}`);
        try {
            const results = suite.tests();
            allResults.push({ suiteName: suite.name, results });
            results.forEach(result => {
                if (result.passed) {
                    console.log(`  ✅ PASSED: ${result.description}`);
                } else {
                    console.error(`  ❌ FAILED: ${result.description} - ${result.message}`);
                    if (result.error) console.error('     Error:', result.error);
                }
                if (result.input !== undefined) console.log(`    Input:`, typeof result.input === 'string' ? result.input : JSON.stringify(result.input, null, 2));
                if (result.output !== undefined) console.log(`    Output:`, typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2));
            });
        } catch (error) {
            console.error(`  💥 ERROR IN SUITE: ${suite.name}`, error);
            allResults.push({
                suiteName: suite.name,
                results: [{
                    description: "Suite execution error",
                    passed: false,
                    message: `An unexpected error occurred in the test suite.`,
                    error: error,
                }]
            });
        }
    }
    console.log('\nAll tests finished.');
    return allResults;
}

export function renderTestResults(
    containerElement: HTMLElement,
    allSuiteResults: { suiteName: string; results: TestResult[] }[]
): void {
    containerElement.innerHTML = '';

    for (const suiteResult of allSuiteResults) {
        const suiteDiv = document.createElement('div');
        suiteDiv.className = 'test-suite';

        const suiteHeader = document.createElement('h2');
        suiteHeader.textContent = `Suite: ${suiteResult.suiteName}`;
        suiteDiv.appendChild(suiteHeader);

        const resultsList = document.createElement('ul');
        suiteResult.results.forEach(result => {
            const listItem = document.createElement('li');
            listItem.className = result.passed ? 'passed' : 'failed';

            let statusHTML = `<strong>${result.passed ? '✅ PASSED' : '❌ FAILED'}</strong>: ${result.description}`;
            listItem.innerHTML = statusHTML;

            if (!result.passed && result.message) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'test-message failure-message';
                messageDiv.innerHTML = `<small><em>${result.message}</em></small>`;
                listItem.appendChild(messageDiv);
            }

            if (result.input !== undefined) {
                const inputDiv = document.createElement('div');
                inputDiv.className = 'test-detail test-input';
                inputDiv.innerHTML = `<strong>Input:</strong>`;
                const inputPre = document.createElement('pre');
                try {
                    inputPre.textContent = typeof result.input === 'string' ? result.input : JSON.stringify(result.input, null, 2);
                } catch (e) { inputPre.textContent = String(result.input); }
                inputDiv.appendChild(inputPre);
                listItem.appendChild(inputDiv);
            }

            if (result.output !== undefined) {
                const outputDiv = document.createElement('div');
                outputDiv.className = 'test-detail test-output';
                outputDiv.innerHTML = `<strong>Output:</strong>`;
                const outputPre = document.createElement('pre');
                try {
                    if (result.output instanceof Element) {
                        outputPre.textContent = result.output.outerHTML;
                    } else if (typeof result.output === 'string') {
                        outputPre.textContent = result.output;
                    } else {
                        outputPre.textContent = JSON.stringify(result.output, null, 2);
                    }
                } catch (e) { 
                    outputPre.textContent = String(result.output); 
                }
                outputDiv.appendChild(outputPre);
                listItem.appendChild(outputDiv);
            }

            if (result.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'test-detail test-error';
                errorDiv.innerHTML = `<strong style="color: red;">Error:</strong> ${result.error instanceof Error ? result.error.message : String(result.error)}`;
                if (result.error instanceof Error && result.error.stack) {
                    const stackPre = document.createElement('pre');
                    stackPre.style.fontSize = '0.8em';
                    stackPre.style.whiteSpace = 'pre-wrap';
                    stackPre.textContent = result.error.stack;
                    errorDiv.appendChild(stackPre);
                }
                listItem.appendChild(errorDiv);
            }
            resultsList.appendChild(listItem);
        });
        suiteDiv.appendChild(resultsList);
        containerElement.appendChild(suiteDiv);
    }
}