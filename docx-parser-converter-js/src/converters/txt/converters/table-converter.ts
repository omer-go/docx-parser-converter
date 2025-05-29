/**
 * Table Converter for TXT Output
 * 
 * Converts DOCX table elements to plain text format
 * with ASCII-style borders and proper alignment.
 */

import type { Table, TableCell } from '@/models/table-models.js';
import type { TxtElement, ConversionContext } from './index.js';
import { ParagraphConverter } from './paragraph-converter.js';

/**
 * Interface for table cell data
 */
interface CellData {
  content: string;
  width: number;
  height: number;
  colspan: number;
  lines: string[];
}

/**
 * Converter for DOCX table elements to plain text
 */
export class TableConverter {
  /**
   * Convert a DOCX table to plain text format
   * @param table - DOCX table element
   * @param context - Conversion context
   * @returns TXT element representing the table
   */
  static convertTable(table: Table, context: ConversionContext): TxtElement {
    if (!context.preserveTableStructure) {
      // Simple table conversion without structure
      return this.convertTableSimple(table, context);
    }

    // Full ASCII table conversion
    return this.convertTableWithStructure(table, context);
  }

  /**
   * Convert table to simple text format (list-like)
   * @param table - DOCX table element
   * @param context - Conversion context
   * @returns TXT element with simple table representation
   */
  private static convertTableSimple(table: Table, context: ConversionContext): TxtElement {
    const lines: string[] = [];
    
    if (context.includeDebugComments) {
      lines.push(`[Table: ${table.rows.length} row(s)]`);
    }

    let rowIndex = 0;
    for (const row of table.rows) {
      lines.push(`Row ${rowIndex + 1}:`);
      
      let cellIndex = 0;
      for (const cell of row.cells) {
        const cellContent = this.getCellTextContent(cell, context);
        if (cellContent.trim()) {
          lines.push(`  Cell ${cellIndex + 1}: ${cellContent}`);
        }
        cellIndex++;
      }
      
      lines.push(''); // Empty line between rows
      rowIndex++;
    }

    return {
      content: lines.join('\n'),
      lineBreak: true,
      spaceAfter: true,
    };
  }

  /**
   * Convert table with ASCII structure preservation
   * @param table - DOCX table element
   * @param context - Conversion context
   * @returns TXT element with structured table representation
   */
  private static convertTableWithStructure(table: Table, context: ConversionContext): TxtElement {
    // Analyze table structure
    const cellData = this.analyzeCellData(table, context);
    const columnWidths = this.calculateColumnWidths(cellData);
    
    // Generate ASCII table
    const tableLines = this.generateAsciiTable(cellData, columnWidths);
    
    return {
      content: tableLines.join('\n'),
      lineBreak: true,
      spaceAfter: true,
    };
  }

  /**
   * Analyze cell data and content
   * @param table - DOCX table element
   * @param context - Conversion context
   * @returns Matrix of cell data
   */
  private static analyzeCellData(table: Table, context: ConversionContext): CellData[][] {
    const cellData: CellData[][] = [];

    for (const row of table.rows) {
      const rowData: CellData[] = [];
      
      for (const cell of row.cells) {
        const content = this.getCellTextContent(cell, context);
        const lines = content.split('\n').filter(line => line.trim());
        const width = Math.max(...lines.map(line => line.length), 1);
        const height = Math.max(lines.length, 1);
        const colspan = cell.properties?.gridSpan || 1;

        rowData.push({
          content,
          width,
          height,
          colspan,
          lines: lines.length > 0 ? lines : [''],
        });
      }
      
      cellData.push(rowData);
    }

    return cellData;
  }

  /**
   * Calculate optimal column widths
   * @param cellData - Matrix of cell data
   * @returns Array of column widths
   */
  private static calculateColumnWidths(cellData: CellData[][]): number[] {
    if (cellData.length === 0) return [];

    const maxColumns = Math.max(...cellData.map(row => row.length));
    const columnWidths: number[] = new Array(maxColumns).fill(0);

    // Calculate minimum width for each column
    for (const row of cellData) {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cell = row[colIndex];
        if (cell && cell.colspan === 1) {
          columnWidths[colIndex] = Math.max(columnWidths[colIndex] || 0, cell.width);
        }
      }
    }

    // Ensure minimum width of 3 for readability
    return columnWidths.map(width => Math.max(width, 3));
  }

  /**
   * Generate ASCII table representation
   * @param cellData - Matrix of cell data
   * @param columnWidths - Array of column widths
   * @returns Array of table lines
   */
  private static generateAsciiTable(cellData: CellData[][], columnWidths: number[]): string[] {
    const lines: string[] = [];
    
    if (cellData.length === 0) return lines;

    // Top border
    lines.push(this.generateHorizontalBorder(columnWidths, 'top'));

    // Process each row
    for (let rowIndex = 0; rowIndex < cellData.length; rowIndex++) {
      const row = cellData[rowIndex];
      if (!row) continue;

      // Calculate row height
      const rowHeight = Math.max(...row.map(cell => cell?.height || 1));

      // Generate content lines for this row
      for (let lineIndex = 0; lineIndex < rowHeight; lineIndex++) {
        let rowLine = '|';
        
        for (let colIndex = 0; colIndex < columnWidths.length; colIndex++) {
          const cell = row[colIndex];
          const columnWidth = columnWidths[colIndex] || 3;
          
          let cellContent = '';
          if (cell && lineIndex < cell.lines.length) {
            cellContent = cell.lines[lineIndex] || '';
          }
          
          // Pad or truncate content to fit column width
          if (cellContent.length > columnWidth) {
            cellContent = cellContent.substring(0, columnWidth - 3) + '...';
          } else {
            cellContent = cellContent.padEnd(columnWidth);
          }
          
          rowLine += ` ${cellContent} |`;
        }
        
        lines.push(rowLine);
      }

      // Add row separator (except after last row)
      if (rowIndex < cellData.length - 1) {
        lines.push(this.generateHorizontalBorder(columnWidths, 'middle'));
      }
    }

    // Bottom border
    lines.push(this.generateHorizontalBorder(columnWidths, 'bottom'));

    return lines;
  }

  /**
   * Generate horizontal border line
   * @param columnWidths - Array of column widths
   * @param position - Border position (top, middle, bottom)
   * @returns Border line string
   */
  private static generateHorizontalBorder(columnWidths: number[], position: 'top' | 'middle' | 'bottom'): string {
    const chars = {
      top: { corner: '+', horizontal: '-', junction: '+' },
      middle: { corner: '+', horizontal: '-', junction: '+' },
      bottom: { corner: '+', horizontal: '-', junction: '+' },
    };

    const { corner, horizontal, junction } = chars[position];
    
    let border = corner;
    for (let i = 0; i < columnWidths.length; i++) {
      const width = columnWidths[i] || 3;
      border += horizontal.repeat(width + 2); // +2 for padding spaces
      border += i < columnWidths.length - 1 ? junction : corner;
    }
    
    return border;
  }

  /**
   * Get text content from a table cell
   * @param cell - DOCX table cell element
   * @param context - Conversion context
   * @returns Plain text content
   */
  private static getCellTextContent(cell: TableCell, context: ConversionContext): string {
    const paragraphTexts: string[] = [];
    
    for (const paragraph of cell.paragraphs) {
      const paragraphElement = ParagraphConverter.convertParagraph(paragraph, context);
      if (paragraphElement.content && paragraphElement.content.trim()) {
        paragraphTexts.push(paragraphElement.content.trim());
      }
    }
    
    return paragraphTexts.join(' ').trim();
  }

  /**
   * Get text content from entire table (for utility purposes)
   * @param table - DOCX table element
   * @param context - Conversion context
   * @returns Plain text content
   */
  static getTextContent(table: Table, context: ConversionContext): string {
    const cellTexts: string[] = [];
    
    for (const row of table.rows) {
      for (const cell of row.cells) {
        const cellContent = this.getCellTextContent(cell, context);
        if (cellContent) {
          cellTexts.push(cellContent);
        }
      }
    }
    
    return cellTexts.join(' ');
  }

  /**
   * Check if a table is empty (no text content)
   * @param table - DOCX table element
   * @param context - Conversion context
   * @returns True if table has no meaningful content
   */
  static isEmpty(table: Table, context: ConversionContext): boolean {
    const textContent = this.getTextContent(table, context).trim();
    return textContent.length === 0;
  }

  /**
   * Get table statistics
   * @param table - DOCX table element
   * @returns Statistics about the table
   */
  static getStatistics(table: Table): {
    rowCount: number;
    columnCount: number;
    cellCount: number;
    hasHeaders: boolean;
  } {
    const rowCount = table.rows.length;
    const columnCount = table.rows.length > 0 ? Math.max(...table.rows.map(row => row.cells.length)) : 0;
    const cellCount = table.rows.reduce((total, row) => total + row.cells.length, 0);
    
    // Simple heuristic: first row might be headers if it's different from others
    const hasHeaders = table.rows.length > 1 && table.rows[0] !== undefined;
    
    return {
      rowCount,
      columnCount,
      cellCount,
      hasHeaders,
    };
  }
} 