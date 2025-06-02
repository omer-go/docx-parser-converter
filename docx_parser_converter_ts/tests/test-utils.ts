// tests/test-utils.ts

export interface TestResult {
    description: string;
    passed: boolean;
    message?: string;
    error?: any;
    input?: any;  // To store input data for the test
    output?: any; // To store the actual output from the function
    isAsync?: boolean;
    asyncTest?: () => Promise<Partial<TestResult>>; // Can return a full or partial TestResult
}

// Basic assertion functions
export function assertEquals<T>(
    actual: T, 
    expected: T, 
    description: string, 
    functionInput?: any
): TestResult {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    return {
        description,
        passed,
        message: passed ? 'Passed' : `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
        input: functionInput,
        output: actual,
    };
}

export function assertNotNull<T>(
    actual: T | null | undefined, 
    description: string, 
    functionInput?: any
): TestResult {
    const passed = actual !== null && actual !== undefined;
    return {
        description,
        passed,
        message: passed ? 'Passed' : 'Expected value to be not null/undefined, but it was.',
        input: functionInput,
        output: actual ?? 'null/undefined',
    };
}

export function assertNull<T>(
    actual: T | null | undefined, 
    description: string, 
    functionInput?: any
): TestResult {
    const passed = actual === null || actual === undefined;
    return {
        description,
        passed,
        message: passed ? 'Passed' : `Expected value to be null/undefined, but got ${JSON.stringify(actual)}.`, 
        input: functionInput,
        output: actual ?? 'null/undefined',
    };
}

export function assertTrue(
    condition: boolean, 
    description: string, 
    functionInput?: any, 
    observedValue?: any
): TestResult {
    return {
        description,
        passed: condition,
        message: condition ? 'Passed' : 'Expected condition to be true, but it was false.',
        input: functionInput,
        output: observedValue ?? condition, // Show observed value, or the condition itself
    };
}

export function assertFalse(
    condition: boolean, 
    description: string, 
    functionInput?: any, 
    observedValue?: any
): TestResult {
    return {
        description,
        passed: !condition,
        message: !condition ? 'Passed' : 'Expected condition to be false, but it was true.',
        input: functionInput,
        output: observedValue ?? condition, // Show observed value, or the condition itself
    };
}

// Helper to parse XML string to an Element for tests
export function getXmlElement(xmlString: string): Element | null {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
        console.error("XML Parsing Error in test utility:", parserError.textContent);
        return null;
    }
    return xmlDoc.documentElement;
}