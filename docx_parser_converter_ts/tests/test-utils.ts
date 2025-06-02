// tests/test-utils.ts

export interface TestResult {
    description: string;
    passed: boolean;
    message?: string;
    error?: any;
    input?: any;  // To store input data for the test
    output?: any; // To store the actual output from the function
    isAsync?: boolean;
    asyncTest?: () => Promise<{ passed: boolean; message?: string; error?: any }>;
}

// Basic assertion functions
export function assertEquals<T>(actual: T, expected: T, description: string): TestResult {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    return {
        description,
        passed,
        message: passed ? 'Passed' : `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
    };
}

export function assertNotNull<T>(actual: T | null | undefined, description: string): TestResult {
    const passed = actual !== null && actual !== undefined;
    return {
        description,
        passed,
        message: passed ? 'Passed' : 'Expected value to be not null/undefined, but it was.',
    };
}

export function assertNull<T>(actual: T | null | undefined, description: string): TestResult {
    const passed = actual === null || actual === undefined;
    return {
        description,
        passed,
        message: passed ? 'Passed' : `Expected value to be null/undefined, but got ${JSON.stringify(actual)}.`,
    };
}

export function assertTrue(condition: boolean, description: string): TestResult {
    return {
        description,
        passed: condition,
        message: condition ? 'Passed' : 'Expected condition to be true, but it was false.',
    };
}

export function assertFalse(condition: boolean, description: string): TestResult {
    return {
        description,
        passed: !condition,
        message: !condition ? 'Passed' : 'Expected condition to be false, but it was true.',
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