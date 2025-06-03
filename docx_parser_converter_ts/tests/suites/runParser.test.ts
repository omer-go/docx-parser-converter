import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, getXmlElement } from '../test-utils';
import { RunParser } from '../../src/docx_parsers/document/runParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';
import type { Run } from '../../src/docx_parsers/models/paragraphModels';

export function registerRunParserTests() {
    describe("RunParser Tests", () => {
        const tests: TestResult[] = [];
        const parser = new RunParser();

        // Helper function to create run elements for testing
        function createRunElement(content: string): Element | null {
            const xmlString = `<w:r xmlns:w="${NAMESPACE_URI}">${content}</w:r>`;
            return getXmlElement(xmlString);
        }

        // Test case 1: Simple text run
        const run1 = createRunElement('<w:t>Simple text</w:t>');
        const expected1: Run = {
            contents: [
                {
                    type: 'text',
                    text: 'Simple text'
                }
            ],
            properties: {}
        };
        tests.push(assertEquals(
            parser.parse(run1!),
            expected1,
            "Parse simple text run",
            run1?.outerHTML
        ));

        // Test case 2: Run with tab
        const run2 = createRunElement('<w:tab/>');
        const expected2: Run = {
            contents: [
                {
                    type: 'tab'
                }
            ],
            properties: {}
        };
        tests.push(assertEquals(
            parser.parse(run2!),
            expected2,
            "Parse run with tab",
            run2?.outerHTML
        ));

        // Test case 3: Run with multiple contents (text and tab)
        const run3 = createRunElement('<w:t>First</w:t><w:tab/><w:t>Second</w:t>');
        const expected3: Run = {
            contents: [
                {
                    type: 'text',
                    text: 'First'
                },
                {
                    type: 'tab'
                },
                {
                    type: 'text',
                    text: 'Second'
                }
            ],
            properties: {}
        };
        tests.push(assertEquals(
            parser.parse(run3!),
            expected3,
            "Parse run with multiple contents",
            run3?.outerHTML
        ));

        // Test case 4: Run with properties
        const run4 = createRunElement(`
            <w:rPr>
                <w:b/>
                <w:i/>
                <w:color w:val="FF0000"/>
            </w:rPr>
            <w:t>Formatted text</w:t>
        `);
        const expected4: Run = {
            contents: [
                {
                    type: 'text',
                    text: 'Formatted text'
                }
            ],
            properties: {
                color: 'FF0000',
                bold: true,
                italic: true
            }
        };
        tests.push(assertEquals(
            parser.parse(run4!),
            expected4,
            "Parse run with formatting properties",
            run4?.outerHTML
        ));

        // Test case 5: Empty run
        const run5 = createRunElement('');
        const expected5: Run = {
            contents: [],
            properties: {}
        };
        tests.push(assertEquals(
            parser.parse(run5!),
            expected5,
            "Parse empty run",
            run5?.outerHTML
        ));

        // Test case 6: Run with empty text
        const run6 = createRunElement('<w:t></w:t>');
        const expected6: Run = {
            contents: [
                {
                    type: 'text',
                    text: ''
                }
            ],
            properties: {}
        };
        tests.push(assertEquals(
            parser.parse(run6!),
            expected6,
            "Parse run with empty text",
            run6?.outerHTML
        ));

        // Test case 7: Run with multiple text elements
        const run7 = createRunElement('<w:t>Text1</w:t><w:t>Text2</w:t>');
        const expected7: Run = {
            contents: [
                {
                    type: 'text',
                    text: 'Text1'
                },
                {
                    type: 'text',
                    text: 'Text2'
                }
            ],
            properties: {}
        };
        tests.push(assertEquals(
            parser.parse(run7!),
            expected7,
            "Parse run with multiple text elements",
            run7?.outerHTML
        ));

        return tests;
    });
} 