import type { DocumentSchema } from '../docx_parsers/models/documentModels';
import type { NumberingSchema } from '../docx_parsers/models/numberingModels';
import { DocxProcessor } from '../docx_parsers/DocxProcessor';
import { TxtGenerator } from './txtGenerator';

/**
 * Class to convert DOCX files to plain text format.
 * Works in both Node.js and browser environments.
 */
export class DocxToTxtConverter {
    private docxFile: ArrayBuffer | Uint8Array | Buffer;
    private documentSchema!: DocumentSchema;
    private numberingSchema!: NumberingSchema;

    /**
     * Initializes the DocxToTxtConverter with the given DOCX file.
     * @param docxFile The DOCX file content (ArrayBuffer, Uint8Array, or Buffer).
     */
    constructor(docxFile: ArrayBuffer | Uint8Array | Buffer) {
        this.docxFile = docxFile;
        // Actual processing is async, so use the async init method after construction
    }

    /**
     * Asynchronously processes the DOCX file and initializes schemas.
     * Must be called before converting to TXT.
     * @param options Optional: pass useDefaultValues (default true)
     */
    public async init(options?: { useDefaultValues?: boolean }): Promise<void> {
        const { documentSchema, numberingSchema } = await DocxProcessor.processDocx(
            this.docxFile,
            options && options.useDefaultValues === false ? undefined : {}
        );
        this.documentSchema = documentSchema;
        this.numberingSchema = numberingSchema;
    }

    /**
     * Convert the DOCX document to plain text.
     * @param indent Whether to apply indentation. Default is false.
     * @returns Plain text representation of the document.
     */
    public convertToTxt(indent: boolean = false): string {
        if (!this.documentSchema || !this.numberingSchema) {
            throw new Error('DocxToTxtConverter: Not initialized. Call init() and await it before converting.');
        }
        return TxtGenerator.generateTxt(this.documentSchema, this.numberingSchema, indent);
    }

    /**
     * Save the generated plain text to a file (Node.js only).
     * @param txtContent The plain text content.
     * @param outputPath The output file path.
     */
    public async saveTxtToFile(txtContent: string, outputPath: string): Promise<void> {
        if (typeof window !== 'undefined') {
            throw new Error('saveTxtToFile is only available in Node.js environments.');
        }
        // Dynamically import fs only if in Node.js
        const fs = await import('fs');
        return new Promise((resolve, reject) => {
            fs.writeFile(outputPath, txtContent, { encoding: 'utf-8' }, (err: NodeJS.ErrnoException | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Static helper to read a file as binary (Node.js only).
     * @param filePath The path to the file to read.
     * @returns Buffer The binary content of the file.
     */
    public static async readBinaryFromFilePath(filePath: string): Promise<Buffer> {
        if (typeof window !== 'undefined') {
            throw new Error('readBinaryFromFilePath is only available in Node.js environments.');
        }
        const fs = await import('fs');
        return fs.readFileSync(filePath);
    }
} 