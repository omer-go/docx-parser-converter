import type { Paragraph, Run } from '../models/paragraphModels';
import type { TabStop, ParagraphStyleProperties } from '../models/stylesModels';
import { extractElement, extractAttribute, extractElements } from '../helpers/commonHelpers';
import { DocumentNumberingParser } from './documentNumberingParser';
import { RunParser } from './runParser';
import { ParagraphPropertiesParser } from '../styles/paragraphPropertiesParser';
import { convertTwipsToPoints } from '../utils';

/**
 * A parser for extracting paragraph elements from the DOCX document structure.
 *
 * This class handles the extraction of paragraph properties, runs,
 * styles, numbering, and tabs within a paragraph element, converting them
 * into a structured Paragraph object for further processing or conversion
 * to other formats like HTML.
 */
export class ParagraphParser {
  /**
   * Parses a paragraph element from the DOCX document.
   *
   * @param p - The paragraph element to parse.
   * @returns The parsed paragraph object.
   *
   * @example
   * ```xml
   * <w:p>
   *   <w:pPr>
   *     <w:pStyle w:val="Heading1"/>
   *     <w:numPr>
   *       <w:ilvl w:val="0"/>
   *       <w:numId w:val="1"/>
   *     </w:numPr>
   *   </w:pPr>
   *   <w:r>
   *     <w:t>Example text</w:t>
   *   </w:r>
   * </w:p>
   * ```
   */
  public parse(p: Element): Paragraph {
    const pPr = extractElement(p, './/w:pPr');
    const pProperties = this.extractParagraphProperties(pPr);
    const numberingRaw = DocumentNumberingParser.parse(pPr);
    const numbering = numberingRaw === null ? undefined : numberingRaw;
    const runs = this.extractRuns(p);
    return { properties: pProperties, runs, numbering };
  }

  /**
   * Extracts the paragraph properties from the given paragraph properties element.
   * @param pPr - The paragraph properties element.
   * @returns The extracted paragraph style properties.
   */
  private extractParagraphProperties(pPr: Element | null): ParagraphStyleProperties {
    const properties = pPr ? new ParagraphPropertiesParser().parse(pPr) : {};
    if (pPr) {
      const styleId = this.extractStyleId(pPr);
      if (styleId !== null) {
        properties.styleId = styleId;
      }
      const tabs = this.extractTabs(pPr);
      if (tabs) {
        properties.tabs = tabs;
      }
    }
    return properties;
  }

  /**
   * Extracts the style ID from the paragraph properties element.
   * @param pPr - The paragraph properties element.
   * @returns The style ID, or null if not found.
   */
  private extractStyleId(pPr: Element | null): string | null {
    const pStyle = extractElement(pPr, './/w:pStyle');
    if (pStyle !== null) {
      const styleId = extractAttribute(pStyle, 'val');
      if (styleId !== null) {
        return styleId;
      }
    }
    return null;
  }

  /**
   * Extracts the tab stops from the paragraph properties element.
   * @param pPr - The paragraph properties element.
   * @returns The list of tab stops, or undefined if not found.
   */
  private extractTabs(pPr: Element | null): TabStop[] | undefined {
    const tabsElem = extractElement(pPr, './/w:tabs');
    if (tabsElem !== null) {
      return this.parseTabs(tabsElem);
    }
    return undefined;
  }

  /**
   * Extracts the run elements from the paragraph element.
   * @param p - The paragraph element.
   * @returns The list of extracted runs.
   */
  private extractRuns(p: Element): Run[] {
    const runs: Run[] = [];
    const runParser = new RunParser();
    for (const r of extractElements(p, './/w:r')) {
      runs.push(runParser.parse(r));
    }
    return runs;
  }

  /**
   * Parses the tab stops from the tabs element.
   * @param tabsElem - The tabs element.
   * @returns The list of parsed tab stops.
   */
  private parseTabs(tabsElem: Element): TabStop[] {
    const tabs: TabStop[] = [];
    for (const tab of extractElements(tabsElem, './/w:tab')) {
      const val = extractAttribute(tab, 'val') || '';
      const posStr = extractAttribute(tab, 'pos');
      if (posStr !== null) {
        const pos = convertTwipsToPoints(parseInt(posStr, 10));
        tabs.push({ val, pos });
      } else {
        // Optionally log a warning or handle missing pos
        // console.warn("Warning: <w:tab> element missing 'w:pos' attribute.");
      }
    }
    return tabs;
  }
}