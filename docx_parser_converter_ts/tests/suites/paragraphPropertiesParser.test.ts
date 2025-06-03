import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, getXmlElement } from '../test-utils';
import { ParagraphPropertiesParser } from '../../src/docx_parsers/styles/paragraphPropertiesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerParagraphPropertiesParserTests() {
    describe("ParagraphPropertiesParser Tests", () => {
        const tests: TestResult[] = [];
        const parser = new ParagraphPropertiesParser();

        // Helper function to create a pPr element with various properties
        function createPPrElement(properties: {
            spacing?: { before?: string; after?: string; line?: string };
            indent?: { left?: string; right?: string; firstLine?: string; hanging?: string };
            justification?: string;
            outlineLevel?: string;
            widowControl?: boolean;
            suppressAutoHyphens?: boolean;
            bidi?: boolean;
            keepNext?: boolean;
            suppressLineNumbers?: boolean;
        }): Element | null {
            let xmlContent = `<w:pPr xmlns:w="${NAMESPACE_URI}">`;

            if (properties.spacing) {
                const { before, after, line } = properties.spacing;
                xmlContent += '<w:spacing';
                if (before) xmlContent += ` w:before="${before}"`;
                if (after) xmlContent += ` w:after="${after}"`;
                if (line) xmlContent += ` w:line="${line}"`;
                xmlContent += '/>';
            }

            if (properties.indent) {
                const { left, right, firstLine, hanging } = properties.indent;
                xmlContent += '<w:ind';
                if (left) xmlContent += ` w:left="${left}"`;
                if (right) xmlContent += ` w:right="${right}"`;
                if (firstLine) xmlContent += ` w:firstLine="${firstLine}"`;
                if (hanging) xmlContent += ` w:hanging="${hanging}"`;
                xmlContent += '/>';
            }

            if (properties.justification) {
                xmlContent += `<w:jc w:val="${properties.justification}"/>`;
            }

            if (properties.outlineLevel !== undefined) {
                xmlContent += `<w:outlineLvl w:val="${properties.outlineLevel}"/>`;
            }

            if (properties.widowControl !== undefined) {
                xmlContent += properties.widowControl ? '<w:widowControl/>' : '<w:widowControl w:val="0"/>';
            }

            if (properties.suppressAutoHyphens !== undefined) {
                xmlContent += properties.suppressAutoHyphens ? '<w:suppressAutoHyphens/>' : '<w:suppressAutoHyphens w:val="0"/>';
            }

            if (properties.bidi !== undefined) {
                xmlContent += properties.bidi ? '<w:bidi/>' : '<w:bidi w:val="0"/>';
            }

            if (properties.keepNext !== undefined) {
                xmlContent += properties.keepNext ? '<w:keepNext/>' : '<w:keepNext w:val="0"/>';
            }

            if (properties.suppressLineNumbers !== undefined) {
                xmlContent += properties.suppressLineNumbers ? '<w:suppressLineNumbers/>' : '<w:suppressLineNumbers w:val="0"/>';
            }

            xmlContent += '</w:pPr>';
            return getXmlElement(xmlContent);
        }

        // Test 1: Parse spacing properties
        const spacingPPr = createPPrElement({
            spacing: { before: "240", after: "120", line: "360" }
        });
        tests.push(assertEquals(
            parser.parse(spacingPPr),
            {
                spacing: {
                    beforePt: 12, // 240/20
                    afterPt: 6,   // 120/20
                    linePt: 18    // 360/20
                }
            },
            "Parse spacing properties",
            spacingPPr?.outerHTML
        ));

        // Test 2: Parse indentation properties
        const indentPPr = createPPrElement({
            indent: { left: "720", right: "360", firstLine: "360" }
        });
        tests.push(assertEquals(
            parser.parse(indentPPr),
            {
                indent: {
                    leftPt: 36,    // 720/20
                    rightPt: 18,   // 360/20
                    firstLinePt: 18 // 360/20
                }
            },
            "Parse indentation properties",
            indentPPr?.outerHTML
        ));

        // Test 3: Parse hanging indent
        const hangingPPr = createPPrElement({
            indent: { left: "720", hanging: "360" }
        });
        tests.push(assertEquals(
            parser.parse(hangingPPr),
            {
                indent: {
                    leftPt: 36,     // 720/20
                    firstLinePt: -18 // -360/20 (negative for hanging indent)
                }
            },
            "Parse hanging indent",
            hangingPPr?.outerHTML
        ));

        // Test 4: Parse justification
        const justificationPPr = createPPrElement({
            justification: "both"
        });
        tests.push(assertEquals(
            parser.parse(justificationPPr),
            {
                justification: "justify" // "both" maps to "justify"
            },
            "Parse justification",
            justificationPPr?.outerHTML
        ));

        // Test 5: Parse outline level
        const outlinePPr = createPPrElement({
            outlineLevel: "1"
        });
        tests.push(assertEquals(
            parser.parse(outlinePPr),
            {
                outlineLevel: 1
            },
            "Parse outline level",
            outlinePPr?.outerHTML
        ));

        // Test 6: Parse boolean properties
        const booleanPPr = createPPrElement({
            widowControl: true,
            suppressAutoHyphens: true,
            bidi: false,
            keepNext: true,
            suppressLineNumbers: false
        });
        tests.push(assertEquals(
            parser.parse(booleanPPr),
            {
                widowControl: true,
                suppressAutoHyphens: true,
                bidi: false,
                keepNext: true,
                suppressLineNumbers: false
            },
            "Parse boolean properties",
            booleanPPr?.outerHTML
        ));

        // Test 7: Parse empty pPr element
        const emptyPPr = getXmlElement(`<w:pPr xmlns:w="${NAMESPACE_URI}"></w:pPr>`);
        tests.push(assertEquals(
            parser.parse(emptyPPr),
            {},
            "Parse empty pPr element",
            emptyPPr?.outerHTML
        ));

        // Test 8: Parse null pPr element
        tests.push(assertEquals(
            parser.parse(null),
            {},
            "Parse null pPr element",
            "null"
        ));

        return tests;
    });
} 