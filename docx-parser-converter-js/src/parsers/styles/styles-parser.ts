/**
 * Styles parser for DOCX documents
 * Extracts and processes style definitions from styles.xml
 */

import {
  type StylesSchema,
  StylesSchemaModel,
  type Style,
  StyleModel,
  type StyleDefaults,
  StyleDefaultsModel,
  type ParagraphStyleProperties,
  type RunStyleProperties,
} from '@/models/styles-models.js';
import { BaseParser } from '../base-parser.js';
import { ParagraphPropertiesParser } from './paragraph-properties-parser.js';
import { RunPropertiesParser } from './run-properties-parser.js';

/**
 * Styles parser for DOCX styles.xml
 */
export class StylesParser extends BaseParser<StylesSchema> {
  private paragraphPropertiesParser: ParagraphPropertiesParser;
  private runPropertiesParser: RunPropertiesParser;

  constructor(options: Record<string, unknown> = {}) {
    super('StylesParser', options);
    this.paragraphPropertiesParser = new ParagraphPropertiesParser();
    this.runPropertiesParser = new RunPropertiesParser();
  }

  /**
   * Parse styles.xml content
   * @param xmlObj - Parsed XML object from styles.xml
   * @returns Promise resolving to StylesSchema
   */
  protected async parseInternal(xmlObj: Record<string, unknown>): Promise<StylesSchema> {
    const stylesElement = this.extractStylesElement(xmlObj);
    
    // Parse document defaults
    const { docDefaultsRpr, docDefaultsPpr, styleTypeDefaults } = await this.parseDocDefaults(stylesElement);
    
    // Parse individual styles
    const styles = await this.parseStyles(stylesElement);
    
    return StylesSchemaModel.create({
      styles,
      style_type_defaults: styleTypeDefaults,
      doc_defaults_rpr: docDefaultsRpr,
      doc_defaults_ppr: docDefaultsPpr,
    });
  }

  /**
   * Extract styles element from XML
   * @param xmlObj - Parsed XML object
   * @returns Styles element
   */
  private extractStylesElement(xmlObj: Record<string, unknown>): Record<string, unknown> {
    if (xmlObj['w:styles']) {
      const stylesEl = xmlObj['w:styles'];
      return Array.isArray(stylesEl) ? stylesEl[0] : (stylesEl as Record<string, unknown>);
    }
    
    // If no w:styles wrapper, assume the root is the styles element
    return xmlObj;
  }

  /**
   * Parse document defaults
   * @param stylesElement - w:styles element
   * @returns Document defaults and style type defaults
   */
  private async parseDocDefaults(
    stylesElement: Record<string, unknown>
  ): Promise<{
    docDefaultsRpr?: RunStyleProperties;
    docDefaultsPpr?: ParagraphStyleProperties;
    styleTypeDefaults: StyleDefaults;
  }> {
    const docDefaults = this.getFirstChild(stylesElement, 'w:docDefaults');
    
    let docDefaultsRpr: RunStyleProperties | undefined;
    let docDefaultsPpr: ParagraphStyleProperties | undefined;

    if (docDefaults) {
      // Parse paragraph defaults
      const pPrDefault = this.getFirstChild(docDefaults, 'w:pPrDefault');
      if (pPrDefault) {
        const pPr = this.getFirstChild(pPrDefault, 'w:pPr');
        if (pPr) {
          try {
            const xmlString = this.elementToXmlString(pPr, 'w:pPr');
            const result = await this.paragraphPropertiesParser.parse(xmlString);
            docDefaultsPpr = result.data;
          } catch (error) {
            this.addWarning(
              `Failed to parse paragraph defaults: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        }
      }

      // Parse run defaults
      const rPrDefault = this.getFirstChild(docDefaults, 'w:rPrDefault');
      if (rPrDefault) {
        const rPr = this.getFirstChild(rPrDefault, 'w:rPr');
        if (rPr) {
          try {
            const xmlString = this.elementToXmlString(rPr, 'w:rPr');
            const result = await this.runPropertiesParser.parse(xmlString);
            docDefaultsRpr = result.data;
          } catch (error) {
            this.addWarning(
              `Failed to parse run defaults: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        }
      }
    }

    // Parse default styles by type
    const styleTypeDefaults = await this.parseStyleTypeDefaults(stylesElement);

    return {
      ...(docDefaultsRpr && { docDefaultsRpr }),
      ...(docDefaultsPpr && { docDefaultsPpr }),
      styleTypeDefaults,
    };
  }

  /**
   * Parse style type defaults
   * @param stylesElement - w:styles element
   * @returns StyleDefaults
   */
  private async parseStyleTypeDefaults(stylesElement: Record<string, unknown>): Promise<StyleDefaults> {
    const styleElements = this.getChildElements(stylesElement, 'w:style');
    const defaults: Partial<StyleDefaults> = {};

    for (const styleElement of styleElements) {
      const isDefault = this.getBooleanAttribute(styleElement, 'w:default', false);
      if (isDefault) {
        const type = this.getAttribute(styleElement, 'w:type') || 'paragraph';
        const styleId = this.getAttribute(styleElement, 'w:styleId') || '';
        
        switch (type) {
          case 'paragraph':
            defaults.paragraph = styleId;
            break;
          case 'character':
            defaults.character = styleId;
            break;
          case 'numbering':
            defaults.numbering = styleId;
            break;
          case 'table':
            defaults.table = styleId;
            break;
        }
      }
    }

    return StyleDefaultsModel.create(defaults);
  }

  /**
   * Parse individual styles
   * @param stylesElement - w:styles element
   * @returns Array of parsed styles
   */
  private async parseStyles(stylesElement: Record<string, unknown>): Promise<Style[]> {
    const styles: Style[] = [];
    const styleElements = this.getChildElements(stylesElement, 'w:style');

    for (const [index, styleElement] of styleElements.entries()) {
      try {
        const style = await this.parseStyle(styleElement);
        styles.push(style);
      } catch (error) {
        this.addWarning(
          `Failed to parse style ${index}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return styles;
  }

  /**
   * Parse a single style
   * @param styleElement - w:style element
   * @returns Parsed Style
   */
  private async parseStyle(styleElement: Record<string, unknown>): Promise<Style> {
    // Extract style attributes
    const styleId = this.getAttribute(styleElement, 'w:styleId') || '';

    // Parse style name
    const nameElement = this.getFirstChild(styleElement, 'w:name');
    const name = nameElement ? this.getAttribute(nameElement, 'w:val') || styleId : styleId;

    // Parse base style
    const basedOnElement = this.getFirstChild(styleElement, 'w:basedOn');
    const basedOn = basedOnElement ? this.getAttribute(basedOnElement, 'w:val') : undefined;

    // Parse style properties
    let paragraphProperties: ParagraphStyleProperties | undefined;
    let runProperties: RunStyleProperties | undefined;

    // Parse paragraph properties
    const pPr = this.getFirstChild(styleElement, 'w:pPr');
    if (pPr) {
      try {
        const xmlString = this.elementToXmlString(pPr, 'w:pPr');
        const result = await this.paragraphPropertiesParser.parse(xmlString);
        paragraphProperties = result.data;
      } catch (error) {
        this.addWarning(
          `Failed to parse paragraph properties for style ${styleId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    // Parse run properties
    const rPr = this.getFirstChild(styleElement, 'w:rPr');
    if (rPr) {
      try {
        const xmlString = this.elementToXmlString(rPr, 'w:rPr');
        const result = await this.runPropertiesParser.parse(xmlString);
        runProperties = result.data;
      } catch (error) {
        this.addWarning(
          `Failed to parse run properties for style ${styleId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return StyleModel.create({
      style_id: styleId,
      name,
      based_on: basedOn,
      paragraph_properties: paragraphProperties,
      run_properties: runProperties,
    });
  }

  /**
   * Convert XML element to XML string for property parsers
   * @param element - XML element
   * @param rootTag - Root tag name
   * @returns XML string
   */
  private elementToXmlString(element: Record<string, unknown>, rootTag: string): string {
    // This is a simplified implementation
    // In a real implementation, you'd need proper XML serialization
    // For now, we'll construct a minimal XML string
    try {
      // Attempt to serialize element properties as XML
      const content = this.serializeElementContent(element);
      return `<${rootTag}>${content}</${rootTag}>`;
    } catch (error) {
      this.addWarning(`Failed to serialize element to XML: ${error}`);
      return `<${rootTag}></${rootTag}>`;
    }
  }

  /**
   * Serialize element content to XML (simplified)
   * @param element - XML element
   * @returns Serialized content
   */
  private serializeElementContent(element: Record<string, unknown>): string {
    // This is a basic serialization - in production you'd want proper XML serialization
    let content = '';
    
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith('w:') && typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          for (const item of value) {
            content += `<${key}>${this.serializeElementContent(item as Record<string, unknown>)}</${key}>`;
          }
        } else {
          const attrs = this.serializeAttributes(value as Record<string, unknown>);
          content += `<${key}${attrs}/>`;
        }
      }
    }
    
    return content;
  }

  /**
   * Serialize element attributes (simplified)
   * @param element - XML element
   * @returns Attribute string
   */
  private serializeAttributes(element: Record<string, unknown>): string {
    let attrs = '';
    
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith('@_') && typeof value === 'string') {
        const attrName = key.substring(2); // Remove @_ prefix
        attrs += ` ${attrName}="${value}"`;
      }
    }
    
    return attrs;
  }

  /**
   * Get all styles by type from parsed styles
   * @param styles - Array of parsed styles
   * @param _type - Style type to filter by (not used in current model)
   * @returns Array of all styles (type filtering not implemented in current model)
   */
  public static getStylesByType(styles: Style[], _type: string): Style[] {
    // Note: Current Style model doesn't have a type field
    // This method returns all styles for now
    return styles;
  }

  /**
   * Get style by ID
   * @param styles - Array of parsed styles
   * @param styleId - Style ID to find
   * @returns Style or undefined if not found
   */
  public static getStyleById(styles: Style[], styleId: string): Style | undefined {
    return styles.find(style => style.style_id === styleId);
  }

  /**
   * Get style inheritance chain
   * @param styles - Array of parsed styles
   * @param styleId - Starting style ID
   * @returns Array of styles in inheritance chain (from base to derived)
   */
  public static getStyleInheritanceChain(styles: Style[], styleId: string): Style[] {
    const chain: Style[] = [];
    let currentStyleId: string | undefined = styleId;
    const visited = new Set<string>();

    while (currentStyleId && !visited.has(currentStyleId)) {
      visited.add(currentStyleId);
      
      const style = this.getStyleById(styles, currentStyleId);
      if (!style) break;
      
      chain.unshift(style); // Add to beginning to maintain base-to-derived order
      currentStyleId = style.based_on || undefined;
    }

    return chain;
  }
} 