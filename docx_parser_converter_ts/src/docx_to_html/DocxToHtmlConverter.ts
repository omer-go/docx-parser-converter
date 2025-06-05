// src/docx_to_html/DocxToHtmlConverter.ts
import { DocxProcessor } from '../docx_parsers/DocxProcessor';
import { HtmlGenerator } from './htmlGenerator';
import type { DocumentSchema } from '../docx_parsers/models/documentModels';
import type { StylesSchema } from '../docx_parsers/models/stylesModels';
import type { NumberingSchema } from '../docx_parsers/models/numberingModels';

/**
 * Options for DOCX to HTML conversion.
 */
export interface DocxToHtmlOptions {
    useDefaultValues?: boolean;
}

/**
 * A converter class for converting DOCX files to HTML.
 * This class is designed to work in both Node.js and browser environments.
 */
export class DocxToHtmlConverter {
    public readonly documentSchema: DocumentSchema;
    public readonly stylesSchema: StylesSchema;
    public readonly numberingSchema: NumberingSchema;

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
     * Asynchronously creates and initializes a DocxToHtmlConverter instance.
     * @param docxFile The binary content of the DOCX file (e.g., ArrayBuffer, Uint8Array, Buffer).
     * @param options Optional conversion parameters.
     * @returns A Promise that resolves to a DocxToHtmlConverter instance.
     */
    public static async create(
        docxFile: ArrayBuffer | Uint8Array | Buffer,
        options?: DocxToHtmlOptions
    ): Promise<DocxToHtmlConverter> {
        const useDefaultValues = options?.useDefaultValues !== false; // Default to true
        const processorOptions = useDefaultValues ? undefined : {};
        const { documentSchema, stylesSchema, numberingSchema } = await DocxProcessor.processDocx(
            docxFile,
            processorOptions
        );
        return new DocxToHtmlConverter(documentSchema, stylesSchema, numberingSchema);
    }

    /**
     * Converts the processed DOCX content to an HTML string.
     * @returns The generated HTML content as a string.
     */
    public convertToHtml(): string {
        if (!this.documentSchema || !this.stylesSchema || !this.numberingSchema) {
            throw new Error(
                'DocxToHtmlConverter: Instance not properly initialized. Ensure create() was awaited.'
            );
        }
        return HtmlGenerator.generateHtml(this.documentSchema, this.numberingSchema);
    }
}

// Removed Node.js specific file operations and main execution block.
// Users of the library will handle file input/output themselves.