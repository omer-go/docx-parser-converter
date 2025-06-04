import type { DocumentSchema, DocumentElement } from '../docx_parsers/models/documentModels';
import type { NumberingSchema } from '../docx_parsers/models/numberingModels';
import type { Paragraph } from '../docx_parsers/models/paragraphModels';
import type { Table } from '../docx_parsers/models/tableModels';
import { ParagraphConverter } from './converters/paragraphConverter';
import { TableConverter } from './converters/tableConverter';
import { NumberingConverter } from './converters/numberingConverter';

/**
 * Generates plain text from the document schema, preserving the logic of the Python implementation.
 */
export class TxtGenerator {
    /**
     * Generate plain text from the document schema.
     * @param documentSchema The document schema.
     * @param numberingSchema The numbering schema.
     * @param indent Whether to apply indentation.
     * @returns Plain text representation of the document.
     */
    public static generateTxt(documentSchema: DocumentSchema, numberingSchema: NumberingSchema, indent: boolean): string {
        NumberingConverter.resetCounters();
        return TxtGenerator.generateTxtBody(documentSchema.elements, numberingSchema, indent);
    }

    /**
     * Generate the body text from document elements.
     * @param elements The document elements.
     * @param numberingSchema The numbering schema.
     * @param indent Whether to apply indentation.
     * @returns Body text as a string.
     */
    public static generateTxtBody(elements: DocumentElement[], numberingSchema: NumberingSchema, indent: boolean): string {
        let body = '';
        let prevParagraph: Paragraph | null = null;
        for (const element of elements) {
            if (TxtGenerator.isParagraph(element)) {
                if (prevParagraph) {
                    body += ParagraphConverter.addSpacing(prevParagraph, element);
                }
                const paragraphText = ParagraphConverter.convertParagraph(element, numberingSchema, indent);
                body += paragraphText + '\n';
                prevParagraph = element;
            } else if (TxtGenerator.isTable(element)) {
                const tableText = TableConverter.convertTable(element, numberingSchema, indent);
                body += tableText;
                prevParagraph = null; // Reset previous paragraph after a table
            }
        }
        return body;
    }

    private static isParagraph(element: DocumentElement): element is Paragraph {
        // TypeScript type guard for Paragraph
        return (element as Paragraph).runs !== undefined;
    }

    private static isTable(element: DocumentElement): element is Table {
        // TypeScript type guard for Table
        return (element as Table).rows !== undefined;
    }
} 