import type { Run, Paragraph } from '../../docx_parsers/models/paragraphModels';
import type { RunStyleProperties } from '../../docx_parsers/models/stylesModels';
import { StyleConverter } from './styleConverter';

export class RunConverter {
    /**
     * Converts a run to its HTML representation.
     */
    public static convertRun(run: Run, paragraph: Paragraph): string {
        const styleAttribute = RunConverter.convertRunProperties(run.properties);
        let runHtml = `<span${styleAttribute}>`;

        for (const contentItem of run.contents) {
            if (contentItem.type === 'tab') {
                const tabWidth = RunConverter.getNextTabWidth(paragraph);
                runHtml += `<span style="display:inline-block; width:${tabWidth}pt;"></span>`;
            } else if (contentItem.type === 'text') {
                runHtml += contentItem.text;
            }
        }
        runHtml += "</span>";
        return runHtml;
    }

    /**
     * Gets the width of the next tab stop for the paragraph.
     * Returns a default of 36.0pt if no specific tab stops are defined.
     */
    public static getNextTabWidth(paragraph: Paragraph): number {
        if (paragraph.properties?.tabs && paragraph.properties.tabs.length > 0) {
            return paragraph.properties.tabs[0].pos;
        }
        return 36.0; // Default tab width in points
    }

    /**
     * Converts run properties to an HTML style attribute string.
     */
    public static convertRunProperties(properties?: RunStyleProperties): string {
        if (!properties) {
            return "";
        }

        let style = "";
        style += StyleConverter.convertBold(properties.bold);
        style += StyleConverter.convertItalic(properties.italic);
        style += StyleConverter.convertUnderline(properties.underline);
        style += StyleConverter.convertColor(properties.color);
        style += StyleConverter.convertFont(properties.font);
        style += StyleConverter.convertSize(properties.sizePt);

        return style ? ` style="${style}"` : "";
    }
}

// Example Usage (equivalent to Python's if __name__ == "__main__")
/*
function testRunConverter() {
    console.log("--- Testing RunConverter ---");

    const sampleParagraphProperties = {
        tabs: [{ val: "left" as const, pos: 72 }]
    };

    const sampleParagraphWithTabs: Paragraph = {
        properties: sampleParagraphProperties,
        runs: [], 
    };
    
    const sampleParagraphNoTabs: Paragraph = {
        properties: {},
        runs: [],
    };

    const run1Contents = [
        { type: 'text', text: "This is bold text. " },
        { type: 'tab' },
        { type: 'text', text: "After tab." }
    ];
    const run1Properties: RunStyleProperties = { bold: true, sizePt: 12, font: { ascii: "Arial" } };
    const run1: Run = { contents: run1Contents, properties: run1Properties };

    let htmlOutput1 = RunConverter.convertRun(run1, sampleParagraphWithTabs);
    console.log("Run 1 (bold, tab 72pt, Arial 12pt):");
    console.log(htmlOutput1);
    console.log("Expected: <span style=\"font-weight:bold;font-family:\"Arial\";font-size:12pt;\">This is bold text. <span style=\"display:inline-block; width:72pt;\"></span>After tab.</span>");

    const run2Contents = [
        { type: 'text', text: "This is italic text." },
    ];
    const run2Properties: RunStyleProperties = { italic: true, color: "#FF0000" };
    const run2: Run = { contents: run2Contents, properties: run2Properties };

    let htmlOutput2 = RunConverter.convertRun(run2, sampleParagraphNoTabs);
    console.log("\nRun 2 (italic, red, no explicit tab - default would be 36pt if tab char present):");
    console.log(htmlOutput2);
    console.log("Expected: <span style=\"font-style:italic;color:#FF0000;\">This is italic text.</span>");
    
    const run3Contents = [
        { type: 'tab' }
    ];
    const run3: Run = { contents: run3Contents }; 

    let htmlOutput3 = RunConverter.convertRun(run3, sampleParagraphNoTabs);
    console.log("\nRun 3 (only a tab, paragraph has no tabs - default 36pt):");
    console.log(htmlOutput3);
    console.log("Expected: <span><span style=\"display:inline-block; width:36pt;\"></span></span>");

    let htmlOutput3WithTabPara = RunConverter.convertRun(run3, sampleParagraphWithTabs);
    console.log("\nRun 3 (only a tab, paragraph has 72pt tab):");
    console.log(htmlOutput3WithTabPara);
    console.log("Expected: <span><span style=\"display:inline-block; width:72pt;\"></span></span>");

    const run4Contents = [
        { type: 'text', text: "Underlined" },
        { type: 'text', text: " and normal."}
    ];
    const run4Properties: RunStyleProperties = { underline: "single" };
    const run4: Run = { contents: run4Contents, properties: run4Properties };
    let htmlOutput4 = RunConverter.convertRun(run4, sampleParagraphNoTabs);
    console.log("\nRun 4 (Underlined and normal text):");
    console.log(htmlOutput4);
    console.log("Expected: <span style=\"text-decoration:underline;\">Underlined and normal.</span>");

    const run5Contents = [
        { type: 'text', text: "Simple text." }
    ];
    const run5: Run = { contents: run5Contents };
    let htmlOutput5 = RunConverter.convertRun(run5, sampleParagraphNoTabs);
    console.log("\nRun 5 (Simple text, no properties):");
    console.log(htmlOutput5);
    console.log("Expected: <span>Simple text.</span>");

    console.log(`\nTab width for paragraphWithTabs: ${RunConverter.getNextTabWidth(sampleParagraphWithTabs)} (Expected: 72)`);
    console.log(`Tab width for paragraphNoTabs: ${RunConverter.getNextTabWidth(sampleParagraphNoTabs)} (Expected: 36)`);
}

// To run the test:
// 1. Ensure you have ts-node installed (npm install -g ts-node) or use your project's runner.
// 2. Ensure StyleConverter.ts is in the same directory or paths are correctly resolved.
// 3. Define or import related types like ParagraphStyleProperties if needed for more complex Paragraph objects.
// 4. Uncomment the line below and run the file (e.g., using ts-node)
// testRunConverter();
*/ 