import type {
  ParagraphStyleProperties,
  SpacingProperties,
  IndentationProperties,
} from '../models/stylesModels';
import {
  extractElement,
  extractAttribute,
  extractBooleanAttribute,
  safeInt,
} from '../helpers/commonHelpers';
import { convertTwipsToPoints, extractXmlRootFromString } from '../utils';

/**
 * Parses the paragraph properties from a DOCX paragraph properties element (w:pPr).
 *
 * This class extracts and parses various properties related to paragraph formatting,
 * converting them into structured TypeScript interfaces for further processing or
 * conversion to other formats.
 */
export class ParagraphPropertiesParser {
  /**
   * Parses the given paragraph properties element into a ParagraphStyleProperties object.
   *
   * @param pPrElement - The paragraph properties XML element (w:pPr).
   * @returns The parsed paragraph style properties.
   *
   * @example
   * The following is an example of a paragraph properties element:
   * ```xml
   * <w:pPr>
   *   <w:spacing w:before="240" w:after="240" w:line="360"/>
   *   <w:ind w:left="720" w:right="720" w:firstLine="720"/>
   *   <w:jc w:val="both"/>
   *   <w:outlineLvl w:val="1"/>
   *   <w:widowControl/>
   *   <w:suppressAutoHyphens/>
   *   <w:bidi/>
   *   <w:keepNext/>
   *   <w:suppressLineNumbers/>
   * </w:pPr>
   * ```
   */
  public parse(pPrElement: Element | null): ParagraphStyleProperties {
    const properties: ParagraphStyleProperties = {};

    if (pPrElement) {
      properties.spacing = this.extractSpacing(pPrElement);
      properties.indent = this.extractIndentation(pPrElement);
      properties.outlineLevel = this.extractOutlineLevel(pPrElement);
      properties.widowControl = this.extractWidowControl(pPrElement);
      properties.suppressAutoHyphens = this.extractSuppressAutoHyphens(pPrElement);
      properties.bidi = this.extractBidi(pPrElement);
      properties.justification = this.extractJustification(pPrElement);
      properties.keepNext = this.extractKeepNext(pPrElement);
      properties.suppressLineNumbers = this.extractSuppressLineNumbers(pPrElement);
    }

    return properties;
  }

  /**
   * Extracts spacing properties from the given paragraph properties element.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The extracted spacing properties, or undefined if not present.
   * ```xml
   * <w:spacing w:before="240" w:after="240" w:line="360"/>
   * ```
   */
  private extractSpacing(pPrElement: Element): SpacingProperties | undefined {
    const spacingElement = extractElement(pPrElement, ".//w:spacing");
    if (spacingElement) {
      const spacingProperties: SpacingProperties = {};
      const before = extractAttribute(spacingElement, 'before');
      const after = extractAttribute(spacingElement, 'after');
      const line = extractAttribute(spacingElement, 'line');

      const beforeVal = safeInt(before);
      if (beforeVal !== null) {
        spacingProperties.beforePt = convertTwipsToPoints(beforeVal);
      }
      const afterVal = safeInt(after);
      if (afterVal !== null) {
        spacingProperties.afterPt = convertTwipsToPoints(afterVal);
      }
      const lineVal = safeInt(line);
      if (lineVal !== null) {
        spacingProperties.linePt = convertTwipsToPoints(lineVal);
      }
      return Object.keys(spacingProperties).length > 0 ? spacingProperties : undefined;
    }
    return undefined;
  }

  /**
   * Extracts indentation properties from the given paragraph properties element.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The extracted indentation properties, or undefined if not present.
   * ```xml
   * <w:ind w:left="720" w:right="720" w:firstLine="720"/>
   * ```
   */
  private extractIndentation(pPrElement: Element): IndentationProperties | undefined {
    const indentElement = extractElement(pPrElement, ".//w:ind");
    if (indentElement) {
      let leftPt = this.convertToPoints(indentElement, ['left', 'start']);
      let rightPt = this.convertToPoints(indentElement, ['right', 'end']);
      let hangingPt = this.convertToPoints(indentElement, ['hanging']);
      let firstLinePt = this.convertToPoints(indentElement, ['firstLine']);

      if (hangingPt !== null && hangingPt !== undefined) {
        firstLinePt = -hangingPt;
      }
      
      const indentationProperties: IndentationProperties = {};
      if (leftPt !== null && leftPt !== undefined) indentationProperties.leftPt = leftPt;
      if (rightPt !== null && rightPt !== undefined) indentationProperties.rightPt = rightPt;
      if (firstLinePt !== null && firstLinePt !== undefined) indentationProperties.firstLinePt = firstLinePt;

      return Object.keys(indentationProperties).length > 0 ? indentationProperties : undefined;
    }
    return undefined;
  }

  /**
   * Converts attribute values found in an element to points.
   * It checks a list of attribute names and uses the first one found.
   *
   * @param element - The XML element containing the attributes.
   * @param attrs - The list of attribute names to check (e.g., ['left', 'start']).
   * @returns The converted value in points, or null if no attribute is found or if conversion fails.
   */
  private convertToPoints(element: Element, attrs: string[]): number | null {
    for (const attr of attrs) {
      const valueStr = extractAttribute(element, attr);
      if (valueStr !== null) {
        const valueInt = safeInt(valueStr);
        if (valueInt !== null) {
          return convertTwipsToPoints(valueInt);
        }
      }
    }
    return null;
  }

  /**
   * Extracts the outline level from the given paragraph properties element.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The extracted outline level, or undefined if not present.
   * ```xml
   * <w:outlineLvl w:val="1"/>
   * ```
   */
  private extractOutlineLevel(pPrElement: Element): number | undefined {
    const outlineLvlElement = extractElement(pPrElement, ".//w:outlineLvl");
    if (outlineLvlElement) {
      const outlineLevelStr = extractAttribute(outlineLvlElement, 'val');
      const outlineLevelInt = safeInt(outlineLevelStr);
      if (outlineLevelInt !== null) {
        return outlineLevelInt;
      }
    }
    return undefined;
  }

  /**
   * Extracts the widow control setting from the given paragraph properties element.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The widow control setting (boolean), or undefined if not specified.
   * ```xml
   * <w:widowControl/>
   * <!-- or -->
   * <w:widowControl w:val="true"/>
   * ```
   */
  private extractWidowControl(pPrElement: Element): boolean | undefined {
    const widowControlElement = extractElement(pPrElement, ".//w:widowControl");
    const val = extractBooleanAttribute(widowControlElement);
    return val === null ? undefined : val; // Convert null to undefined for consistency
  }

  /**
   * Extracts the suppress auto hyphens setting.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The suppress auto hyphens setting, or undefined.
   * ```xml
   * <w:suppressAutoHyphens/>
   * ```
   */
  private extractSuppressAutoHyphens(pPrElement: Element): boolean | undefined {
    const suppressElement = extractElement(pPrElement, ".//w:suppressAutoHyphens");
    const val = extractBooleanAttribute(suppressElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts the bidirectional setting.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The bidirectional setting, or undefined.
   * ```xml
   * <w:bidi/>
   * ```
   */
  private extractBidi(pPrElement: Element): boolean | undefined {
    const bidiElement = extractElement(pPrElement, ".//w:bidi");
    const val = extractBooleanAttribute(bidiElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts and maps the justification value.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The mapped justification value ('left', 'right', 'center', 'justify'), or undefined.
   * ```xml
   * <w:jc w:val="both"/>
   * ```
   */
  private extractJustification(pPrElement: Element): string | undefined {
    const jcElement = extractElement(pPrElement, ".//w:jc");
    if (jcElement) {
      const justificationVal = extractAttribute(jcElement, 'val');
      if (justificationVal !== null) {
        const mapping: { [key: string]: string } = {
          left: 'left',
          start: 'left',
          right: 'right',
          end: 'right',
          center: 'center',
          both: 'justify',
        };
        return mapping[justificationVal] || 'left'; // Default to left if unknown
      }
    }
    return undefined;
  }

  /**
   * Extracts the keep next setting.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The keep next setting, or undefined.
   * ```xml
   * <w:keepNext/>
   * ```
   */
  private extractKeepNext(pPrElement: Element): boolean | undefined {
    const keepNextElement = extractElement(pPrElement, ".//w:keepNext");
    const val = extractBooleanAttribute(keepNextElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts the suppress line numbers setting.
   *
   * @param pPrElement - The paragraph properties element.
   * @returns The suppress line numbers setting, or undefined.
   * ```xml
   * <w:suppressLineNumbers/>
   * ```
   */
  private extractSuppressLineNumbers(pPrElement: Element): boolean | undefined {
    const suppressElement = extractElement(pPrElement, ".//w:suppressLineNumbers");
    const val = extractBooleanAttribute(suppressElement);
    return val === null ? undefined : val;
  }
}

// --- Example Usage Block --- 
// This demonstrates how to use the ParagraphPropertiesParser.
// In a real application, you would get the pPrElement from a parsed DOCX document.
async function runParagraphPropertiesParserExample() {
  console.log("--- Running ParagraphPropertiesParser Example ---");

  const samplePPrXml = `
    <w:pPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:spacing w:before="240" w:after="120" w:line="360"/>
      <w:ind w:left="720" w:right="360" w:firstLine="360"/>
      <w:jc w:val="both"/>
      <w:outlineLvl w:val="1"/>
      <w:widowControl/>
      <w:suppressAutoHyphens w:val="true"/>
      <w:bidi w:val="0"/>
      <w:keepNext/>
      <w:suppressLineNumbers w:val="false"/>
      <w:pStyle w:val="MyCustomStyle"/>
    </w:pPr>
  `;

  try {
    // For the example, we parse the string directly.
    // extractXmlRootFromString is used to get an Element from an XML string.
    // Note: extractXmlRootFromString expects a full document, so we wrap pPr.
    const fullXmlSample = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
            <w:p>
                ${samplePPrXml}
            </w:p>
        </w:body>
    </w:document>`;
    
    const rootElement = extractXmlRootFromString(fullXmlSample);
    const pPrElement = extractElement(rootElement, ".//w:pPr"); // Extract the actual pPr element

    if (pPrElement) {
      const parser = new ParagraphPropertiesParser();
      const properties = parser.parse(pPrElement);

      console.log("Parsed Paragraph Properties:", JSON.stringify(properties, null, 2));

      // Example: Accessing specific properties
      if (properties.spacing?.beforePt) {
        console.log(`Spacing before: ${properties.spacing.beforePt}pt`);
      }
      if (properties.indent?.leftPt) {
        console.log(`Indentation left: ${properties.indent.leftPt}pt`);
      }
      if (properties.justification) {
        console.log(`Justification: ${properties.justification}`);
      }
    } else {
      console.error("Could not find w:pPr element in the sample XML.");
    }

  } catch (error) {
    console.error("Error during ParagraphPropertiesParser example:", error);
  }

  console.log("--- Finished ParagraphPropertiesParser Example ---");
}

// To run the example, you would typically call this function.
// For instance, if this file were the main entry point of a script:
// if (require.main === module) { // CommonJS style check
//   runParagraphPropertiesParserExample().catch(console.error);
// }
// Or in an ES module context, you might export it and run it from another file.
// For now, we can export it to be callable:
export { runParagraphPropertiesParserExample };

// If you want to run it automatically when the file is executed directly (e.g. with ts-node)
// This is a bit more complex in ESM vs CommonJS. A simple way:
if (typeof process !== 'undefined' && process.argv.includes(__filename)) {
    runParagraphPropertiesParserExample().catch(error => {
        console.error("Error running example directly:", error);
        process.exit(1);
    });
} 