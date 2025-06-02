// tests/test-runner.ts
import type { TestResult } from './test-utils'; // Correct: test-utils.ts is in the same 'tests/' directory

interface TestSuite {
    name: string;
    tests: () => TestResult[]; // This function itself is synchronous and returns an array of test definitions
}

const testSuites: TestSuite[] = [];

export function describe(suiteName: string, testsFn: () => TestResult[]): void {
    testSuites.push({ name: suiteName, tests: testsFn });
}

export async function runAllTests(): Promise<{ suiteName: string; results: TestResult[] }[]> {
    const allSuiteExecutionResults: { suiteName: string; results: TestResult[] }[] = [];
    console.log('Starting all tests...');

    for (const suite of testSuites) {
        console.log(`\nRunning suite: ${suite.name}`);
        const processedResults: TestResult[] = [];
        try {
            const testDefinitions = suite.tests(); // Get all test definitions for the suite

            for (let testDef of testDefinitions) { // Use let to allow reassignment for merging
                if (testDef.isAsync && typeof testDef.asyncTest === 'function') {
                    console.log(`  ⏳ Running async test: ${testDef.description}`);
                    try {
                        const asyncOutcome = await testDef.asyncTest();
                        // Merge asyncOutcome with testDef. AsyncOutcome properties take precedence.
                        testDef = {
                            ...testDef, // Keep original description, initial input/output placeholders
                            ...asyncOutcome, // Overwrite with what asyncTest returned (passed, message, error, potentially refined input/output)
                        };
                    } catch (e: any) {
                        testDef.passed = false;
                        testDef.message = `Async test threw an unhandled exception: ${e.message || String(e)}`;
                        testDef.error = e;
                        // Keep original input if available, otherwise set error message as output
                        testDef.output = testDef.output === "Pending async test execution..." ? `Error: ${e.message || String(e)}` : testDef.output;
                    }
                }

                // Log result after sync or async execution
                if (testDef.passed) {
                    console.log(`  ✅ PASSED: ${testDef.description}`);
                } else {
                    console.error(`  ❌ FAILED: ${testDef.description} - ${testDef.message || 'No message'}`);
                    if (testDef.error) console.error('     Error:', testDef.error);
                }
                if (testDef.input !== undefined) console.log(`    Input:`, typeof testDef.input === 'string' ? testDef.input : JSON.stringify(testDef.input, null, 2));
                if (testDef.output !== undefined) console.log(`    Output:`, typeof testDef.output === 'string' || testDef.output instanceof Uint8Array || testDef.output instanceof Element ? String(testDef.output) : JSON.stringify(testDef.output, null, 2));
                
                processedResults.push(testDef);
            }
            allSuiteExecutionResults.push({ suiteName: suite.name, results: processedResults });

        } catch (error: any) {
            console.error(`  💥 ERROR IN SUITE SETUP: ${suite.name}`, error);
            allSuiteExecutionResults.push({
                suiteName: suite.name,
                results: [{
                    description: "Suite setup or synchronous test execution error",
                    passed: false,
                    message: `An unexpected error occurred: ${error.message || String(error)}`,
                    error: error,
                }]
            });
        }
    }
    console.log('\nAll tests finished.');
    return allSuiteExecutionResults;
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
                    if (typeof result.input === 'string' && (result.input.startsWith("Mock File") || result.input.startsWith("DOCX Fixture"))) {
                        inputPre.textContent = "File (details in test case definition)";
                    } else {
                        inputPre.textContent = typeof result.input === 'string' ? result.input : JSON.stringify(result.input, null, 2);
                    }
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
                    if (result.output instanceof Uint8Array) {
                        outputPre.textContent = `Uint8Array (length: ${result.output.byteLength})`;
                    } else if (result.output instanceof Element) { // Check if it's an XML Element
                        outputPre.textContent = result.output.outerHTML; // Display its XML structure
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