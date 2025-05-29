/**
 * Table grid parser for DOCX documents
 * Parses table grid structures from w:tblGrid elements
 */

import type { TableGrid } from '@/models/table-models.js';
import { TableGridModel } from '@/models/table-models.js';
import { convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { BaseParser } from '../base-parser.js';

/**
 * Table grid parser class
 */
export class TableGridParser extends BaseParser<TableGrid> {
  constructor(options: Record<string, unknown> = {}) {
    super('TableGridParser', options);
  }

  /**
   * Parse XML object into TableGrid model
   * @param xmlObj - Parsed XML object containing w:tblGrid element
   * @returns Promise resolving to TableGrid model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<TableGrid> {
    // Extract w:tblGrid element
    let tblGridElement: Record<string, unknown>;

    if (xmlObj['w:tblGrid']) {
      const tblGridValue = xmlObj['w:tblGrid'];
      
      // Handle case where w:tblGrid is an array
      if (Array.isArray(tblGridValue)) {
        if (tblGridValue.length === 0) {
          throw new Error('Empty w:tblGrid array found in XML');
        }
        tblGridElement = tblGridValue[0] as Record<string, unknown>;
      } else {
        tblGridElement = tblGridValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:tblGrid element
      tblGridElement = xmlObj;
    } else {
      throw new Error('No w:tblGrid element found in XML');
    }

    return this.parseTableGridElement(tblGridElement);
  }

  /**
   * Parse table grid element
   * @param tblGridElement - w:tblGrid element
   * @returns Parsed TableGrid
   */
  private async parseTableGridElement(tblGridElement: Record<string, unknown>): Promise<TableGrid> {
    const columns: number[] = [];

    // Parse w:gridCol elements
    const gridColElements = this.getChildElements(tblGridElement, 'w:gridCol');
    
    for (const gridColElement of gridColElements) {
      const widthValue = this.getAttribute(gridColElement, 'w:w');
      
      if (widthValue) {
        const parsedWidth = parseInt(widthValue, 10);
        if (!isNaN(parsedWidth)) {
          // Convert from twips to points (DOCX grid columns are typically in twips)
          columns.push(convertTwipsToPoints(parsedWidth));
        } else {
          this.addWarning(`Invalid grid column width: ${widthValue}`);
        }
      } else {
        this.addWarning('Grid column element found without width attribute');
      }
    }

    // If no grid columns found, this might still be valid (some tables don't have explicit grid)
    if (columns.length === 0) {
      this.addWarning('No grid columns found in table grid');
    }

    return TableGridModel.create({
      columns,
    });
  }
} 