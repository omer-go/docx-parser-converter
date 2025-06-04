import * as fs from 'fs';
import { DocxProcessor } from '../docx_parsers/DocxProcessor';
import { HtmlGenerator } from './htmlGenerator';
import { readBinaryFromFilePath } from '../docx_parsers/utils';
import type { DocumentSchema } from '../docx_parsers/models/documentModels';
import type { StylesSchema } from '../docx_parsers/models/stylesModels';
import type { NumberingSchema } from '../docx_parsers/models/numberingModels';

/**
 * A converter class for converting DOCX files to HTML.
 */
export class DocxToHtmlConverter {
    public documentSchema: DocumentSchema;
    public stylesSchema: StylesSchema;
    public numberingSchema: NumberingSchema;

    private constructor(
        documentSchema: DocumentSchema,
        stylesSchema: StylesSchema,
        numberingSchema: NumberingSchema
    ) {
        this.documentSchema = documentSchema;
        this.stylesSchema = stylesSchema;
        this.numberingSchema = numberingSchema;
    }

    /**
     * Async factory to create a DocxToHtmlConverter instance.
     * @param docxFile The binary content of the DOCX file.
     * @param useDefaultValues Whether to use default values for missing styles and numbering. Defaults to true.
     */
    public static async create(docxFile: Buffer | Uint8Array, useDefaultValues: boolean = true): Promise<DocxToHtmlConverter> {
        const { documentSchema, stylesSchema, numberingSchema } = await DocxProcessor.processDocx(docxFile, useDefaultValues ? undefined : {});
        return new DocxToHtmlConverter(documentSchema, stylesSchema, numberingSchema);
    }

    /**
     * Converts the DOCX file to HTML.
     * @returns The generated HTML content as a string.
     */
    public convertToHtml(): string {
        return HtmlGenerator.generateHtml(this.documentSchema, this.numberingSchema);
    }

    /**
     * Saves the generated HTML content to a file.
     * @param htmlContent The HTML content to save.
     * @param outputPath The path to save the HTML file.
     */
    public saveHtmlToFile(htmlContent: string, outputPath: string): void {
        try {
            fs.writeFileSync(outputPath, htmlContent, { encoding: 'utf-8' });
        } catch (e) {
            console.error(`Error: Failed to save HTML file. Error: ${e}`);
        }
    }
}

// Only run this block in Node.js, not in the browser
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    // Sample file paths for testing
    // const docxPath = 'C:/Users/omerh/Desktop/docx_test.docx';
    const docxPath = 'C:/Users/omerh/Desktop/SAFEs for analysis/SAFE 1 - Cap Only.docx';
    const htmlOutputPath = 'C:/Users/omerh/Desktop/new_newnewdocx1.html';

    if (!fs.existsSync(docxPath)) {
        console.error(`File not found: ${docxPath}`);
    } else {
        (async () => {
            let docxFileContent: Buffer;
            try {
                docxFileContent = readBinaryFromFilePath(docxPath);
            } catch (e) {
                console.error(`Error: Failed to read DOCX file. Error: ${e}`);
                return;
            }
            try {
                const converter = await DocxToHtmlConverter.create(docxFileContent, true);
                const htmlOutput = converter.convertToHtml();
                converter.saveHtmlToFile(htmlOutput, htmlOutputPath);
                console.log(`HTML file saved to: ${htmlOutputPath}`);
            } catch (e) {
                console.error(`Error: Failed to convert DOCX to HTML. Error: ${e}`);
            }
        })();
    }
} 