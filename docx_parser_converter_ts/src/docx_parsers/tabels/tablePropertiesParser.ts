import type { TableProperties, TableWidth, TableIndent, TableLook, TableCellBorders, ShadingProperties, MarginProperties, BorderProperties } from '../models/tableModels';
import { extractElement, extractAttribute, safeInt } from '../helpers/commonHelpers';
import { convertTwipsToPoints } from '../utils';

/**
 * A parser for extracting table properties from an XML element.
 */
export class TablePropertiesParser {
  /**
   * Parses table properties from the given XML element.
   * @param tblPrElement The table properties XML element.
   * @returns The parsed table properties.
   */
  public static parse(tblPrElement: Element | null): TableProperties {
    return {
      tblStyle: this.extractTableStyle(tblPrElement),
      tblW: this.extractTableWidth(tblPrElement),
      justification: this.extractJustification(tblPrElement),
      tblInd: this.extractTableIndent(tblPrElement),
      tblCellMar: this.extractTableCellMargins(tblPrElement),
      tblBorders: this.extractTableCellBorders(extractElement(tblPrElement, './/w:tblBorders')),
      shd: this.extractShading(extractElement(tblPrElement, './/w:shd')),
      tblLayout: this.extractTableLayout(tblPrElement),
      tblLook: this.extractTableLook(tblPrElement),
    };
  }

  private static extractTableIndent(element: Element | null): TableIndent | undefined {
    const indentElement = extractElement(element, './/w:tblInd');
    if (indentElement) {
      const indentValue = safeInt(extractAttribute(indentElement, 'w'));
      return {
        type: extractAttribute(indentElement, 'type') || undefined,
        width: indentValue !== null ? convertTwipsToPoints(indentValue) : undefined,
      };
    }
    return undefined;
  }

  private static extractTableWidth(element: Element | null): TableWidth | undefined {
    const widthElement = extractElement(element, './/w:tblW');
    if (widthElement) {
      const widthValue = safeInt(extractAttribute(widthElement, 'w'));
      return {
        type: extractAttribute(widthElement, 'type') || undefined,
        width: widthValue !== null ? convertTwipsToPoints(widthValue) : undefined,
      };
    }
    return undefined;
  }

  private static extractJustification(element: Element | null): string | undefined {
    const jcElement = extractElement(element, './/w:jc');
    return extractAttribute(jcElement, 'val') || undefined;
  }

  private static extractTableStyle(element: Element | null): string | undefined {
    const styleElement = extractElement(element, './/w:tblStyle');
    return extractAttribute(styleElement, 'val') || undefined;
  }

  private static extractTableCellMargins(element: Element | null): MarginProperties | undefined {
    const marginElement = extractElement(element, './/w:tblCellMar');
    if (marginElement) {
      return {
        top: this.extractMarginValue(marginElement, 'top'),
        left: this.extractMarginValue(marginElement, 'left') || this.extractMarginValue(marginElement, 'start'),
        bottom: this.extractMarginValue(marginElement, 'bottom'),
        right: this.extractMarginValue(marginElement, 'right') || this.extractMarginValue(marginElement, 'end'),
      };
    }
    return undefined;
  }

  private static extractMarginValue(marginElement: Element, side: string): number | undefined {
    const sideElement = extractElement(marginElement, `.//w:${side}`);
    if (sideElement) {
      const marginValue = safeInt(extractAttribute(sideElement, 'w'));
      return marginValue !== null ? convertTwipsToPoints(marginValue) : undefined;
    }
    return undefined;
  }

  private static extractTableLayout(element: Element | null): string | undefined {
    const layoutElement = extractElement(element, './/w:tblLayout');
    return extractAttribute(layoutElement, 'type') || undefined;
  }

  private static extractTableLook(element: Element | null): TableLook | undefined {
    const lookElement = extractElement(element, './/w:tblLook');
    if (lookElement) {
      return {
        firstRow: extractAttribute(lookElement, 'firstRow') === '1',
        lastRow: extractAttribute(lookElement, 'lastRow') === '1',
        firstColumn: extractAttribute(lookElement, 'firstColumn') === '1',
        lastColumn: extractAttribute(lookElement, 'lastColumn') === '1',
        noHBand: extractAttribute(lookElement, 'noHBand') === '1',
        noVBand: extractAttribute(lookElement, 'noVBand') === '1',
      };
    }
    return undefined;
  }

  private static extractTableCellBorders(bordersElement: Element | null): TableCellBorders | undefined {
    if (bordersElement) {
      return {
        top: this.extractBorder(extractElement(bordersElement, './/w:top')),
        left: this.extractBorder(extractElement(bordersElement, './/w:left')) || this.extractBorder(extractElement(bordersElement, './/w:start')),
        bottom: this.extractBorder(extractElement(bordersElement, './/w:bottom')),
        right: this.extractBorder(extractElement(bordersElement, './/w:right')) || this.extractBorder(extractElement(bordersElement, './/w:end')),
        insideH: this.extractBorder(extractElement(bordersElement, './/w:insideH')),
        insideV: this.extractBorder(extractElement(bordersElement, './/w:insideV')),
      };
    }
    return undefined;
  }

  private static extractBorder(borderElement: Element | null): BorderProperties | undefined {
    if (borderElement) {
      const sizeValue = safeInt(extractAttribute(borderElement, 'sz'));
      const spaceValue = safeInt(extractAttribute(borderElement, 'space'));
      return {
        color: extractAttribute(borderElement, 'color') || undefined,
        size: sizeValue !== null ? sizeValue : undefined,
        space: spaceValue !== null ? spaceValue : undefined,
        val: extractAttribute(borderElement, 'val') || undefined,
      };
    }
    return undefined;
  }

  private static extractShading(shdElement: Element | null): ShadingProperties | undefined {
    if (shdElement) {
      return {
        fill: extractAttribute(shdElement, 'fill') || undefined,
        val: extractAttribute(shdElement, 'val') || undefined,
        color: extractAttribute(shdElement, 'color') || undefined,
      };
    }
    return undefined;
  }
}

// --- Example Usage Block (similar to if __name__ == "__main__") ---
if (typeof require !== 'undefined' && require.main === module) {
  // Example: parse a sample tblPr XML string
  const { extractXmlRootFromString } = require('../utils');
  const sampleTblPrXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:tblPr xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">\n    <w:tblStyle w:val=\"TableGrid\"/>\n    <w:tblW w:w=\"5000\" w:type=\"dxa\"/>\n    <w:tblInd w:w=\"200\" w:type=\"dxa\"/>\n    <w:tblBorders>\n        <w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n        <w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n        <w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n        <w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n        <w:insideH w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n        <w:insideV w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>\n    </w:tblBorders>\n    <w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"FFFF00\"/>\n    <w:tblCellMar>\n        <w:top w:w=\"100\" w:type=\"dxa\"/>\n        <w:left w:w=\"100\" w:type=\"dxa\"/>\n        <w:bottom w:w=\"100\" w:type=\"dxa\"/>\n        <w:right w:w=\"100\" w:type=\"dxa\"/>\n    </w:tblCellMar>\n    <w:tblLook w:firstRow=\"1\" w:lastRow=\"0\" w:firstColumn=\"1\" w:lastColumn=\"0\" w:noHBand=\"0\" w:noVBand=\"0\"/>\n</w:tblPr>`;
  const tblPrElement = extractXmlRootFromString(sampleTblPrXml);
  const parsed = TablePropertiesParser.parse(tblPrElement);
  console.log('Parsed TableProperties:', JSON.stringify(parsed, null, 2));
} 