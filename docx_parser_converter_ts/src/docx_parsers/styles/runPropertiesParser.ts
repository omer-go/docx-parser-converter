import type {
  RunStyleProperties,
  FontProperties,
  LanguageProperties,
} from '../models/stylesModels';
import {
  extractElement,
  extractAttribute,
  extractBooleanAttribute,
  safeInt,
} from '../helpers/commonHelpers';
import { convertHalfPointsToPoints } from '../utils';

/**
 * A parser for extracting run properties from an XML element.
 *
 * This class extracts and parses various properties related to run formatting,
 * converting them into structured TypeScript interfaces for further processing or
 * conversion to other formats.
 */
export class RunPropertiesParser {
  /**
   * Parses run properties from the given XML element.
   *
   * @param rPrElement - The run properties XML element.
   * @returns The parsed run style properties.
   *
   * @example
   * The following is an example of run properties in a run properties element:
   * ```xml
   * <w:rPr>
   *     <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
   *     <w:sz w:val="24"/>
   *     <w:color w:val="FF0000"/>
   *     <w:b/>
   *     <w:i/>
   *     <w:u w:val="single"/>
   *     <w:strike/>
   *     <w:highlight w:val="yellow"/>
   *     <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
   *     <w:position w:val="2"/>
   *     <w:kern w:val="2"/>
   *     <w:spacing w:val="2"/>
   *     <w:emboss/>
   *     <w:outline/>
   *     <w:shadow/>
   *     <w:caps/>
   *     <w:smallCaps/>
   * </w:rPr>
   * ```
   */
  public parse(rPrElement: Element | null): RunStyleProperties {
    const properties: RunStyleProperties = {};

    if (rPrElement) {
      properties.font = this.extractFonts(rPrElement);
      properties.sizePt = this.extractFontSize(rPrElement);
      properties.color = this.extractFontColor(rPrElement);
      properties.bold = this.extractBold(rPrElement);
      properties.italic = this.extractItalic(rPrElement);
      properties.underline = this.extractUnderline(rPrElement);
      properties.strikethrough = this.extractStrikethrough(rPrElement);
      properties.hidden = this.extractHidden(rPrElement);
      properties.lang = this.extractLanguageSettings(rPrElement);
      properties.highlight = this.extractHighlight(rPrElement);
      properties.shading = this.extractShading(rPrElement);
      properties.textPositionPt = this.extractTextPosition(rPrElement);
      properties.kerning = this.extractKerning(rPrElement);
      properties.characterSpacingPt = this.extractCharacterSpacing(rPrElement);
      properties.emboss = this.extractEmboss(rPrElement);
      properties.outline = this.extractOutline(rPrElement);
      properties.shadow = this.extractShadow(rPrElement);
      properties.allCaps = this.extractAllCaps(rPrElement);
      properties.smallCaps = this.extractSmallCaps(rPrElement);
    }

    return properties;
  }

  /**
   * Extracts font properties from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted font properties, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="SimSun" w:cs="Arial"/>
   * ```
   */
  private extractFonts(rPrElement: Element): FontProperties | undefined {
    const fontElement = extractElement(rPrElement, ".//w:rFonts");
    if (fontElement) {
      const fontProperties: FontProperties = {};
      const ascii = extractAttribute(fontElement, 'ascii');
      const hAnsi = extractAttribute(fontElement, 'hAnsi');
      const eastAsia = extractAttribute(fontElement, 'eastAsia');
      const cs = extractAttribute(fontElement, 'cs');

      if (ascii) fontProperties.ascii = ascii;
      if (hAnsi) fontProperties.hAnsi = hAnsi;
      if (eastAsia) fontProperties.eastAsia = eastAsia;
      if (cs) fontProperties.cs = cs;

      return Object.keys(fontProperties).length > 0 ? fontProperties : undefined;
    }
    return undefined;
  }

  /**
   * Extracts font size from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted font size in points, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:sz w:val="24"/>
   * ```
   */
  private extractFontSize(rPrElement: Element): number | undefined {
    const sizeElement = extractElement(rPrElement, ".//w:sz");
    if (sizeElement) {
      const size = extractAttribute(sizeElement, 'val');
      const sizeInt = safeInt(size);
      if (sizeInt !== null) {
        return convertHalfPointsToPoints(sizeInt);
      }
    }
    return undefined;
  }

  /**
   * Extracts font color from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted font color, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:color w:val="FF0000"/>
   * ```
   */
  private extractFontColor(rPrElement: Element): string | undefined {
    const colorElement = extractElement(rPrElement, ".//w:color");
    if (colorElement) {
      const color = extractAttribute(colorElement, 'val');
      return color ?? undefined;
    }
    return undefined;
  }

  /**
   * Extracts bold property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted bold property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:b/>
   * ```
   */
  private extractBold(rPrElement: Element): boolean | undefined {
    const boldElement = extractElement(rPrElement, ".//w:b");
    const val = extractBooleanAttribute(boldElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts italic property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted italic property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:i/>
   * ```
   */
  private extractItalic(rPrElement: Element): boolean | undefined {
    const italicElement = extractElement(rPrElement, ".//w:i");
    const val = extractBooleanAttribute(italicElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts underline property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted underline property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:u w:val="single"/>
   * ```
   */
  private extractUnderline(rPrElement: Element): string | undefined {
    const underlineElement = extractElement(rPrElement, ".//w:u");
    if (underlineElement) {
      return extractAttribute(underlineElement, 'val') ?? undefined;
    }
    return undefined;
  }

  /**
   * Extracts strikethrough property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted strikethrough property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:strike/>
   * ```
   */
  private extractStrikethrough(rPrElement: Element): boolean | undefined {
    const strikethroughElement = extractElement(rPrElement, ".//w:strike");
    const val = extractBooleanAttribute(strikethroughElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts hidden property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted hidden property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:vanish/>
   * ```
   */
  private extractHidden(rPrElement: Element): boolean | undefined {
    const hiddenElement = extractElement(rPrElement, ".//w:vanish");
    const val = extractBooleanAttribute(hiddenElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts language settings from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted language properties, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:lang w:val="en-US" w:eastAsia="zh-CN" w:bidi="ar-SA"/>
   * ```
   */
  private extractLanguageSettings(rPrElement: Element): LanguageProperties | undefined {
    const langElement = extractElement(rPrElement, ".//w:lang");
    if (langElement) {
      const langProperties: LanguageProperties = {};
      const val = extractAttribute(langElement, 'val');
      const eastAsia = extractAttribute(langElement, 'eastAsia');
      const bidi = extractAttribute(langElement, 'bidi');

      if (val) langProperties.val = val;
      if (eastAsia) langProperties.eastAsia = eastAsia;
      if (bidi) langProperties.bidi = bidi;

      return Object.keys(langProperties).length > 0 ? langProperties : undefined;
    }
    return undefined;
  }

  /**
   * Extracts highlight property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted highlight property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:highlight w:val="yellow"/>
   * ```
   */
  private extractHighlight(rPrElement: Element): string | undefined {
    const highlightElement = extractElement(rPrElement, ".//w:highlight");
    if (highlightElement) {
      return extractAttribute(highlightElement, 'val') ?? undefined;
    }
    return undefined;
  }

  /**
   * Extracts shading property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted shading property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:shd w:val="clear" w:color="auto" w:fill="FFFF00"/>
   * ```
   */
  private extractShading(rPrElement: Element): string | undefined {
    const shadingElement = extractElement(rPrElement, ".//w:shd");
    if (shadingElement) {
      return extractAttribute(shadingElement, 'val') ?? undefined;
    }
    return undefined;
  }

  /**
   * Extracts text position property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted text position in points, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:position w:val="2"/>
   * ```
   */
  private extractTextPosition(rPrElement: Element): number | undefined {
    const textPositionElement = extractElement(rPrElement, ".//w:position");
    if (textPositionElement) {
      const position = extractAttribute(textPositionElement, 'val');
      const positionInt = safeInt(position);
      if (positionInt !== null) {
        return convertHalfPointsToPoints(positionInt);
      }
    }
    return undefined;
  }

  /**
   * Extracts kerning property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted kerning property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:kern w:val="2"/>
   * ```
   */
  private extractKerning(rPrElement: Element): number | undefined {
    const kerningElement = extractElement(rPrElement, ".//w:kern");
    if (kerningElement) {
      const kerning = extractAttribute(kerningElement, 'val');
      const kerningInt = safeInt(kerning);
      return kerningInt ?? undefined;
    }
    return undefined;
  }

  /**
   * Extracts character spacing property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted character spacing in points, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:spacing w:val="2"/>
   * ```
   */
  private extractCharacterSpacing(rPrElement: Element): number | undefined {
    const spacingElement = extractElement(rPrElement, ".//w:spacing");
    if (spacingElement) {
      const spacing = extractAttribute(spacingElement, 'val');
      const spacingInt = safeInt(spacing);
      if (spacingInt !== null) {
        return convertHalfPointsToPoints(spacingInt);
      }
    }
    return undefined;
  }

  /**
   * Extracts emboss property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted emboss property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:emboss/>
   * ```
   */
  private extractEmboss(rPrElement: Element): boolean | undefined {
    const embossElement = extractElement(rPrElement, ".//w:emboss");
    const val = extractBooleanAttribute(embossElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts outline property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted outline property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:outline/>
   * ```
   */
  private extractOutline(rPrElement: Element): boolean | undefined {
    const outlineElement = extractElement(rPrElement, ".//w:outline");
    const val = extractBooleanAttribute(outlineElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts shadow property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted shadow property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:shadow/>
   * ```
   */
  private extractShadow(rPrElement: Element): boolean | undefined {
    const shadowElement = extractElement(rPrElement, ".//w:shadow");
    const val = extractBooleanAttribute(shadowElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts all caps property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted all caps property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:caps/>
   * ```
   */
  private extractAllCaps(rPrElement: Element): boolean | undefined {
    const allCapsElement = extractElement(rPrElement, ".//w:caps");
    const val = extractBooleanAttribute(allCapsElement);
    return val === null ? undefined : val;
  }

  /**
   * Extracts small caps property from the given run properties element.
   *
   * @param rPrElement - The run properties element.
   * @returns The extracted small caps property, or undefined if not present.
   *
   * @example
   * ```xml
   * <w:smallCaps/>
   * ```
   */
  private extractSmallCaps(rPrElement: Element): boolean | undefined {
    const smallCapsElement = extractElement(rPrElement, ".//w:smallCaps");
    const val = extractBooleanAttribute(smallCapsElement);
    return val === null ? undefined : val;
  }
} 