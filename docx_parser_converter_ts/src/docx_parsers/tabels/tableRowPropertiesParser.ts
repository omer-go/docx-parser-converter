import type { TableRowProperties } from '../models/tableModels';
import { extractElement, extractAttribute, safeInt } from '../helpers/commonHelpers';
import { TablePropertiesParser } from './tablePropertiesParser';
import { convertTwipsToPoints } from '../utils';

/**
 * A parser for extracting table row properties from an XML element.
 */
export class TableRowPropertiesParser {
  /**
   * Parses table row properties from the given XML element.
   * @param trPrElement The row properties XML element.
   * @returns The parsed table row properties.
   *
   * @example
   * ```xml
   * <w:trPr>
   *   <w:trHeight w:val="300"/>
   *   <w:tblHeader/>
   *   <w:jc w:val="center"/>
   *   <w:tblBorders>
   *     <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
   *     <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
   *     <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
   *     <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
   *     <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
   *     <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
   *   </w:tblBorders>
   *   <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
   * </w:trPr>
   * ```
   */
  public static parse(trPrElement: Element | null): TableRowProperties {
    return {
      trHeight: this.extractRowHeight(trPrElement),
      trHeightHRule: this.extractRowHeightHRule(trPrElement),
      tblHeader: this.extractTableHeader(trPrElement),
      justification: this.extractJustification(trPrElement),
      tblBorders: TablePropertiesParser['extractTableCellBorders'](
        extractElement(trPrElement, './/w:tblBorders')
      ),
      shd: TablePropertiesParser['extractShading'](
        extractElement(trPrElement, './/w:shd')
      ),
    };
  }

  private static extractRowHeight(element: Element | null): string | undefined {
    const heightElement = extractElement(element, './/w:trHeight');
    if (heightElement) {
      const heightValue = safeInt(extractAttribute(heightElement, 'val'));
      return heightValue !== null ? String(convertTwipsToPoints(heightValue)) : undefined;
    }
    return undefined;
  }

  private static extractRowHeightHRule(element: Element | null): string | undefined {
    const heightElement = extractElement(element, './/w:trHeight');
    if (heightElement) {
      return extractAttribute(heightElement, 'hRule') || undefined;
    }
    return undefined;
  }

  private static extractTableHeader(element: Element | null): boolean | undefined {
    const headerElement = extractElement(element, './/w:tblHeader');
    return headerElement ? true : undefined;
  }

  private static extractJustification(element: Element | null): string | undefined {
    const jcElement = extractElement(element, './/w:jc');
    return extractAttribute(jcElement, 'val') || undefined;
  }
}