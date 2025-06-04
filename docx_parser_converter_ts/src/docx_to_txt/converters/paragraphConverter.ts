import type { Paragraph } from '../../docx_parsers/models/paragraphModels';
import type { NumberingSchema } from '../../docx_parsers/models/numberingModels';
import { RunConverter } from './runConverter';
import { NumberingConverter } from './numberingConverter';

/**
 * Converts a paragraph to plain text for TXT output, preserving the logic of the Python implementation.
 */
export class ParagraphConverter {
    /**
     * Convert a paragraph to plain text.
     * @param paragraph The paragraph object.
     * @param numberingSchema The numbering schema.
     * @param indent Whether to apply indentation.
     * @returns Plain text representation of the paragraph.
     */
    public static convertParagraph(paragraph: Paragraph, numberingSchema: NumberingSchema, indent: boolean): string {
        let paragraphText = '';
        if (paragraph.numbering) {
            paragraphText += NumberingConverter.convertNumbering(paragraph, numberingSchema);
        }
        for (const run of paragraph.runs) {
            paragraphText += RunConverter.convertRun(run);
        }
        if (indent && paragraph.properties && paragraph.properties.indent) {
            const indentValue = paragraph.properties.indent.leftPt || 0;
            paragraphText = ParagraphConverter.addIndentation(paragraphText, indentValue);
        }
        return paragraphText;
    }

    /**
     * Add indentation to the text based on the indent value in points.
     * @param text The text to indent.
     * @param indentValue The indentation value in points.
     * @returns The indented text.
     */
    public static addIndentation(text: string, indentValue: number): string {
        const tabSizeInPoints = 36;
        const numTabs = Math.floor(indentValue / tabSizeInPoints);
        const remainingPoints = indentValue % tabSizeInPoints;
        const numSpaces = Math.floor(remainingPoints / (tabSizeInPoints / 4)); // Assume 4 spaces per tab size
        return '\t'.repeat(numTabs) + ' '.repeat(numSpaces) + text;
    }

    /**
     * Add spacing between paragraphs based on their spacing properties.
     * @param prevParagraph The previous paragraph.
     * @param currParagraph The current paragraph.
     * @returns Newlines to add for spacing.
     */
    public static addSpacing(prevParagraph: Paragraph, currParagraph: Paragraph): string {
        const spacingAfter = prevParagraph.properties?.spacing?.afterPt ?? 0;
        const spacingBefore = currParagraph.properties?.spacing?.beforePt ?? 0;
        // Total spacing in points
        const totalSpacingPoints = spacingAfter + spacingBefore;
        // Convert points to newlines (1 newline = 12 points, assuming standard line height)
        // Use a threshold of 6 points for adding a newline
        const threshold = 6;
        const numNewlines = Math.floor((totalSpacingPoints + threshold) / 12);
        return '\n'.repeat(numNewlines);
    }

    /**
     * Convert paragraph properties to text format (not used for TXT output, returns empty string).
     * @returns Text representation of paragraph properties.
     */
    public static convertParagraphProperties(): string {
        // Not used for TXT output
        return '';
    }
} 