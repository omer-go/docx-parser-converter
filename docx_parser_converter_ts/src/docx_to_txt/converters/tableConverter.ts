import type { Table, TableRow, TableCell } from '../../docx_parsers/models/tableModels';
import type { NumberingSchema } from '../../docx_parsers/models/numberingModels';
import { ParagraphConverter } from './paragraphConverter';

/**
 * Converts a table to plain text for TXT output, preserving the logic of the Python implementation.
 */
export class TableConverter {
    /**
     * Convert a table to plain text format.
     * @param table The table to convert.
     * @param numberingSchema The numbering schema to use for paragraphs within the table.
     * @param indent Whether to apply indentation to paragraphs within the table.
     * @returns Plain text representation of the table.
     */
    public static convertTable(table: Table, numberingSchema: NumberingSchema, indent: boolean = false): string {
        if (!table || !table.rows || table.rows.length === 0) {
            return '';
        }
        let tableText = '\n'; // Add a newline before the table
        for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
            const row = table.rows[rowIndex];
            const rowText = TableConverter.convertRow(row, numberingSchema, indent);
            tableText += rowText;
            if (rowIndex < table.rows.length - 1) {
                tableText += '\n'; // Separator line between rows
            }
        }
        tableText += '\n'; // Add a newline after the table
        return tableText;
    }

    /**
     * Convert a table row to plain text format.
     * @param row The table row to convert.
     * @param numberingSchema The numbering schema to use for paragraphs within the row.
     * @param indent Whether to apply indentation to paragraphs within the row.
     * @returns Plain text representation of the row.
     */
    public static convertRow(row: TableRow, numberingSchema: NumberingSchema, indent: boolean = false): string {
        if (!row || !row.cells || row.cells.length === 0) {
            return '';
        }
        let rowText = '';
        for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
            const cell = row.cells[cellIndex];
            const cellText = TableConverter.convertCell(cell, numberingSchema, indent);
            rowText += cellText;
            if (cellIndex < row.cells.length - 1) {
                rowText += ' | '; // Separator between cells
            }
        }
        return rowText;
    }

    /**
     * Convert a table cell to plain text format.
     * @param cell The table cell to convert.
     * @param numberingSchema The numbering schema to use for paragraphs within the cell.
     * @param indent Whether to apply indentation to paragraphs within the cell.
     * @returns Plain text representation of the cell.
     */
    public static convertCell(cell: TableCell, numberingSchema: NumberingSchema, indent: boolean = false): string {
        if (!cell || !cell.paragraphs || cell.paragraphs.length === 0) {
            return '';
        }
        let cellText = '';
        for (let paraIndex = 0; paraIndex < cell.paragraphs.length; paraIndex++) {
            const paragraph = cell.paragraphs[paraIndex];
            const paraText = ParagraphConverter.convertParagraph(paragraph, numberingSchema, indent);
            cellText += paraText;
            if (paraIndex < cell.paragraphs.length - 1) {
                cellText += ' '; // Space between paragraphs in the same cell
            }
        }
        return cellText;
    }
} 