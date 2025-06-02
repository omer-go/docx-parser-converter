// tests/suites/commonHelpers.test.ts
import { describe } from '../test-runner'; // Relative path from 'tests/suites' to 'tests/' (../)
import type { TestResult } from '../test-utils'; // Import TestResult as a type
import { assertEquals, assertNull, assertTrue, assertFalse, getXmlElement, assertNotNull } from '../test-utils'; // Relative path for other utilities

// Relative path from 'tests/suites/' to 'src/docx_parsers/helpers/commonHelpers.ts':
// ../ (to tests/) then ../ (to project root) then src/docx_parsers/helpers/commonHelpers.ts
import {
    extractElement,
    extractAttribute,
    safeInt,
    safeFloat,
    extractBooleanAttribute,
    extractElements,
    NAMESPACE_URI
} from '../../src/docx_parsers/helpers/commonHelpers';

export function registerCommonHelpersTests() {
    describe("Common Helper Functions Tests", () => {
        const testXmlString = `
            <w:root xmlns:w="${NAMESPACE_URI}">
                <w:parent>
                    <w:child1 w:attr1="value1" w:boolAttr="true" w:val="implicit_true_val_attr_present"/>
                    <w:child2 w:attr2="123" />
                    <w:child2 w:attr2="456" w:val="false" />
                    <w:empty />
                    <w:numeric w:val="789" />
                    <w:floatNumeric w:val="10.5" />
                    <w:zeroBool w:val="0" />
                    <w:falseBool w:val="false" />
                    <w:trueBool w:val="true" />
                    <w:oneBool w:val="1" />
                </w:parent>
                <w:noChildren />
            </w:root>
        `;
        const rootElement = getXmlElement(testXmlString);

        function createTestResult<T>(
            description: string,
            inputDetails: any,
            actualOutput: T,
            assertionFn: (actual: T, expected?: any, description?: string) => TestResult,
            expectedValue?: any
        ): TestResult {
            const assertionResult = assertionFn(actualOutput, expectedValue, description);
            return {
                description: description,
                passed: assertionResult.passed,
                message: assertionResult.message,
                error: assertionResult.error,
                input: inputDetails,
                output: actualOutput
            };
        }

        const tests: TestResult[] = [];

        const parentElement = rootElement ? extractElement(rootElement, ".//w:parent") : null;
        tests.push(createTestResult(
            "extractElement: parent should be found",
            { contextXml: testXmlString, path: ".//w:parent", fromElement: rootElement?.tagName },
            parentElement,
            (actual) => assertNotNull(actual, "Parent element should not be null")
        ));

        const child1Element = parentElement ? extractElement(parentElement, ".//w:child1") : null;
        tests.push(createTestResult(
            "extractElement: child1 should be found under parent",
            { parentElement: parentElement?.tagName, path: ".//w:child1" },
            child1Element,
            (actual) => assertNotNull(actual, "Child1 element should not be null")
        ));

        tests.push(createTestResult(
            "extractElement: nonExistent child should return null",
            { parentElement: parentElement?.tagName, path: ".//w:nonExistent" },
            extractElement(parentElement, ".//w:nonExistent"),
            (actual) => assertNull(actual, "Non-existent element should be null")
        ));

        // --- Tests for extractElements ---
        const child2Elements = parentElement ? extractElements(parentElement, ".//w:child2") : [];
        tests.push(createTestResult(
            "extractElements: should find 2 child2 elements",
            { parentElement: parentElement?.tagName, path: ".//w:child2" },
            child2Elements.length,
            (actual, expected) => assertEquals(actual, expected, "Count of child2 elements"),
            2
        ));
        if (child2Elements.length === 2) {
             tests.push(createTestResult(
                "extractElements: attr2 of first child2",
                { element: child2Elements[0]?.outerHTML, attribute: "attr2" },
                extractAttribute(child2Elements[0], "attr2"),
                (actual, expected) => assertEquals(actual, expected, "Attribute 'attr2' of first child2"),
                "123"
            ));
        }

        // --- Tests for extractAttribute ---
        tests.push(createTestResult(
            "extractAttribute: attr1 from child1",
            { element: child1Element?.outerHTML, attribute: "attr1" },
            extractAttribute(child1Element, "attr1"),
            (actual, expected) => assertEquals(actual, expected, "Attribute 'attr1' from child1"),
            "value1"
        ));

        tests.push(createTestResult(
            "extractAttribute: nonExistentAttr should return null",
            { element: child1Element?.outerHTML, attribute: "nonExistentAttr" },
            extractAttribute(child1Element, "nonExistentAttr"),
            (actual) => assertNull(actual, "Non-existent attribute should be null")
        ));

        // --- Tests for safeInt ---
        tests.push(createTestResult("safeInt: valid integer string", "123", safeInt("123"), (actual, expected) => assertEquals(actual, expected, ""), 123));
        tests.push(createTestResult("safeInt: invalid integer string", "abc", safeInt("abc"), (actual) => assertNull(actual, "")));
        tests.push(createTestResult("safeInt: null input", null, safeInt(null), (actual) => assertNull(actual, "")));

        // --- Tests for safeFloat ---
        tests.push(createTestResult("safeFloat: valid float string", "123.45", safeFloat("123.45"), (actual, expected) => assertEquals(actual, expected, ""), 123.45));
        tests.push(createTestResult("safeFloat: invalid float string", "abc", safeFloat("abc"), (actual) => assertNull(actual, "")));

        // --- Tests for extractBooleanAttribute ---
        const trueBoolXmlEl = parentElement ? extractElement(parentElement, ".//w:trueBool") : null;
        tests.push(createTestResult("extractBooleanAttribute: w:val='true'", {element: trueBoolXmlEl?.outerHTML}, extractBooleanAttribute(trueBoolXmlEl), (actual) => assertTrue(actual as boolean, "")));

        const falseBoolXmlEl = parentElement ? extractElement(parentElement, ".//w:falseBool") : null;
        tests.push(createTestResult("extractBooleanAttribute: w:val='false'",{element: falseBoolXmlEl?.outerHTML}, extractBooleanAttribute(falseBoolXmlEl), (actual) => assertFalse(actual as boolean, "")));

        const zeroBoolXmlEl = parentElement ? extractElement(parentElement, ".//w:zeroBool") : null;
        tests.push(createTestResult("extractBooleanAttribute: w:val='0'", {element: zeroBoolXmlEl?.outerHTML}, extractBooleanAttribute(zeroBoolXmlEl), (actual) => assertFalse(actual as boolean, "")));
        
        const oneBoolXmlEl = parentElement ? extractElement(parentElement, ".//w:oneBool") : null;
        tests.push(createTestResult("extractBooleanAttribute: w:val='1'", {element: oneBoolXmlEl?.outerHTML}, extractBooleanAttribute(oneBoolXmlEl), (actual) => assertTrue(actual as boolean, "")));

        const child1WithValAttr = parentElement ? extractElement(parentElement, ".//w:child1") : null; 
        tests.push(createTestResult("extractBooleanAttribute: w:val is not 'false' or '0'", {element: child1WithValAttr?.outerHTML}, extractBooleanAttribute(child1WithValAttr), (actual) => assertTrue(actual as boolean, "")));
        
        const emptyXmlEl = parentElement ? extractElement(parentElement, ".//w:empty") : null;
        tests.push(createTestResult("extractBooleanAttribute: element without w:val (defaults to true)", {element: emptyXmlEl?.outerHTML}, extractBooleanAttribute(emptyXmlEl), (actual) => assertTrue(actual as boolean, "")));

        tests.push(createTestResult("extractBooleanAttribute: null element", null, extractBooleanAttribute(null), (actual) => assertNull(actual, "")));

        return tests;
    });
}