// tests/test-runner.ts
import { TestResult } from './test-utils';

interface TestSuite {
    name: string;
    tests: () => TestResult[]; // A function that returns an array of test results
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
            });
        } catch (error) {
            console.error(`  💥 ERROR IN SUITE: ${suite.name}`, error);
            allResults.push({
                suiteName: suite.name,
                results: [{
                    description: "Suite execution error",
                    passed: false,
                    message: `An unexpected error occurred in the test suite.`,
                    error: error
                }]
            });
        }
    }
    console.log('\nAll tests finished.');
    return allResults;
}

// Function to render results to the HTML page
export function renderTestResults(
    containerElement: HTMLElement,
    allSuiteResults: { suiteName: string; results: TestResult[] }[]
): void {
    containerElement.innerHTML = ''; // Clear previous results

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
            let text = `<strong>${result.passed ? '✅ PASSED' : '❌ FAILED'}</strong>: ${result.description}`;
            if (!result.passed && result.message) {
                text += `<br><small style="margin-left: 20px;"><em>${result.message}</em></small>`;
            }
            if (result.error) {
                text += `<br><small style="margin-left: 20px; color: red;">Error: ${result.error instanceof Error ? result.error.message : String(result.error)}</small>`;
                if (result.error instanceof Error && result.error.stack) {
                    const stackPre = document.createElement('pre');
                    stackPre.textContent = result.error.stack;
                    stackPre.style.fontSize = '0.8em';
                    stackPre.style.marginLeft = '25px';
                    stackPre.style.whiteSpace = 'pre-wrap';
                    listItem.appendChild(document.createElement('br'));
                    listItem.appendChild(stackPre);
                }
            }
            listItem.innerHTML = text + listItem.innerHTML; // Prepend text, keep stack if added
            resultsList.appendChild(listItem);
        });
        suiteDiv.appendChild(resultsList);
        containerElement.appendChild(suiteDiv);
    }
}