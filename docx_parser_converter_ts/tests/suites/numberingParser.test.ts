import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { getXmlElement } from '../test-utils';
import { NumberingParser } from '../../src/docx_parsers/numbering/numberingParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';
import type { NumberingSchema } from '../../src/docx_parsers/models/numberingModels';

export function registerNumberingParserTests() {
    describe("NumberingParser Tests", () => {
        const tests: TestResult[] = [];

        function createNumberingXml(content: string): Element | null {
            const xmlString = `<w:numbering xmlns:w="${NAMESPACE_URI}">${content}</w:numbering>`;
            return getXmlElement(xmlString);
        }

        // Test Case 1: Basic numbering with single level
        const xml1 = createNumberingXml(`
            <w:num w:numId="1">
                <w:abstractNumId w:val="0"/>
            </w:num>
            <w:abstractNum w:abstractNumId="0">
                <w:lvl w:ilvl="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="decimal"/>
                    <w:lvlText w:val="%1."/>
                    <w:lvlJc w:val="left"/>
                </w:lvl>
            </w:abstractNum>
        `);
        const expected1: NumberingSchema = {
            instances: [{
                numId: 1,
                levels: [{
                    numId: 0,
                    ilvl: 0,
                    start: 1,
                    numFmt: "decimal",
                    lvlText: "%1.",
                    lvlJc: "left"
                }]
            }]
        };

        if (xml1) {
            tests.push({
                description: "Parse basic numbering with single level",
                passed: false,
                isAsync: true,
                asyncTest: async () => {
                    const parser = await NumberingParser.create(xml1);
                    const result = parser.getNumberingSchema();
                    return {
                        passed: JSON.stringify(result) === JSON.stringify(expected1),
                        message: "Basic numbering schema should match expected structure",
                        input: xml1.outerHTML,
                        output: result
                    };
                }
            });
        }

        // Test Case 2: Multiple levels with formatting
        const xml2 = createNumberingXml(`
            <w:num w:numId="2">
                <w:abstractNumId w:val="1"/>
            </w:num>
            <w:abstractNum w:abstractNumId="1">
                <w:lvl w:ilvl="0">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="upperRoman"/>
                    <w:lvlText w:val="%1."/>
                    <w:lvlJc w:val="left"/>
                    <w:pPr>
                        <w:ind w:left="720" w:hanging="360"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                    </w:rPr>
                </w:lvl>
                <w:lvl w:ilvl="1">
                    <w:start w:val="1"/>
                    <w:numFmt w:val="lowerAlpha"/>
                    <w:lvlText w:val="%2)"/>
                    <w:lvlJc w:val="left"/>
                </w:lvl>
            </w:abstractNum>
        `);
        const expected2: NumberingSchema = {
            instances: [{
                numId: 2,
                levels: [
                    {
                        numId: 1,
                        ilvl: 0,
                        start: 1,
                        numFmt: "upperRoman",
                        lvlText: "%1.",
                        lvlJc: "left",
                        indent: {
                            leftPt: 36,
                            firstLinePt: -18
                        },
                        fonts: {
                            ascii: "Times New Roman",
                            hAnsi: "Times New Roman"
                        }
                    },
                    {
                        numId: 1,
                        ilvl: 1,
                        start: 1,
                        numFmt: "lowerAlpha",
                        lvlText: "%2)",
                        lvlJc: "left"
                    }
                ]
            }]
        };

        if (xml2) {
            tests.push({
                description: "Parse numbering with multiple levels and formatting",
                passed: false,
                isAsync: true,
                asyncTest: async () => {
                    const parser = await NumberingParser.create(xml2);
                    const result = parser.getNumberingSchema();
                    return {
                        passed: JSON.stringify(result) === JSON.stringify(expected2),
                        message: "Complex numbering schema should match expected structure",
                        input: xml2.outerHTML,
                        output: result
                    };
                }
            });
        }

        // Test Case 3: Empty numbering
        const xml3 = createNumberingXml('');
        if (xml3) {
            tests.push({
                description: "Parse empty numbering XML",
                passed: false,
                isAsync: true,
                asyncTest: async () => {
                    const parser = await NumberingParser.create(xml3);
                    const result = parser.getNumberingSchema();
                    const expected3: NumberingSchema = { instances: [] };
                    return {
                        passed: JSON.stringify(result) === JSON.stringify(expected3),
                        message: "Empty numbering should return schema with empty instances array",
                        input: xml3.outerHTML,
                        output: result
                    };
                }
            });
        }

        // Test Case 4: Invalid abstractNumId reference
        const xml4 = createNumberingXml(`
            <w:num w:numId="3">
                <w:abstractNumId w:val="999"/>
            </w:num>
        `);
        if (xml4) {
            tests.push({
                description: "Parse numbering with invalid abstractNumId reference",
                passed: false,
                isAsync: true,
                asyncTest: async () => {
                    const parser = await NumberingParser.create(xml4);
                    const result = parser.getNumberingSchema();
                    const expected4: NumberingSchema = {
                        instances: [{
                            numId: 3,
                            levels: []
                        }]
                    };
                    return {
                        passed: JSON.stringify(result) === JSON.stringify(expected4),
                        message: "Invalid abstractNumId should result in empty levels array",
                        input: xml4.outerHTML,
                        output: result
                    };
                }
            });
        }

        // Test Case 5: Missing required attributes
        const xml5 = createNumberingXml(`
            <w:num>
                <w:abstractNumId/>
            </w:num>
            <w:abstractNum>
                <w:lvl>
                    <w:start/>
                    <w:numFmt/>
                    <w:lvlText/>
                    <w:lvlJc/>
                </w:lvl>
            </w:abstractNum>
        `);
        if (xml5) {
            tests.push({
                description: "Parse numbering with missing required attributes",
                passed: false,
                isAsync: true,
                asyncTest: async () => {
                    const parser = await NumberingParser.create(xml5);
                    const result = parser.getNumberingSchema();
                    const expected5: NumberingSchema = {
                        instances: []
                    };
                    return {
                        passed: JSON.stringify(result) === JSON.stringify(expected5),
                        message: "Missing required attributes should result in empty instances array",
                        input: xml5.outerHTML,
                        output: result
                    };
                }
            });
        }

        return tests;
    });
} 