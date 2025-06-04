import type { DocumentSchema, DocMargins, DocumentElement } from '../docx_parsers/models/documentModels';
import type { Paragraph } from '../docx_parsers/models/paragraphModels'; // For type guard
import type { Table } from '../docx_parsers/models/tableModels'; // For type guard
import type { NumberingSchema } from '../docx_parsers/models/numberingModels';

import { StyleConverter } from './converters/styleConverter';
import { ParagraphConverter } from './converters/paragraphConverter';
import { TableConverter } from './converters/tableConverter';
import { NumberingConverter } from './converters/numberingConverter';

// Type Guards
function isParagraph(element: DocumentElement): element is Paragraph {
    return 'runs' in element && 'properties' in element;
}

function isTable(element: DocumentElement): element is Table {
    return 'rows' in element && 'grid' in element; // grid is optional, but rows is mandatory
}

export class HtmlGenerator {
    /**
     * Generates the HTML content for the body of the document.
     *
     * @param docMargins Optional document margins.
     * @param elements Array of document elements (paragraphs or tables).
     * @param numberingSchema Schema for numbering definitions.
     * @returns HTML string representing the document body content.
     */
    public static generateHtmlBody(
        docMargins: DocMargins | undefined,
        elements: DocumentElement[],
        numberingSchema: NumberingSchema
    ): string {
        let bodyDivStyle = "";
        if (docMargins) {
            bodyDivStyle = StyleConverter.convertDocMargins(docMargins);
        }

        let contentHtml = "";
        for (const element of elements) {
            if (isParagraph(element)) {
                contentHtml += ParagraphConverter.convertParagraph(element, numberingSchema);
            } else if (isTable(element)) {
                contentHtml += TableConverter.convertTable(element);
            }
        }
        return `<div style="${bodyDivStyle}">${contentHtml}</div>`;
    }

    /**
     * Generates the full HTML document string from a document schema and numbering schema.
     *
     * @param documentSchema The schema representing the document's content and structure.
     * @param numberingSchema The schema for numbering definitions.
     * @returns A string representing the complete HTML document.
     */
    public static generateHtml(documentSchema: DocumentSchema, numberingSchema: NumberingSchema): string {
        NumberingConverter.resetCounters(); // Ensure numbering is reset for each document generation

        const bodyContent = HtmlGenerator.generateHtmlBody(
            documentSchema.docMargins,
            documentSchema.elements,
            numberingSchema
        );

        // Construct the full HTML document
        // Note: Pretty printing is not applied here as it was with lxml in Python.
        // The output will be a valid but non-indented HTML string.
        const fullHtml = `<html>\n<body>\n${bodyContent}\n</body>\n</html>`;
        return fullHtml;
    }
}

// Example Usage (equivalent to Python's if __name__ == "__main__")
/*
import type { Run, RunContent } from '../docx_parsers/models/paragraphModels';
import type { NumberingLevel, NumberingInstance } from '../docx_parsers/models/numberingModels';
import type { TableCell, TableRow, TableGrid, TableProperties } from '../docx_parsers/models/tableModels';
import type { ParagraphStyleProperties, RunStyleProperties } from '../docx_parsers/models/stylesModels';

function testHtmlGenerator() {
    console.log("--- Testing HtmlGenerator ---");
    NumberingConverter.resetCounters(); // Reset before test

    // --- Mock Data Setup ---

    // 1. Numbering Schema
    const sampleNumberingLevel: NumberingLevel = {
        numId: 1, ilvl: 0, start: 1, numFmt: "decimal", lvlText: "%1.", lvlJc: "left",
        fonts: { ascii: "Test Font" }
    };
    const sampleNumberingInstance: NumberingInstance = { numId: 1, levels: [sampleNumberingLevel] };
    const sampleNumberingSchema: NumberingSchema = { instances: [sampleNumberingInstance] };

    // 2. Document Elements
    // Element 1: A numbered paragraph
    const p1Run: Run = { contents: [{ type: 'text', text: "First item in list." }] };
    const p1Props: ParagraphStyleProperties = { justification: "left" };
    const paragraph1: Paragraph = {
        properties: p1Props,
        runs: [p1Run],
        numbering: { numId: 1, ilvl: 0 }
    };

    // Element 2: A simple paragraph
    const p2Run: Run = { contents: [{ type: 'text', text: "Just a normal paragraph." }] };
    const p2Props: ParagraphStyleProperties = { justification: "center" };
    const paragraph2: Paragraph = { properties: p2Props, runs: [p2Run] };

    // Element 3: A table
    const tableCell1: TableCell = { paragraphs: [{ properties: {}, runs: [{ contents: [{type: 'text', text: "R1C1"}] }] }] };
    const tableCell2: TableCell = { paragraphs: [{ properties: {}, runs: [{ contents: [{type: 'text', text: "R1C2"}] }] }] };
    const tableRow1: TableRow = { cells: [tableCell1, tableCell2] };
    const tableGrid: TableGrid = { columns: [100, 100] };
    const tableProps: TableProperties = { tblW: { width: 200, type: "pt" } };
    const sampleTable: Table = {
        properties: tableProps,
        grid: tableGrid,
        rows: [tableRow1]
    };
    
    // Element 4: Another paragraph after table
    const p3Run: Run = { contents: [{ type: 'text', text: "Paragraph after table." }] };
    const p3Props: ParagraphStyleProperties = { justification: "right" };
    const paragraph3: Paragraph = { properties: p3Props, runs: [p3Run] }; 


    const documentElements: DocumentElement[] = [paragraph1, paragraph2, sampleTable, paragraph3];

    // 3. Document Margins
    const sampleDocMargins: DocMargins = {
        topPt: 72, rightPt: 72, bottomPt: 72, leftPt: 72, // 1 inch margins
        headerPt: 36, footerPt: 36 // 0.5 inch header/footer
    };

    // 4. Document Schema
    const sampleDocumentSchema: DocumentSchema = {
        elements: documentElements,
        docMargins: sampleDocMargins
    };

    // --- Test Execution ---
    console.log("\n--- Generating Full HTML Document ---");
    const fullHtml = HtmlGenerator.generateHtml(sampleDocumentSchema, sampleNumberingSchema);
    console.log(fullHtml);

    // Expected output will be a string. Manual verification of structure:
    // <html>
    // <body>
    // <div style="padding-top:72pt; padding-right:72pt; padding-bottom:72pt; padding-left:72pt; padding-top:36pt; padding-bottom:36pt;">
    //   <p style="text-align:left;"><span style="font-family:Test Font;">1.</span><span style="padding-left:7.2pt;"></span><span>First item in list.</span></p>
    //   <p style="text-align:center;"><span>Just a normal paragraph.</span></p>
    //   <table style="border-collapse: collapse; width:200pt;"><colgroup><col style="width:100pt;"><col style="width:100pt;"></colgroup><tbody><tr style=""><td style="word-wrap: break-word; word-break: break-all; overflow-wrap: break-word; overflow: hidden; vertical-align: top;"><p><span>R1C1</span></p></td><td style="word-wrap: break-word; word-break: break-all; overflow-wrap: break-word; overflow: hidden; vertical-align: top;"><p><span>R1C2</span></p></td></tr></tbody></table>
    //   <p style="text-align:right;"><span>Paragraph after table.</span></p>
    // </div>
    // </body>
    // </html>
    
    console.log("\n--- Generating HTML Body Only (no margins, for simplicity) ---");
    const bodyOnlySchema: DocumentSchema = {
        elements: [paragraph2] // Just one paragraph
    };
    const bodyOnlyHtml = HtmlGenerator.generateHtmlBody(undefined, bodyOnlySchema.elements, sampleNumberingSchema);
    console.log(bodyOnlyHtml);
    // Expected: <div style=""><p style="text-align:center;"><span>Just a normal paragraph.</span></p></div>

}

// To run the test:
// 1. Ensure ts-node is installed.
// 2. Ensure all converter files (StyleConverter, ParagraphConverter, etc.) and models are available and paths are correct.
// 3. Uncomment the line below and run (e.g., `ts-node path/to/htmlGenerator.ts`)
// testHtmlGenerator();
*/ 