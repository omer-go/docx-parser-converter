import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals } from '../test-utils';
import { StylesParser } from '../../src/docx_parsers/styles/stylesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerStylesParserTests() {
    describe("StylesParser Tests", () => {
        const tests: TestResult[] = [];

        // Test 1: Parse empty styles XML
        const emptyStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:styles xmlns:w="${NAMESPACE_URI}">
            </w:styles>`;
        const emptyParser = new StylesParser(emptyStylesXml);
        tests.push(assertEquals(
            emptyParser.getStylesSchema(),
            {
                styles: [],
                styleTypeDefaults: {},
                docDefaultsRpr: {},
                docDefaultsPpr: {}
            },
            "Parse empty styles XML",
            emptyStylesXml
        ));

        // Test 2: Parse document defaults
        const docDefaultsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:styles xmlns:w="${NAMESPACE_URI}">
                <w:docDefaults>
                    <w:rPrDefault>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:sz w:val="24"/>
                            <w:color w:val="000000"/>
                        </w:rPr>
                    </w:rPrDefault>
                    <w:pPrDefault>
                        <w:pPr>
                            <w:spacing w:before="240" w:after="240"/>
                            <w:jc w:val="both"/>
                        </w:pPr>
                    </w:pPrDefault>
                </w:docDefaults>
            </w:styles>`;
        const docDefaultsParser = new StylesParser(docDefaultsXml);
        tests.push(assertEquals(
            docDefaultsParser.getStylesSchema(),
            {
                styles: [],
                styleTypeDefaults: {},
                docDefaultsRpr: {
                    font: {
                        ascii: "Calibri",
                        hAnsi: "Calibri"
                    },
                    sizePt: 12,
                    color: "000000"
                },
                docDefaultsPpr: {
                    spacing: {
                        beforePt: 12,
                        afterPt: 12
                    },
                    justification: "justify"
                }
            },
            "Parse document defaults",
            docDefaultsXml
        ));

        // Test 3: Parse style type defaults
        const styleDefaultsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:styles xmlns:w="${NAMESPACE_URI}">
                <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
                    <w:name w:val="Normal"/>
                </w:style>
                <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">
                    <w:name w:val="Default Paragraph Font"/>
                </w:style>
                <w:style w:type="table" w:default="1" w:styleId="TableNormal">
                    <w:name w:val="Normal Table"/>
                </w:style>
                <w:style w:type="numbering" w:default="1" w:styleId="NoList">
                    <w:name w:val="No List"/>
                </w:style>
            </w:styles>`;
        const styleDefaultsParser = new StylesParser(styleDefaultsXml);
        tests.push(assertEquals(
            styleDefaultsParser.getStylesSchema(),
            {
                styles: [
                    {
                        styleId: "Normal",
                        name: "Normal",
                        paragraphProperties: {},
                        runProperties: {}
                    },
                    {
                        styleId: "DefaultParagraphFont",
                        name: "Default Paragraph Font",
                        paragraphProperties: {},
                        runProperties: {}
                    },
                    {
                        styleId: "TableNormal",
                        name: "Normal Table",
                        paragraphProperties: {},
                        runProperties: {}
                    },
                    {
                        styleId: "NoList",
                        name: "No List",
                        paragraphProperties: {},
                        runProperties: {}
                    }
                ],
                styleTypeDefaults: {
                    paragraph: "Normal",
                    character: "DefaultParagraphFont",
                    table: "TableNormal",
                    numbering: "NoList"
                },
                docDefaultsRpr: {},
                docDefaultsPpr: {}
            },
            "Parse style type defaults",
            styleDefaultsXml
        ));

        // Test 4: Parse style with properties
        const styleWithPropertiesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:styles xmlns:w="${NAMESPACE_URI}">
                <w:style w:type="paragraph" w:styleId="Heading1">
                    <w:name w:val="heading 1"/>
                    <w:basedOn w:val="Normal"/>
                    <w:pPr>
                        <w:spacing w:before="240" w:after="240" w:line="360"/>
                        <w:outlineLvl w:val="0"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        <w:b/>
                        <w:sz w:val="32"/>
                    </w:rPr>
                </w:style>
            </w:styles>`;
        const styleWithPropertiesParser = new StylesParser(styleWithPropertiesXml);
        tests.push(assertEquals(
            styleWithPropertiesParser.getStylesSchema(),
            {
                styles: [
                    {
                        styleId: "Heading1",
                        name: "heading 1",
                        basedOn: "Normal",
                        paragraphProperties: {
                            spacing: {
                                beforePt: 12,
                                afterPt: 12,
                                linePt: 18
                            },
                            outlineLevel: 0
                        },
                        runProperties: {
                            font: {
                                ascii: "Calibri",
                                hAnsi: "Calibri"
                            },
                            sizePt: 16,
                            bold: true
                        }
                    }
                ],
                styleTypeDefaults: {},
                docDefaultsRpr: {},
                docDefaultsPpr: {}
            },
            "Parse style with properties",
            styleWithPropertiesXml
        ));

        // Test 5: Parse complete styles XML
        const completeStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:styles xmlns:w="${NAMESPACE_URI}">
                <w:docDefaults>
                    <w:rPrDefault>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:sz w:val="24"/>
                        </w:rPr>
                    </w:rPrDefault>
                    <w:pPrDefault>
                        <w:pPr>
                            <w:spacing w:before="100" w:after="100"/>
                        </w:pPr>
                    </w:pPrDefault>
                </w:docDefaults>
                <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
                    <w:name w:val="Normal"/>
                    <w:pPr>
                        <w:spacing w:before="0" w:after="0"/>
                    </w:pPr>
                </w:style>
                <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">
                    <w:name w:val="Default Paragraph Font"/>
                </w:style>
                <w:style w:type="paragraph" w:styleId="Heading1">
                    <w:name w:val="heading 1"/>
                    <w:basedOn w:val="Normal"/>
                    <w:pPr>
                        <w:spacing w:before="240" w:after="240"/>
                        <w:outlineLvl w:val="0"/>
                    </w:pPr>
                    <w:rPr>
                        <w:b/>
                        <w:sz w:val="32"/>
                    </w:rPr>
                </w:style>
            </w:styles>`;
        const completeParser = new StylesParser(completeStylesXml);
        tests.push(assertEquals(
            completeParser.getStylesSchema(),
            {
                styles: [
                    {
                        styleId: "Normal",
                        name: "Normal",
                        paragraphProperties: {
                            spacing: {
                                beforePt: 0,
                                afterPt: 0
                            }
                        },
                        runProperties: {}
                    },
                    {
                        styleId: "DefaultParagraphFont",
                        name: "Default Paragraph Font",
                        paragraphProperties: {},
                        runProperties: {}
                    },
                    {
                        styleId: "Heading1",
                        name: "heading 1",
                        basedOn: "Normal",
                        paragraphProperties: {
                            spacing: {
                                beforePt: 12,
                                afterPt: 12
                            },
                            outlineLevel: 0
                        },
                        runProperties: {
                            sizePt: 16,
                            bold: true
                        }
                    }
                ],
                styleTypeDefaults: {
                    paragraph: "Normal",
                    character: "DefaultParagraphFont"
                },
                docDefaultsRpr: {
                    font: {
                        ascii: "Calibri",
                        hAnsi: "Calibri"
                    },
                    sizePt: 12
                },
                docDefaultsPpr: {
                    spacing: {
                        beforePt: 5,
                        afterPt: 5
                    }
                }
            },
            "Parse complete styles XML",
            completeStylesXml
        ));

        return tests;
    });
} 