import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, getXmlElement } from '../test-utils';
import { ParagraphParser } from '../../src/docx_parsers/document/paragraphParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';
import type { Paragraph } from '../../src/docx_parsers/models/paragraphModels';

export function registerParagraphParserTests() {
    describe('ParagraphParser Tests', () => {
        const tests: TestResult[] = [];
        const parser = new ParagraphParser();

        // Helper to create a paragraph element for testing
        function createParagraphElement(innerXml: string): Element | null {
            const xmlString = `<w:p xmlns:w="${NAMESPACE_URI}">${innerXml}</w:p>`;
            return getXmlElement(xmlString);
        }

        // Test 1: Simple paragraph with text
        const p1 = createParagraphElement(`
            <w:pPr/>
            <w:r><w:t>Hello world</w:t></w:r>
        `);
        const expected1: Paragraph = {
            properties: {},
            runs: [
                {
                    contents: [
                        { type: 'text', text: 'Hello world' }
                    ],
                    properties: {}
                }
            ],
            numbering: undefined
        };
        tests.push(assertEquals(
            parser.parse(p1!),
            expected1,
            'Parse simple paragraph with text',
            p1?.outerHTML
        ));

        // Test 2: Paragraph with style and numbering
        const p2 = createParagraphElement(`
            <w:pPr>
                <w:pStyle w:val="Heading1"/>
                <w:numPr>
                    <w:ilvl w:val="2"/>
                    <w:numId w:val="5"/>
                </w:numPr>
            </w:pPr>
            <w:r><w:t>List item</w:t></w:r>
        `);
        const expected2: Paragraph = {
            properties: { styleId: 'Heading1' },
            runs: [
                {
                    contents: [
                        { type: 'text', text: 'List item' }
                    ],
                    properties: {}
                }
            ],
            numbering: { ilvl: 2, numId: 5 }
        };
        tests.push(assertEquals(
            parser.parse(p2!),
            expected2,
            'Parse paragraph with style and numbering',
            p2?.outerHTML
        ));

        // Test 3: Paragraph with tabs
        const p3 = createParagraphElement(`
            <w:pPr>
                <w:tabs>
                    <w:tab w:val="left" w:pos="720"/>
                    <w:tab w:val="right" w:pos="1440"/>
                </w:tabs>
            </w:pPr>
            <w:r><w:t>Tab test</w:t></w:r>
        `);
        const expected3: Paragraph = {
            properties: {
                tabs: [
                    { val: 'left', pos: 36 },
                    { val: 'right', pos: 72 }
                ]
            },
            runs: [
                {
                    contents: [
                        { type: 'text', text: 'Tab test' }
                    ],
                    properties: {}
                }
            ],
            numbering: undefined
        };
        tests.push(assertEquals(
            parser.parse(p3!),
            expected3,
            'Parse paragraph with tabs',
            p3?.outerHTML
        ));

        // Test 4: Paragraph with multiple runs
        const p4 = createParagraphElement(`
            <w:pPr/>
            <w:r><w:t>First</w:t></w:r>
            <w:r><w:t>Second</w:t></w:r>
        `);
        const expected4: Paragraph = {
            properties: {},
            runs: [
                {
                    contents: [ { type: 'text', text: 'First' } ],
                    properties: {}
                },
                {
                    contents: [ { type: 'text', text: 'Second' } ],
                    properties: {}
                }
            ],
            numbering: undefined
        };
        tests.push(assertEquals(
            parser.parse(p4!),
            expected4,
            'Parse paragraph with multiple runs',
            p4?.outerHTML
        ));

        // Test 5: Paragraph with no pPr (properties)
        const p5 = createParagraphElement(`
            <w:r><w:t>No properties</w:t></w:r>
        `);
        const expected5: Paragraph = {
            properties: {},
            runs: [
                {
                    contents: [ { type: 'text', text: 'No properties' } ],
                    properties: {}
                }
            ],
            numbering: undefined
        };
        tests.push(assertEquals(
            parser.parse(p5!),
            expected5,
            'Parse paragraph with no pPr',
            p5?.outerHTML
        ));

        // Test 6: Paragraph with tab run content
        const p6 = createParagraphElement(`
            <w:pPr/>
            <w:r><w:tab/></w:r>
        `);
        const expected6: Paragraph = {
            properties: {},
            runs: [
                {
                    contents: [ { type: 'tab' } ],
                    properties: {}
                }
            ],
            numbering: undefined
        };
        tests.push(assertEquals(
            parser.parse(p6!),
            expected6,
            'Parse paragraph with tab run content',
            p6?.outerHTML
        ));

        // Test 7: Paragraph with empty content
        const p7 = createParagraphElement('');
        const expected7: Paragraph = {
            properties: {},
            runs: [],
            numbering: undefined
        };
        tests.push(assertEquals(
            parser.parse(p7!),
            expected7,
            'Parse empty paragraph',
            p7?.outerHTML
        ));

        return tests;
    });
} 