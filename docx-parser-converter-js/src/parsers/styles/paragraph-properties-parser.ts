/**
 * Paragraph properties parser for DOCX documents
 * Parses paragraph-level formatting properties from w:pPr elements
 */

import type { ParagraphStyleProperties } from '@/models/styles-models.js';
import { ParagraphStylePropertiesModel } from '@/models/styles-models.js';
import { convertTwipsToPoints } from '@/utils/unit-conversion.js';
import { BaseParser } from '../base-parser.js';
import {
  extractBooleanProperty,
  extractStyleId,
} from '../helpers/common-helpers.js';
import { getFirstChildElement, getChildElements } from '@/utils/xml-utils.js';

/**
 * Paragraph properties parser class
 */
export class ParagraphPropertiesParser extends BaseParser<ParagraphStyleProperties> {
  constructor(options: Record<string, unknown> = {}) {
    super('ParagraphPropertiesParser', options);
  }

  /**
   * Parse XML object into ParagraphStyleProperties model
   * @param xmlObj - Parsed XML object containing w:pPr element
   * @returns Promise resolving to ParagraphStyleProperties model
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<ParagraphStyleProperties> {
    // Extract w:pPr element
    let pPrElement: Record<string, unknown>;

    if (xmlObj['w:pPr']) {
      // If w:pPr is a property of the root object
      const pPrValue = xmlObj['w:pPr'];
      
      // Handle case where w:pPr is an array (due to XML parser configuration)
      if (Array.isArray(pPrValue)) {
        if (pPrValue.length === 0) {
          throw new Error('Empty w:pPr array found in XML');
        }
        pPrElement = pPrValue[0] as Record<string, unknown>;
      } else {
        pPrElement = pPrValue as Record<string, unknown>;
      }
    } else if (xmlObj && typeof xmlObj === 'object' && Object.keys(xmlObj).length > 0) {
      // If the root object itself is the w:pPr element
      pPrElement = xmlObj;
    } else {
      throw new Error('No w:pPr element found in XML');
    }

    return this.parseParagraphPropertiesElement(pPrElement);
  }

  /**
   * Parse paragraph properties element
   * @param pPrElement - w:pPr element
   * @returns Parsed ParagraphStyleProperties
   */
  private async parseParagraphPropertiesElement(pPrElement: Record<string, unknown>): Promise<ParagraphStyleProperties> {
    const props: Partial<ParagraphStyleProperties> = {};

    // Parse style ID reference
    props.style_id = extractStyleId(pPrElement, 'w:pStyle');

    // Parse spacing properties
    await this.parseSpacingProperties(pPrElement, props);

    // Parse indentation properties
    await this.parseIndentationProperties(pPrElement, props);

    // Parse alignment and justification
    await this.parseAlignmentProperties(pPrElement, props);

    // Parse boolean properties
    await this.parseBooleanProperties(pPrElement, props);

    // Parse outline level
    await this.parseOutlineLevel(pPrElement, props);

    // Parse tab stops
    await this.parseTabStops(pPrElement, props);

    return ParagraphStylePropertiesModel.create(props);
  }

  /**
   * Parse spacing properties
   * @param pPrElement - w:pPr element
   * @param props - Properties object to populate
   */
  private async parseSpacingProperties(
    pPrElement: Record<string, unknown>,
    props: Partial<ParagraphStyleProperties>
  ): Promise<void> {
    const spacing = getFirstChildElement(pPrElement, 'w:spacing');
    if (!spacing) return;

    props.spacing = {};

    // Before spacing (twips to points)
    const before = this.getAttribute(spacing, 'w:before');
    if (before) {
      const twips = parseInt(before, 10);
      if (!isNaN(twips)) {
        props.spacing.before_pt = convertTwipsToPoints(twips);
      }
    }

    // After spacing (twips to points)
    const after = this.getAttribute(spacing, 'w:after');
    if (after) {
      const twips = parseInt(after, 10);
      if (!isNaN(twips)) {
        props.spacing.after_pt = convertTwipsToPoints(twips);
      }
    }

    // Line spacing
    const line = this.getAttribute(spacing, 'w:line');
    const lineRule = this.getAttribute(spacing, 'w:lineRule') || 'auto';
    
    if (line) {
      const lineValue = parseInt(line, 10);
      if (!isNaN(lineValue)) {
        if (lineRule === 'auto') {
          // Line spacing is in 240ths of a line
          props.spacing.line_pt = lineValue / 240;
        } else {
          // Line spacing is in twips
          props.spacing.line_pt = convertTwipsToPoints(lineValue);
        }
      }
    }
  }

  /**
   * Parse indentation properties
   * @param pPrElement - w:pPr element
   * @param props - Properties object to populate
   */
  private async parseIndentationProperties(
    pPrElement: Record<string, unknown>,
    props: Partial<ParagraphStyleProperties>
  ): Promise<void> {
    const ind = getFirstChildElement(pPrElement, 'w:ind');
    if (!ind) return;

    props.indent = {};

    // Left indentation (twips to points)
    const left = this.getAttribute(ind, 'w:left');
    if (left) {
      const twips = parseInt(left, 10);
      if (!isNaN(twips)) {
        props.indent.left_pt = convertTwipsToPoints(twips);
      }
    }

    // Right indentation (twips to points)
    const right = this.getAttribute(ind, 'w:right');
    if (right) {
      const twips = parseInt(right, 10);
      if (!isNaN(twips)) {
        props.indent.right_pt = convertTwipsToPoints(twips);
      }
    }

    // First line indentation (twips to points)
    const firstLine = this.getAttribute(ind, 'w:firstLine');
    if (firstLine) {
      const twips = parseInt(firstLine, 10);
      if (!isNaN(twips)) {
        props.indent.firstline_pt = convertTwipsToPoints(twips);
      }
    }
  }

  /**
   * Parse alignment and justification properties
   * @param pPrElement - w:pPr element
   * @param props - Properties object to populate
   */
  private async parseAlignmentProperties(
    pPrElement: Record<string, unknown>,
    props: Partial<ParagraphStyleProperties>
  ): Promise<void> {
    // Justification (w:jc)
    const jc = getFirstChildElement(pPrElement, 'w:jc');
    if (jc) {
      props.justification = this.getAttribute(jc, 'w:val') || undefined;
    }
  }

  /**
   * Parse boolean properties
   * @param pPrElement - w:pPr element
   * @param props - Properties object to populate
   */
  private async parseBooleanProperties(
    pPrElement: Record<string, unknown>,
    props: Partial<ParagraphStyleProperties>
  ): Promise<void> {
    // Keep with next
    props.keep_next = extractBooleanProperty(pPrElement, 'w:keepNext');

    // Widow control
    props.widow_control = extractBooleanProperty(pPrElement, 'w:widowControl');

    // Suppress line numbers
    props.suppress_line_numbers = extractBooleanProperty(pPrElement, 'w:suppressLineNumbers');

    // Suppress auto hyphens
    props.suppress_auto_hyphens = extractBooleanProperty(pPrElement, 'w:suppressAutoHyphens');

    // Bidirectional text
    props.bidi = extractBooleanProperty(pPrElement, 'w:bidi');
  }

  /**
   * Parse outline level
   * @param pPrElement - w:pPr element
   * @param props - Properties object to populate
   */
  private async parseOutlineLevel(
    pPrElement: Record<string, unknown>,
    props: Partial<ParagraphStyleProperties>
  ): Promise<void> {
    const outlineLvl = getFirstChildElement(pPrElement, 'w:outlineLvl');
    if (outlineLvl) {
      const level = this.getAttribute(outlineLvl, 'w:val');
      if (level) {
        const levelValue = parseInt(level, 10);
        if (!isNaN(levelValue)) {
          props.outline_level = levelValue;
        }
      }
    }
  }

  /**
   * Parse tab stops
   * @param pPrElement - w:pPr element
   * @param props - Properties object to populate
   */
  private async parseTabStops(
    pPrElement: Record<string, unknown>,
    props: Partial<ParagraphStyleProperties>
  ): Promise<void> {
    const tabs = getFirstChildElement(pPrElement, 'w:tabs');
    if (!tabs) return;

    const tabElements = getChildElements(tabs, 'w:tab');
    if (tabElements.length === 0) return;

    props.tabs = [];

    for (const tab of tabElements) {
      const position = this.getAttribute(tab, 'w:pos');
      const alignment = this.getAttribute(tab, 'w:val') || 'left';

      if (position) {
        const posValue = parseInt(position, 10);
        if (!isNaN(posValue)) {
          props.tabs.push({
            val: alignment,
            pos: convertTwipsToPoints(posValue),
          });
        }
      }
    }
  }
} 