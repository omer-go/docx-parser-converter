/**
 * Table cell properties parser for DOCX documents
 * Parses table cell properties from w:tcPr elements
 */

import type { 
  TableCellProperties, 
  TableWidth, 
  TableCellBorders, 
  ShadingProperties, 
  MarginProperties 
} from '@/models/table-models.js';
import { 
  TableCellPropertiesModel, 
  TableWidthModel, 
  TableCellBordersModel, 
  ShadingPropertiesModel, 
  MarginPropertiesModel,
  BorderPropertiesModel
} from '@/models/table-models.js';
import { convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { getFirstChildElement } from '@/utils/xml-utils.js';
import { BaseParser } from '../base-parser.js';
import { extractBooleanProperty } from '../helpers/common-helpers.js';

/**
 * Table cell properties parser class
 */
export class TableCellPropertiesParser extends BaseParser<TableCellProperties> {
  constructor(options: Record<string, unknown> = {}) {
    super('TableCellPropertiesParser', options);
  }

  /**
   * Parse XML object into TableCellProperties model
   * @param xmlObj - Parsed XML object containing w:tcPr element
   * @returns Promise resolving to TableCellProperties model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<TableCellProperties> {
    // Extract w:tcPr element
    let tcPrElement: Record<string, unknown>;

    if (xmlObj['w:tcPr']) {
      const tcPrValue = xmlObj['w:tcPr'];
      
      // Handle case where w:tcPr is an array
      if (Array.isArray(tcPrValue)) {
        if (tcPrValue.length === 0) {
          throw new Error('Empty w:tcPr array found in XML');
        }
        tcPrElement = tcPrValue[0] as Record<string, unknown>;
      } else {
        tcPrElement = tcPrValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:tcPr element
      tcPrElement = xmlObj;
    } else {
      throw new Error('No w:tcPr element found in XML');
    }

    return this.parseTableCellPropertiesElement(tcPrElement);
  }

  /**
   * Parse table cell properties element
   * @param tcPrElement - w:tcPr element
   * @returns Parsed TableCellProperties
   */
  private async parseTableCellPropertiesElement(tcPrElement: Record<string, unknown>): Promise<TableCellProperties> {
    const props: Partial<TableCellProperties> = {};

    // Parse table cell width (w:tcW)
    props.tcW = await this.parseTableCellWidth(tcPrElement);
    
    // Parse table cell borders (w:tcBorders)
    props.tcBorders = await this.parseTableCellBorders(tcPrElement);
    
    // Parse shading (w:shd)
    props.shd = await this.parseShading(tcPrElement);
    
    // Parse table cell margins (w:tcMar)
    props.tcMar = await this.parseTableCellMargins(tcPrElement);
    
    // Parse text direction (w:textDirection)
    props.textDirection = this.parseTextDirection(tcPrElement);
    
    // Parse vertical alignment (w:vAlign)
    props.vAlign = this.parseVerticalAlignment(tcPrElement);
    
    // Parse hide mark (w:hideMark)
    props.hideMark = this.parseHideMark(tcPrElement);
    
    // Parse cell merge (w:cellMerge)
    props.cellMerge = this.parseCellMerge(tcPrElement);
    
    // Parse grid span (w:gridSpan)
    props.gridSpan = this.parseGridSpan(tcPrElement);

    // Set convenience properties to match test expectations
    if (props.tcW?.width) {
      props.width = props.tcW.width;
    }
    if (props.tcBorders) {
      props.borders = props.tcBorders;
    }
    if (props.tcMar) {
      props.margins = props.tcMar;
    }
    if (props.shd?.fill) {
      props.shading = props.shd.fill;
    }

    return TableCellPropertiesModel.create(props);
  }

  /**
   * Parse table cell width from w:tcW element
   * @param tcPrElement - w:tcPr element
   * @returns TableWidth or undefined
   */
  private async parseTableCellWidth(tcPrElement: Record<string, unknown>): Promise<TableWidth | undefined> {
    const tcW = getFirstChildElement(tcPrElement, 'w:tcW');
    if (!tcW) return undefined;

    const type = this.getAttribute(tcW, 'w:type');
    const widthValue = this.getAttribute(tcW, 'w:w');
    
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
   * Parse table cell borders from w:tcBorders element
   * @param tcPrElement - w:tcPr element
   * @returns TableCellBorders or undefined
   */
  private async parseTableCellBorders(tcPrElement: Record<string, unknown>): Promise<TableCellBorders | undefined> {
    const tcBorders = getFirstChildElement(tcPrElement, 'w:tcBorders');
    if (!tcBorders) return undefined;

    const borders: Partial<TableCellBorders> = {};

    // Parse each border direction
    for (const direction of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
      const borderElement = getFirstChildElement(tcBorders, `w:${direction}`);
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
   * @param tcPrElement - w:tcPr element
   * @returns ShadingProperties or undefined
   */
  private async parseShading(tcPrElement: Record<string, unknown>): Promise<ShadingProperties | undefined> {
    const shd = getFirstChildElement(tcPrElement, 'w:shd');
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
   * Parse table cell margins from w:tcMar element
   * @param tcPrElement - w:tcPr element
   * @returns MarginProperties or undefined
   */
  private async parseTableCellMargins(tcPrElement: Record<string, unknown>): Promise<MarginProperties | undefined> {
    const tcMar = getFirstChildElement(tcPrElement, 'w:tcMar');
    if (!tcMar) return undefined;

    const margins: Partial<MarginProperties> = {};

    // Parse each margin direction
    for (const direction of ['top', 'left', 'bottom', 'right']) {
      const marginElement = getFirstChildElement(tcMar, `w:${direction}`);
      if (marginElement) {
        const widthValue = this.getAttribute(marginElement, 'w:w');
        if (widthValue) {
          const parsedWidth = parseInt(widthValue, 10);
          if (!isNaN(parsedWidth)) {
            margins[direction as keyof MarginProperties] = convertTwipsToPoints(parsedWidth);
          }
        }
      }
    }

    return Object.keys(margins).length > 0 ? MarginPropertiesModel.create(margins) : undefined;
  }

  /**
   * Parse text direction from w:textDirection element
   * @param tcPrElement - w:tcPr element
   * @returns Text direction or undefined
   */
  private parseTextDirection(tcPrElement: Record<string, unknown>): string | undefined {
    const textDirection = getFirstChildElement(tcPrElement, 'w:textDirection');
    return textDirection ? this.getAttribute(textDirection, 'w:val') : undefined;
  }

  /**
   * Parse vertical alignment from w:vAlign element
   * @param tcPrElement - w:tcPr element
   * @returns Vertical alignment or undefined
   */
  private parseVerticalAlignment(tcPrElement: Record<string, unknown>): string | undefined {
    const vAlign = getFirstChildElement(tcPrElement, 'w:vAlign');
    return vAlign ? this.getAttribute(vAlign, 'w:val') : undefined;
  }

  /**
   * Parse hide mark from w:hideMark element
   * @param tcPrElement - w:tcPr element
   * @returns True if hide mark is present, false otherwise
   */
  private parseHideMark(tcPrElement: Record<string, unknown>): boolean {
    return extractBooleanProperty(tcPrElement, 'w:hideMark');
  }

  /**
   * Parse cell merge from w:cellMerge element
   * @param tcPrElement - w:tcPr element
   * @returns Cell merge value or undefined
   */
  private parseCellMerge(tcPrElement: Record<string, unknown>): string | undefined {
    const cellMerge = getFirstChildElement(tcPrElement, 'w:cellMerge');
    return cellMerge ? this.getAttribute(cellMerge, 'w:val') : undefined;
  }

  /**
   * Parse grid span from w:gridSpan element
   * @param tcPrElement - w:tcPr element
   * @returns Grid span value or undefined
   */
  private parseGridSpan(tcPrElement: Record<string, unknown>): number | undefined {
    const gridSpan = getFirstChildElement(tcPrElement, 'w:gridSpan');
    if (!gridSpan) return undefined;

    const val = this.getAttribute(gridSpan, 'w:val');
    if (val) {
      const parsed = parseInt(val, 10);
      return !isNaN(parsed) ? parsed : undefined;
    }
    return undefined;
  }
} 