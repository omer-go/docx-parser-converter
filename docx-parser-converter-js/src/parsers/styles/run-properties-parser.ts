/**
 * Run properties parser for DOCX documents
 * Parses run-level formatting properties from w:rPr elements
 */

import type { RunStyleProperties } from '@/models/styles-models.js';
import { RunStylePropertiesModel } from '@/models/styles-models.js';
import { convertHalfPointsToPoints, convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { BaseParser } from '../base-parser.js';
import {
  extractBooleanProperty,
  extractColorValue,
} from '../helpers/common-helpers.js';
import { getFirstChildElement } from '@/utils/xml-utils.js';

/**
 * Run properties parser class
 */
export class RunPropertiesParser extends BaseParser<RunStyleProperties> {
  constructor(options: Record<string, unknown> = {}) {
    super('RunPropertiesParser', options);
  }

  /**
   * Parse XML object into RunStyleProperties model
   * @param xmlObj - Parsed XML object containing w:rPr element
   * @returns Promise resolving to RunStyleProperties model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<RunStyleProperties> {
    // Extract w:rPr element
    let rPrElement: Record<string, unknown>;

    if (xmlObj['w:rPr']) {
      // If w:rPr is a property of the root object
      const rPrValue = xmlObj['w:rPr'];
      
      // Handle case where w:rPr is an array (due to XML parser configuration)
      if (Array.isArray(rPrValue)) {
        if (rPrValue.length === 0) {
          throw new Error('Empty w:rPr array found in XML');
        }
        rPrElement = rPrValue[0] as Record<string, unknown>;
      } else {
        rPrElement = rPrValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:rPr element
      rPrElement = xmlObj;
    } else {
      throw new Error('No w:rPr element found in XML');
    }

    return this.parseRunPropertiesElement(rPrElement);
  }

  /**
   * Parse run properties element
   * @param rPrElement - w:rPr element
   * @returns Parsed RunStyleProperties
   */
  private async parseRunPropertiesElement(rPrElement: Record<string, unknown>): Promise<RunStyleProperties> {
    const props: Partial<RunStyleProperties> = {};

    // Parse font properties
    await this.parseFontProperties(rPrElement, props);

    // Parse text formatting
    await this.parseTextFormatting(rPrElement, props);

    // Parse color properties
    await this.parseColorProperties(rPrElement, props);

    // Parse spacing and positioning
    await this.parseSpacingProperties(rPrElement, props);

    // Parse boolean properties
    await this.parseBooleanProperties(rPrElement, props);

    return RunStylePropertiesModel.create(props);
  }

  /**
   * Parse font-related properties
   * @param rPrElement - w:rPr element
   * @param props - Properties object to populate
   */
  private async parseFontProperties(
    rPrElement: Record<string, unknown>,
    props: Partial<RunStyleProperties>
  ): Promise<void> {
    // Font family (w:rFonts)
    const rFonts = getFirstChildElement(rPrElement, 'w:rFonts');
    if (rFonts) {
      props.font = {
        ascii: this.getAttribute(rFonts, 'w:ascii'),
        hAnsi: this.getAttribute(rFonts, 'w:hAnsi'),
        cs: this.getAttribute(rFonts, 'w:cs'),
        eastAsia: this.getAttribute(rFonts, 'w:eastAsia'),
      };
    }

    // Font size (w:sz) - half-points to points
    const sz = getFirstChildElement(rPrElement, 'w:sz');
    if (sz) {
      const sizeValue = this.getAttribute(sz, 'w:val');
      if (sizeValue) {
        const halfPoints = parseInt(sizeValue, 10);
        if (!isNaN(halfPoints)) {
          props.size_pt = convertHalfPointsToPoints(halfPoints);
        }
      }
    }
  }

  /**
   * Parse text formatting properties
   * @param rPrElement - w:rPr element
   * @param props - Properties object to populate
   */
  private async parseTextFormatting(
    rPrElement: Record<string, unknown>,
    props: Partial<RunStyleProperties>
  ): Promise<void> {
    // Bold (w:b)
    props.bold = extractBooleanProperty(rPrElement, 'w:b');

    // Italic (w:i)
    props.italic = extractBooleanProperty(rPrElement, 'w:i');

    // Underline (w:u)
    const u = getFirstChildElement(rPrElement, 'w:u');
    if (u) {
      const underlineType = this.getAttribute(u, 'w:val');
      props.underline = underlineType || 'single';
    } else {
      props.underline = undefined;
    }

    // Strike through (w:strike)
    props.strikethrough = extractBooleanProperty(rPrElement, 'w:strike');

    // Hidden (w:vanish)
    props.hidden = extractBooleanProperty(rPrElement, 'w:vanish');

    // Small caps (w:smallCaps)
    props.small_caps = extractBooleanProperty(rPrElement, 'w:smallCaps');

    // All caps (w:caps)
    props.all_caps = extractBooleanProperty(rPrElement, 'w:caps');
  }

  /**
   * Parse color properties
   * @param rPrElement - w:rPr element
   * @param props - Properties object to populate
   */
  private async parseColorProperties(
    rPrElement: Record<string, unknown>,
    props: Partial<RunStyleProperties>
  ): Promise<void> {
    // Text color (w:color)
    const color = getFirstChildElement(rPrElement, 'w:color');
    if (color) {
      props.color = extractColorValue(color, 'w:val');
    }

    // Highlight color (w:highlight)
    const highlight = getFirstChildElement(rPrElement, 'w:highlight');
    if (highlight) {
      props.highlight = this.getAttribute(highlight, 'w:val');
    }

    // Shading (w:shd)
    const shd = getFirstChildElement(rPrElement, 'w:shd');
    if (shd) {
      props.shading = extractColorValue(shd, 'w:fill');
    }
  }

  /**
   * Parse spacing and positioning properties
   * @param rPrElement - w:rPr element
   * @param props - Properties object to populate
   */
  private async parseSpacingProperties(
    rPrElement: Record<string, unknown>,
    props: Partial<RunStyleProperties>
  ): Promise<void> {
    // Character spacing (w:spacing) - twips to points
    const spacing = getFirstChildElement(rPrElement, 'w:spacing');
    if (spacing) {
      const spacingValue = this.getAttribute(spacing, 'w:val');
      if (spacingValue) {
        const twips = parseInt(spacingValue, 10);
        if (!isNaN(twips)) {
          props.character_spacing_pt = convertTwipsToPoints(twips);
        }
      }
    }

    // Vertical position (w:position) - half-points to points
    const position = getFirstChildElement(rPrElement, 'w:position');
    if (position) {
      const positionValue = this.getAttribute(position, 'w:val');
      if (positionValue) {
        const halfPoints = parseInt(positionValue, 10);
        if (!isNaN(halfPoints)) {
          props.text_position_pt = convertHalfPointsToPoints(halfPoints);
        }
      }
    }

    // Kerning (w:kern)
    const kern = getFirstChildElement(rPrElement, 'w:kern');
    if (kern) {
      const kernValue = this.getAttribute(kern, 'w:val');
      if (kernValue) {
        const halfPoints = parseInt(kernValue, 10);
        if (!isNaN(halfPoints)) {
          props.kerning = convertHalfPointsToPoints(halfPoints);
        }
      }
    }
  }

  /**
   * Parse boolean properties
   * @param rPrElement - w:rPr element
   * @param props - Properties object to populate
   */
  private async parseBooleanProperties(
    rPrElement: Record<string, unknown>,
    props: Partial<RunStyleProperties>
  ): Promise<void> {
    // Emboss (w:emboss)
    props.emboss = extractBooleanProperty(rPrElement, 'w:emboss');

    // Outline (w:outline)
    props.outline = extractBooleanProperty(rPrElement, 'w:outline');

    // Shadow (w:shadow)
    props.shadow = extractBooleanProperty(rPrElement, 'w:shadow');
  }
} 