/**
 * Table properties parser for DOCX documents
 * Parses table properties from w:tblPr elements
 */

import type { 
  TableProperties, 
  TableWidth, 
  TableIndent, 
  TableLook, 
  TableCellBorders, 
  ShadingProperties, 
  MarginProperties 
} from '@/models/table-models.js';
import { 
  TablePropertiesModel, 
  TableWidthModel, 
  TableIndentModel, 
  TableLookModel, 
  TableCellBordersModel, 
  ShadingPropertiesModel, 
  MarginPropertiesModel,
  BorderPropertiesModel 
} from '@/models/table-models.js';
import { convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { getFirstChildElement } from '@/utils/xml-utils.js';
import { BaseParser } from '../base-parser.js';

/**
 * Table properties parser class
 */
export class TablePropertiesParser extends BaseParser<TableProperties> {
  constructor(options: Record<string, unknown> = {}) {
    super('TablePropertiesParser', options);
  }

  /**
   * Parse XML object into TableProperties model
   * @param xmlObj - Parsed XML object containing w:tblPr or w:tblPrEx element
   * @returns Promise resolving to TableProperties model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<TableProperties> {
    // Extract w:tblPr or w:tblPrEx element
    let tblPrElement: Record<string, unknown>;

    // Try standard format first
    if (xmlObj['w:tblPr']) {
      const tblPrValue = xmlObj['w:tblPr'];
      
      // Handle case where w:tblPr is an array
      if (Array.isArray(tblPrValue)) {
        if (tblPrValue.length === 0) {
          throw new Error('Empty w:tblPr array found in XML');
        }
        tblPrElement = tblPrValue[0] as Record<string, unknown>;
      } else {
        tblPrElement = tblPrValue as Record<string, unknown>;
      }
    } 
    // Try extended format
    else if (xmlObj['w:tblPrEx']) {
      const tblPrExValue = xmlObj['w:tblPrEx'];
      
      // Handle case where w:tblPrEx is an array
      if (Array.isArray(tblPrExValue)) {
        if (tblPrExValue.length === 0) {
          throw new Error('Empty w:tblPrEx array found in XML');
        }
        tblPrElement = tblPrExValue[0] as Record<string, unknown>;
      } else {
        tblPrElement = tblPrExValue as Record<string, unknown>;
      }
    } 
    else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:tblPr or w:tblPrEx element
      tblPrElement = xmlObj;
    } else {
      throw new Error('No w:tblPr or w:tblPrEx element found in XML');
    }

    return this.parseTablePropertiesElement(tblPrElement);
  }

  /**
   * Parse table properties element
   * @param tblPrElement - w:tblPr element
   * @returns Parsed TableProperties
   */
  private async parseTablePropertiesElement(tblPrElement: Record<string, unknown>): Promise<TableProperties> {
    const props: Partial<TableProperties> = {};

    // Parse table style (w:tblStyle)
    props.tblStyle = this.parseTableStyle(tblPrElement);
    
    // Parse table width (w:tblW)
    props.tblW = await this.parseTableWidth(tblPrElement);
    
    // Parse justification (w:jc)
    props.justification = this.parseJustification(tblPrElement);
    
    // Parse table indent (w:tblInd)
    props.tblInd = await this.parseTableIndent(tblPrElement);
    
    // Parse table cell margins (w:tblCellMar)
    props.tblCellMar = await this.parseTableCellMargins(tblPrElement);
    
    // Parse table borders (w:tblBorders)
    props.tblBorders = await this.parseTableBorders(tblPrElement);
    
    // Parse shading (w:shd)
    props.shd = await this.parseShading(tblPrElement);
    
    // Parse table layout (w:tblLayout)
    props.tblLayout = this.parseTableLayout(tblPrElement);
    
    // Parse table look (w:tblLook)
    props.tblLook = await this.parseTableLook(tblPrElement);

    // Set convenience properties to match test expectations
    if (props.tblW?.width) {
      props.width = props.tblW.width;
    }
    if (props.justification) {
      props.alignment = props.justification;
    }
    if (props.tblBorders) {
      props.borders = props.tblBorders;
    }
    if (props.tblLook) {
      props.look = props.tblLook;
    }
    if (props.tblStyle) {
      props.style = props.tblStyle;
    }
    if (props.tblInd?.width) {
      props.indent = props.tblInd.width;
    }

    return TablePropertiesModel.create(props);
  }

  /**
   * Parse table style from w:tblStyle element
   * @param tblPrElement - w:tblPr element
   * @returns Table style or undefined
   */
  private parseTableStyle(tblPrElement: Record<string, unknown>): string | undefined {
    const tblStyle = getFirstChildElement(tblPrElement, 'w:tblStyle');
    return tblStyle ? this.getAttribute(tblStyle, 'w:val') : undefined;
  }

  /**
   * Parse table width from w:tblW element
   * @param tblPrElement - w:tblPr element
   * @returns TableWidth or undefined
   */
  private async parseTableWidth(tblPrElement: Record<string, unknown>): Promise<TableWidth | undefined> {
    const tblW = getFirstChildElement(tblPrElement, 'w:tblW');
    if (!tblW) return undefined;

    const type = this.getAttribute(tblW, 'w:type');
    const widthValue = this.getAttribute(tblW, 'w:w');
    
    let width: number | undefined;
    if (widthValue) {
      const parsedWidth = parseInt(widthValue, 10);
      if (!isNaN(parsedWidth)) {
        // Convert from twips to points if type is dxa
        width = type === 'dxa' ? convertTwipsToPoints(parsedWidth) : parsedWidth;
      }
    }

    return TableWidthModel.create({
      type,
      width,
    });
  }

  /**
   * Parse justification from w:jc element
   * @param tblPrElement - w:tblPr element
   * @returns Justification value or undefined
   */
  private parseJustification(tblPrElement: Record<string, unknown>): string | undefined {
    const jc = getFirstChildElement(tblPrElement, 'w:jc');
    return jc ? this.getAttribute(jc, 'w:val') : undefined;
  }

  /**
   * Parse table indent from w:tblInd element
   * @param tblPrElement - w:tblPr element
   * @returns TableIndent or undefined
   */
  private async parseTableIndent(tblPrElement: Record<string, unknown>): Promise<TableIndent | undefined> {
    const tblInd = getFirstChildElement(tblPrElement, 'w:tblInd');
    if (!tblInd) return undefined;

    const type = this.getAttribute(tblInd, 'w:type');
    const widthValue = this.getAttribute(tblInd, 'w:w');
    
    let width: number | undefined;
    if (widthValue) {
      const parsedWidth = parseInt(widthValue, 10);
      if (!isNaN(parsedWidth)) {
        // Convert from twips to points if type is dxa
        width = type === 'dxa' ? convertTwipsToPoints(parsedWidth) : parsedWidth;
      }
    }

    return TableIndentModel.create({
      type,
      width,
    });
  }

  /**
   * Parse table cell margins from w:tblCellMar element
   * @param tblPrElement - w:tblPr element
   * @returns MarginProperties or undefined
   */
  private async parseTableCellMargins(tblPrElement: Record<string, unknown>): Promise<MarginProperties | undefined> {
    const tblCellMar = getFirstChildElement(tblPrElement, 'w:tblCellMar');
    if (!tblCellMar) return undefined;

    const margins: Partial<MarginProperties> = {};

    // Parse each margin direction, including start/end as fallbacks for left/right
    const marginMappings = [
      { prop: 'top', element: 'w:top' },
      { prop: 'bottom', element: 'w:bottom' },
      { prop: 'left', element: 'w:left' },
      { prop: 'right', element: 'w:right' },
    ];

    for (const { prop, element } of marginMappings) {
      let marginElement = getFirstChildElement(tblCellMar, element);
      
      // Fallback for left/right to start/end
      if (!marginElement && prop === 'left') {
        marginElement = getFirstChildElement(tblCellMar, 'w:start');
      } else if (!marginElement && prop === 'right') {
        marginElement = getFirstChildElement(tblCellMar, 'w:end');
      }

      if (marginElement) {
        const widthValue = this.getAttribute(marginElement, 'w:w');
        if (widthValue) {
          const parsedWidth = parseInt(widthValue, 10);
          if (!isNaN(parsedWidth)) {
            margins[prop as keyof MarginProperties] = convertTwipsToPoints(parsedWidth);
          }
        }
      }
    }

    return Object.keys(margins).length > 0 ? MarginPropertiesModel.create(margins) : undefined;
  }

  /**
   * Parse table borders from w:tblBorders element
   * @param tblPrElement - w:tblPr element
   * @returns TableCellBorders or undefined
   */
  private async parseTableBorders(tblPrElement: Record<string, unknown>): Promise<TableCellBorders | undefined> {
    const tblBorders = getFirstChildElement(tblPrElement, 'w:tblBorders');
    if (!tblBorders) return undefined;

    const borders: Partial<TableCellBorders> = {};

    // Parse each border direction
    for (const direction of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
      const borderElement = getFirstChildElement(tblBorders, `w:${direction}`);
      if (borderElement) {
        const color = this.getAttribute(borderElement, 'w:color');
        const sizeValue = this.getAttribute(borderElement, 'w:sz');
        const spaceValue = this.getAttribute(borderElement, 'w:space');
        const val = this.getAttribute(borderElement, 'w:val');

        const size = sizeValue ? parseInt(sizeValue, 10) : undefined;
        const space = spaceValue ? parseInt(spaceValue, 10) : undefined;

        borders[direction as keyof TableCellBorders] = BorderPropertiesModel.create({
          color: color && color !== 'auto' ? `#${color}` : color,
          size: !isNaN(size as number) ? size : undefined,
          space: !isNaN(space as number) ? space : undefined,
          val,
        });
      }
    }

    return Object.keys(borders).length > 0 ? TableCellBordersModel.create(borders) : undefined;
  }

  /**
   * Parse shading from w:shd element
   * @param tblPrElement - w:tblPr element
   * @returns ShadingProperties or undefined
   */
  private async parseShading(tblPrElement: Record<string, unknown>): Promise<ShadingProperties | undefined> {
    const shd = getFirstChildElement(tblPrElement, 'w:shd');
    if (!shd) return undefined;

    const fill = this.getAttribute(shd, 'w:fill');
    const val = this.getAttribute(shd, 'w:val');
    const color = this.getAttribute(shd, 'w:color');

    return ShadingPropertiesModel.create({
      fill: fill && fill !== 'auto' ? `#${fill}` : fill,
      val,
      color: color && color !== 'auto' ? `#${color}` : color,
    });
  }

  /**
   * Parse table layout from w:tblLayout element
   * @param tblPrElement - w:tblPr element
   * @returns Table layout or undefined
   */
  private parseTableLayout(tblPrElement: Record<string, unknown>): string | undefined {
    const tblLayout = getFirstChildElement(tblPrElement, 'w:tblLayout');
    return tblLayout ? this.getAttribute(tblLayout, 'w:type') : undefined;
  }

  /**
   * Parse table look from w:tblLook element
   * @param tblPrElement - w:tblPr element
   * @returns TableLook or undefined
   */
  private async parseTableLook(tblPrElement: Record<string, unknown>): Promise<TableLook | undefined> {
    const tblLook = getFirstChildElement(tblPrElement, 'w:tblLook');
    if (!tblLook) return undefined;

    const val = this.getAttribute(tblLook, 'w:val');
    const firstRow = this.getBooleanAttribute(tblLook, 'w:firstRow');
    const lastRow = this.getBooleanAttribute(tblLook, 'w:lastRow');
    const firstColumn = this.getBooleanAttribute(tblLook, 'w:firstColumn');
    const lastColumn = this.getBooleanAttribute(tblLook, 'w:lastColumn');
    const noHBand = this.getBooleanAttribute(tblLook, 'w:noHBand');
    const noVBand = this.getBooleanAttribute(tblLook, 'w:noVBand');

    return TableLookModel.create({
      val,
      firstRow,
      lastRow,
      firstColumn,
      lastColumn,
      noHBand,
      noVBand,
    });
  }
} 