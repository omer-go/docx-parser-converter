// tests/test-utils.ts

export interface TestResult {
    description: string;
    passed: boolean;
    message?: string; // Optional message for failures or details
    error?: any;      // To store actual error objects
}

// Basic assertion functions
export function assertEquals<T>(actual: T, expected: T, description: string): TestResult {
    const passed = JSON.stringify(actual) === JSON.stringify(expected); // Simple deep enough for basic objects/primitives
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

// You can add more: assertThrows, assertDeepEquals (more robust), etc.

// Helper to parse XML string to an Element for tests
export function getXmlElement(xmlString: string): Element | null {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
        console.error("XML Parsing Error in test utility:", parserError.textContent);
        // Optionally throw or return a specific error indicator
        return null;
    }
    return xmlDoc.documentElement;
}