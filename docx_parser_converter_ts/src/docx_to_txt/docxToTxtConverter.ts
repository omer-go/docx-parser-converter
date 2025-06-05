// src/docx_to_txt/docxToTxtConverter.ts
import type { DocumentSchema } from '../docx_parsers/models/documentModels';
import type { NumberingSchema } from '../docx_parsers/models/numberingModels';
import { DocxProcessor } from '../docx_parsers/DocxProcessor';
import { TxtGenerator } from './txtGenerator';

/**
 * Options for DOCX to TXT conversion.
 */
export interface DocxToTxtOptions {
    useDefaultValues?: boolean;
    indent?: boolean;
}

/**
 * Class to convert DOCX files to plain text format.
 * This class is designed to work in both Node.js and browser environments.
 */
export class DocxToTxtConverter {
    private readonly documentSchema: DocumentSchema;
    private readonly numberingSchema: NumberingSchema;

    private constructor(documentSchema: DocumentSchema, numberingSchema: NumberingSchema) {
        this.documentSchema = documentSchema;
        this.numberingSchema = numberingSchema;
    }

    /**
     * Asynchronously creates and initializes a DocxToTxtConverter instance.
     * @param docxFile The DOCX file content (e.g., ArrayBuffer, Uint8Array, or Buffer).
     * @param options Optional conversion parameters.
     * @returns A Promise that resolves to a DocxToTxtConverter instance.
     */
    public static async create(
        docxFile: ArrayBuffer | Uint8Array | Buffer,
        options?: Pick<DocxToTxtOptions, 'useDefaultValues'> // Only useDefaultValues for creation
    ): Promise<DocxToTxtConverter> {
        const useDefaultValues = options?.useDefaultValues !== false; // Default to true
        const processorOptions = useDefaultValues ? undefined : {};
        const { documentSchema, numberingSchema } = await DocxProcessor.processDocx(
            docxFile,
            processorOptions
        );
        return new DocxToTxtConverter(documentSchema, numberingSchema);
    }

    /**
     * Converts the processed DOCX document to plain text.
     * @param options Optional conversion parameters, e.g., for indentation.
     * @returns Plain text representation of the document.
     */
    public convertToTxt(options?: Pick<DocxToTxtOptions, 'indent'>): string {
        if (!this.documentSchema || !this.numberingSchema) {
            throw new Error(
                'DocxToTxtConverter: Instance not properly initialized. Ensure create() was awaited.'
            );
        }
        const indent = options?.indent === true; // Default to false
        return TxtGenerator.generateTxt(this.documentSchema, this.numberingSchema, indent);
    }
}

// Removed Node.js specific file operations (saveTxtToFile, readBinaryFromFilePath).
// Users of the library will handle file input/output themselves.