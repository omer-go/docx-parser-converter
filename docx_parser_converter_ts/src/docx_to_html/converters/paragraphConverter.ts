import type { Paragraph } from '../../docx_parsers/models/paragraphModels';
import type { ParagraphStyleProperties } from '../../docx_parsers/models/stylesModels';
import type { NumberingSchema } from '../../docx_parsers/models/numberingModels';
import { StyleConverter } from './styleConverter';
import { RunConverter } from './runConverter';
import { NumberingConverter } from './numberingConverter';

export class ParagraphConverter {
    /**
     * Converts a paragraph to its HTML representation.
     *
     * @param paragraph The paragraph to convert.
     * @param numberingSchema The schema containing numbering definitions.
     * @returns The HTML representation of the paragraph.
     */
    public static convertParagraph(paragraph: Paragraph, numberingSchema: NumberingSchema): string {
        const styleAttribute = ParagraphConverter.convertParagraphProperties(paragraph.properties);
        let paragraphHtml = `<p${styleAttribute}>`;

        if (paragraph.numbering) {
            paragraphHtml += NumberingConverter.convertNumbering(paragraph, numberingSchema);
        }

        for (const run of paragraph.runs) {
            paragraphHtml += RunConverter.convertRun(run, paragraph);
        }

        paragraphHtml += "</p>";
        return paragraphHtml;
    }

    /**
     * Converts paragraph properties to an HTML style attribute.
     *
     * @param properties The paragraph style properties to convert.
     * @returns The HTML style attribute representing the paragraph properties.
     */
    public static convertParagraphProperties(properties: ParagraphStyleProperties): string {
        let style = "";

        // paragraph.properties is ParagraphStyleProperties, which has optional spacing, indent, justification
        if (properties.spacing) {
            style += StyleConverter.convertSpacing(properties.spacing);
        }
        if (properties.indent) {
            style += StyleConverter.convertIndent(properties.indent);
        }
        if (properties.justification) {
            style += StyleConverter.convertJustification(properties.justification);
        }

        return style ? ` style="${style}"` : "";
    }
}

// Example Usage (equivalent to Python's if __name__ == "__main__")
/*
import type { Run, RunContent } from '../../docx_parsers/models/paragraphModels';
import type { NumberingLevel, NumberingInstance } from '../../docx_parsers/models/numberingModels';
import type { RunStyleProperties, FontProperties, IndentationProperties, SpacingProperties } from '../../docx_parsers/models/stylesModels';

function testParagraphConverter() {
    console.log("--- Testing ParagraphConverter ---");

    // --- Mock Data Setup ---

    // Mock NumberingSchema
    const sampleNumberingLevel: NumberingLevel = {
        numId: 1, ilvl: 0, start: 1, numFmt: "decimal", lvlText: "%1.", lvlJc: "left",
        fonts: { ascii: "Times New Roman" },
        indent: { leftPt: 36, firstLinePt: -18 } // Example hanging indent for numbering
    };
    const sampleNumberingInstance: NumberingInstance = { numId: 1, levels: [sampleNumberingLevel] };
    const sampleNumberingSchema: NumberingSchema = { instances: [sampleNumberingInstance] };

    // Mock Run 1 (part of a numbered list)
    const run1Contents = [
        { type: 'text' as const, text: "This is the first item." }
    ];
    const run1: Run = { contents: run1Contents }; // No specific run properties for simplicity here

    // Mock Paragraph 1 (Numbered List Item)
    const para1Properties: ParagraphStyleProperties = {
        justification: "left",
        spacing: { beforePt: 6, afterPt: 6 }
    };
    const paragraph1: Paragraph = {
        properties: para1Properties,
        runs: [run1],
        numbering: { numId: 1, ilvl: 0 }
    };

    // Mock Run 2 (simple text run)
    const run2Contents = [
        { type: 'text' as const, text: "This is a simple paragraph with " },
        { type: 'text' as const, text: "bold text." }
    ];
    const run2Properties: RunStyleProperties = { bold: true };
    const run2Run1: Run = { contents: [{ type: 'text' as const, text: "This is a simple paragraph with " }] };
    const run2Run2: Run = { contents: [{ type: 'text' as const, text: "bold text." }], properties: run2Properties };

    // Mock Paragraph 2 (Simple Paragraph)
    const para2Properties: ParagraphStyleProperties = {
        justification: "center",
        indent: { leftPt: 36, rightPt: 36 }
    };
    const paragraph2: Paragraph = {
        properties: para2Properties,
        runs: [run2Run1, run2Run2]
    };
    
    // Mock Paragraph 3 (Paragraph with no specific properties, just text)
    const paragraph3: Paragraph = {
        properties: {},
        runs: [{ contents: [{ type: 'text' as const, text: "Just plain text."}]}]
    }


    // --- Test Execution ---
    NumberingConverter.resetCounters(); // Reset for consistent numbering tests

    console.log("\n--- Paragraph 1 (Numbered List Item) ---");
    let htmlOutput = ParagraphConverter.convertParagraph(paragraph1, sampleNumberingSchema);
    console.log(htmlOutput);
    // Expected structure: <p style="margin-top:6pt;margin-bottom:6pt;text-align:left;"><span style="font-family:Times New Roman;">1.</span><span style="padding-left:..."></span><span>This is the first item.</span></p>
    console.log("Expected structure: <p style=\"margin-top:6pt;margin-bottom:6pt;text-align:left;\"><span style=\"font-family:Times New Roman;\">1.</span><span style=\"padding-left:..."></span><span>This is the first item.</span></p>");

    console.log("\n--- Paragraph 2 (Simple Paragraph with Indent and Centered Text) ---");
    htmlOutput = ParagraphConverter.convertParagraph(paragraph2, sampleNumberingSchema); // numbering_schema won't be used
    console.log(htmlOutput);
    // Expected structure: <p style="margin-left:36pt;margin-right:36pt;text-align:center;"><span>This is a simple paragraph with </span><span style="font-weight:bold;">bold text.</span></p>
    console.log("Expected structure: <p style=\"margin-left:36pt;margin-right:36pt;text-align:center;\"><span >This is a simple paragraph with </span><span style=\"font-weight:bold;\">bold text.</span></p>");

    console.log("\n--- Paragraph 3 (Plain text, no specific styles) ---");
    htmlOutput = ParagraphConverter.convertParagraph(paragraph3, sampleNumberingSchema);
    console.log(htmlOutput);
    console.log("Expected structure: <p><span>Just plain text.</span></p>");


    // Test convertParagraphProperties directly
    console.log("\n--- Testing convertParagraphProperties ---");
    const propsOnlySpacing: ParagraphStyleProperties = { spacing: { afterPt: 12 } };
    console.log(`Props with only spacing: "${ParagraphConverter.convertParagraphProperties(propsOnlySpacing)}" (Expected:  style="margin-bottom:12pt;")`);

    const propsOnlyIndent: ParagraphStyleProperties = { indent: { leftPt: 72 } };
    console.log(`Props with only indent: "${ParagraphConverter.convertParagraphProperties(propsOnlyIndent)}" (Expected:  style="margin-left:72pt;")`);

    const propsOnlyJustify: ParagraphStyleProperties = { justification: "right" };
    console.log(`Props with only justify: "${ParagraphConverter.convertParagraphProperties(propsOnlyJustify)}" (Expected:  style="text-align:right;")`);
    
    const emptyProps: ParagraphStyleProperties = {};
    console.log(`Empty props: "${ParagraphConverter.convertParagraphProperties(emptyProps)}" (Expected: "")`);

    const allProps: ParagraphStyleProperties = {
        spacing: { beforePt: 6, afterPt: 6, linePt: 24 },
        indent: { leftPt: 36, rightPt: 36, firstLinePt: -18 }, // Negative firstLine for hanging
        justification: "justify"
    };
    const expectedAllPropsStyle = " style=\"margin-top:6pt;margin-bottom:6pt;line-height:24pt;margin-left:36pt;margin-right:36pt;text-indent:-18pt;text-align:justify;\"";
    console.log(`All props: "${ParagraphConverter.convertParagraphProperties(allProps)}" (Expected: ${expectedAllPropsStyle})`);

}

// To run the test:
// 1. Ensure ts-node is installed.
// 2. Ensure StyleConverter.ts, RunConverter.ts, NumberingConverter.ts are compiled/available in the same relative structure.
// 3. All model types (Paragraph, NumberingSchema, etc.) must be correctly defined and imported.
// 4. Uncomment the line below and run (e.g., `ts-node path/to/paragraphConverter.ts`)
// testParagraphConverter();
*/ 