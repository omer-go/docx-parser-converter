import type { TableCellProperties, TableWidth, MarginProperties } from '../models/tableModels';
import { TablePropertiesParser } from './tablePropertiesParser';
import { extractElement, extractAttribute, safeInt } from '../helpers/commonHelpers';
import { convertTwipsToPoints } from '../utils';

/**
 * A parser for extracting table cell properties from an XML element.
 */
export class TableCellPropertiesParser {
  /**
   * Parses table cell properties from the given XML element.
   * @param tcPrElement The cell properties XML element.
   * @returns The parsed table cell properties.
   */
  public static parse(tcPrElement: Element | null): TableCellProperties {
    return {
      tcW: this.extractTableCellWidth(tcPrElement),
      tcBorders: TablePropertiesParser['extractTableCellBorders'](
        extractElement(tcPrElement, './/w:tcBorders')
      ),
      shd: TablePropertiesParser['extractShading'](
        extractElement(tcPrElement, './/w:shd')
      ),
      tcMar: this.extractTableCellMargins(tcPrElement),
      textDirection: this.extractTextDirection(tcPrElement),
      vAlign: this.extractVerticalAlignment(tcPrElement),
      hideMark: this.extractHideMark(tcPrElement),
      cellMerge: this.extractCellMerge(tcPrElement),
      gridSpan: this.extractGridSpan(tcPrElement),
    };
  }

  private static extractTableCellWidth(element: Element | null): TableWidth | undefined {
    const widthElement = extractElement(element, './/w:tcW');
    if (widthElement) {
      const widthValue = safeInt(extractAttribute(widthElement, 'w'));
      return {
        type: extractAttribute(widthElement, 'type') || undefined,
        width: widthValue !== null ? convertTwipsToPoints(widthValue) : undefined,
      };
    }
    return undefined;
  }

  private static extractTextDirection(element: Element | null): string | undefined {
    const directionElement = extractElement(element, './/w:textDirection');
    return extractAttribute(directionElement, 'val') || undefined;
  }

  private static extractVerticalAlignment(element: Element | null): string | undefined {
    const alignmentElement = extractElement(element, './/w:vAlign');
    return extractAttribute(alignmentElement, 'val') || undefined;
  }

  private static extractHideMark(element: Element | null): boolean | undefined {
    const hideMarkElement = extractElement(element, './/w:hideMark');
    return hideMarkElement !== null ? true : undefined;
  }

  private static extractCellMerge(element: Element | null): string | undefined {
    const mergeElement = extractElement(element, './/w:cellMerge');
    return extractAttribute(mergeElement, 'val') || undefined;
  }

  private static extractGridSpan(element: Element | null): number | undefined {
    const gridSpanElement = extractElement(element, './/w:gridSpan');
    const val = extractAttribute(gridSpanElement, 'val');
    const intVal = safeInt(val);
    return intVal !== null ? intVal : undefined;
  }

  private static extractTableCellMargins(element: Element | null): MarginProperties | undefined {
    const marginsElement = extractElement(element, './/w:tcMar');
    if (marginsElement) {
      return {
        top: this.extractMarginValue(marginsElement, 'top'),
        left: this.extractMarginValue(marginsElement, 'left'),
        bottom: this.extractMarginValue(marginsElement, 'bottom'),
        right: this.extractMarginValue(marginsElement, 'right'),
      };
    }
    return undefined;
  }

  private static extractMarginValue(marginsElement: Element, side: string): number | undefined {
    const marginElement = extractElement(marginsElement, `.//w:${side}`);
    if (marginElement) {
      const marginValue = safeInt(extractAttribute(marginElement, 'w'));
      return marginValue !== null ? convertTwipsToPoints(marginValue) : undefined;
    }
    return undefined;
  }
}