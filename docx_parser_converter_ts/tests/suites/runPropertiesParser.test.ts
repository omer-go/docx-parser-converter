import { describe } from '../test-runner';
import type { TestResult } from '../test-utils';
import { assertEquals, getXmlElement } from '../test-utils';
import { RunPropertiesParser } from '../../src/docx_parsers/styles/runPropertiesParser';
import { NAMESPACE_URI } from '../../src/docx_parsers/helpers/commonHelpers';

export function registerRunPropertiesParserTests() {
    describe("RunPropertiesParser Tests", () => {
        const tests: TestResult[] = [];
        const parser = new RunPropertiesParser();

        // Helper function to create a rPr element with various properties
        function createRPrElement(properties: {
            fonts?: { ascii?: string; hAnsi?: string; eastAsia?: string; cs?: string };
            size?: string;
            color?: string;
            bold?: boolean;
            italic?: boolean;
            underline?: string;
            strike?: boolean;
            hidden?: boolean;
            highlight?: string;
            shading?: string;
            position?: string;
            spacing?: string;
            kerning?: string;
            lang?: { val?: string; eastAsia?: string; bidi?: string };
            emboss?: boolean;
            outline?: boolean;
            shadow?: boolean;
            caps?: boolean;
            smallCaps?: boolean;
        }): Element | null {
            let xmlContent = `<w:rPr xmlns:w="${NAMESPACE_URI}">`;

            if (properties.fonts) {
                const { ascii, hAnsi, eastAsia, cs } = properties.fonts;
                xmlContent += '<w:rFonts';
                if (ascii) xmlContent += ` w:ascii="${ascii}"`;
                if (hAnsi) xmlContent += ` w:hAnsi="${hAnsi}"`;
                if (eastAsia) xmlContent += ` w:eastAsia="${eastAsia}"`;
                if (cs) xmlContent += ` w:cs="${cs}"`;
                xmlContent += '/>';
            }

            if (properties.size) {
                xmlContent += `<w:sz w:val="${properties.size}"/>`;
            }

            if (properties.color) {
                xmlContent += `<w:color w:val="${properties.color}"/>`;
            }

            if (properties.bold !== undefined) {
                xmlContent += properties.bold ? '<w:b/>' : '<w:b w:val="0"/>';
            }

            if (properties.italic !== undefined) {
                xmlContent += properties.italic ? '<w:i/>' : '<w:i w:val="0"/>';
            }

            if (properties.underline) {
                xmlContent += `<w:u w:val="${properties.underline}"/>`;
            }

            if (properties.strike !== undefined) {
                xmlContent += properties.strike ? '<w:strike/>' : '<w:strike w:val="0"/>';
            }

            if (properties.hidden !== undefined) {
                xmlContent += properties.hidden ? '<w:vanish/>' : '<w:vanish w:val="0"/>';
            }

            if (properties.highlight) {
                xmlContent += `<w:highlight w:val="${properties.highlight}"/>`;
            }

            if (properties.shading) {
                xmlContent += `<w:shd w:val="${properties.shading}"/>`;
            }

            if (properties.position) {
                xmlContent += `<w:position w:val="${properties.position}"/>`;
            }

            if (properties.spacing) {
                xmlContent += `<w:spacing w:val="${properties.spacing}"/>`;
            }

            if (properties.kerning) {
                xmlContent += `<w:kern w:val="${properties.kerning}"/>`;
            }

            if (properties.lang) {
                const { val, eastAsia, bidi } = properties.lang;
                xmlContent += '<w:lang';
                if (val) xmlContent += ` w:val="${val}"`;
                if (eastAsia) xmlContent += ` w:eastAsia="${eastAsia}"`;
                if (bidi) xmlContent += ` w:bidi="${bidi}"`;
                xmlContent += '/>';
            }

            if (properties.emboss !== undefined) {
                xmlContent += properties.emboss ? '<w:emboss/>' : '<w:emboss w:val="0"/>';
            }

            if (properties.outline !== undefined) {
                xmlContent += properties.outline ? '<w:outline/>' : '<w:outline w:val="0"/>';
            }

            if (properties.shadow !== undefined) {
                xmlContent += properties.shadow ? '<w:shadow/>' : '<w:shadow w:val="0"/>';
            }

            if (properties.caps !== undefined) {
                xmlContent += properties.caps ? '<w:caps/>' : '<w:caps w:val="0"/>';
            }

            if (properties.smallCaps !== undefined) {
                xmlContent += properties.smallCaps ? '<w:smallCaps/>' : '<w:smallCaps w:val="0"/>';
            }

            xmlContent += '</w:rPr>';
            return getXmlElement(xmlContent);
        }

        // Test 1: Parse font properties
        const fontRPr = createRPrElement({
            fonts: {
                ascii: "Calibri",
                hAnsi: "Calibri",
                eastAsia: "SimSun",
                cs: "Arial"
            }
        });
        tests.push(assertEquals(
            parser.parse(fontRPr),
            {
                font: {
                    ascii: "Calibri",
                    hAnsi: "Calibri",
                    eastAsia: "SimSun",
                    cs: "Arial"
                }
            },
            "Parse font properties",
            fontRPr?.outerHTML
        ));

        // Test 2: Parse size and color
        const sizeColorRPr = createRPrElement({
            size: "24",
            color: "FF0000"
        });
        tests.push(assertEquals(
            parser.parse(sizeColorRPr),
            {
                sizePt: 12,  // 24/2
                color: "FF0000"
            },
            "Parse size and color",
            sizeColorRPr?.outerHTML
        ));

        // Test 3: Parse text formatting
        const formattingRPr = createRPrElement({
            bold: true,
            italic: true,
            underline: "single",
            strike: true
        });
        tests.push(assertEquals(
            parser.parse(formattingRPr),
            {
                bold: true,
                italic: true,
                underline: "single",
                strikethrough: true
            },
            "Parse text formatting",
            formattingRPr?.outerHTML
        ));

        // Test 4: Parse language settings
        const langRPr = createRPrElement({
            lang: {
                val: "en-US",
                eastAsia: "zh-CN",
                bidi: "ar-SA"
            }
        });
        tests.push(assertEquals(
            parser.parse(langRPr),
            {
                lang: {
                    val: "en-US",
                    eastAsia: "zh-CN",
                    bidi: "ar-SA"
                }
            },
            "Parse language settings",
            langRPr?.outerHTML
        ));

        // Test 5: Parse spacing and position
        const spacingPosRPr = createRPrElement({
            position: "2",
            spacing: "2"
        });
        tests.push(assertEquals(
            parser.parse(spacingPosRPr),
            {
                textPositionPt: 1,  // 2/2
                characterSpacingPt: 1  // 2/2
            },
            "Parse spacing and position",
            spacingPosRPr?.outerHTML
        ));

        // Test 6: Parse highlight
        const highlightRPr = createRPrElement({
            highlight: "yellow"
        });
        tests.push(assertEquals(
            parser.parse(highlightRPr),
            {
                highlight: "yellow"
            },
            "Parse highlight",
            highlightRPr?.outerHTML
        ));

        // Test 7: Parse empty rPr element
        const emptyRPr = getXmlElement(`<w:rPr xmlns:w="${NAMESPACE_URI}"></w:rPr>`);
        tests.push(assertEquals(
            parser.parse(emptyRPr),
            {},
            "Parse empty rPr element",
            emptyRPr?.outerHTML
        ));

        // Test 8: Parse null rPr element
        tests.push(assertEquals(
            parser.parse(null),
            {},
            "Parse null rPr element",
            "null"
        ));

        // Test 9: Parse all possible run properties
        const allPropertiesRPr = createRPrElement({
            fonts: {
                ascii: "Calibri",
                hAnsi: "Calibri",
                eastAsia: "SimSun",
                cs: "Arial"
            },
            size: "24",
            color: "FF0000",
            bold: true,
            italic: true,
            underline: "single",
            strike: true,
            hidden: true,
            highlight: "yellow",
            shading: "clear",
            position: "2",
            spacing: "2",
            kerning: "16",
            lang: {
                val: "en-US",
                eastAsia: "zh-CN",
                bidi: "ar-SA"
            },
            emboss: true,
            outline: true,
            shadow: true,
            caps: true,
            smallCaps: false
        });
        tests.push(assertEquals(
            parser.parse(allPropertiesRPr),
            {
                font: {
                    ascii: "Calibri",
                    hAnsi: "Calibri",
                    eastAsia: "SimSun",
                    cs: "Arial"
                },
                sizePt: 12,  // 24/2
                color: "FF0000",
                bold: true,
                italic: true,
                underline: "single",
                strikethrough: true,
                hidden: true,
                lang: {
                    val: "en-US",
                    eastAsia: "zh-CN",
                    bidi: "ar-SA"
                },
                highlight: "yellow",
                shading: "clear",
                textPositionPt: 1,  // 2/2
                kerning: 16,
                characterSpacingPt: 1,  // 2/2
                emboss: true,
                outline: true,
                shadow: true,
                allCaps: true,
                smallCaps: false
            },
            "Parse all possible run properties",
            allPropertiesRPr?.outerHTML
        ));

        return tests;
    });
} 