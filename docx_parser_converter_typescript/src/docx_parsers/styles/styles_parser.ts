import { XMLParser } from 'fast-xml-parser';
import {
  extractElement,
  extractAttribute,
  // WORDML_NAMESPACE_PREFIX, // Not directly used if prefixes are part of keys
  DEFAULT_ATTRIBUTE_PREFIX,
} from '../helpers/common_helpers';
import {
  StylesModel,
  StyleModel,
  StyleDefaultsModel,
  RunStylePropertiesModel,
  ParagraphStylePropertiesModel,
} from '../models/styles_models';

// Placeholder for RunPropertiesParser
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseRunProperties = (rPrElement: any): RunStylePropertiesModel | undefined => {
  // console.warn("RunPropertiesParser not yet implemented. Returning undefined for rPr:", rPrElement);
  return undefined;
};

// Placeholder for ParagraphPropertiesParser
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseParagraphProperties = (pPrElement: any): ParagraphStylePropertiesModel | undefined => {
  // console.warn("ParagraphPropertiesParser not yet implemented. Returning undefined for pPr:", pPrElement);
  return undefined;
};

/**
 * Helper to ensure an element is an array for easier iteration.
 * @param item The item to ensure is an array.
 * @returns An array, either the item itself if it's an array, a new array containing the item, or an empty array if the item is null/undefined.
 */
const ensureArray = (item: any): any[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  return [item];
};

/**
 * Parses the styles.xml file content from a DOCX document.
 */
export class StylesParser {
  private stylesXmlObject: any;
  private attributePrefix: string;

  /**
   * Initializes the StylesParser with XML content.
   * @param xmlContent The string content of styles.xml.
   */
  constructor(xmlContent: string) {
    this.attributePrefix = DEFAULT_ATTRIBUTE_PREFIX; // Using the default from common_helpers
    const parserOptions = {
      attributeNamePrefix: this.attributePrefix, // Use the chosen prefix
      // attributesGroupName: "$attributes", // Alternative way to group attributes. Using prefix for now.
      ignoreAttributes: false,
      parseTagValue: false,
      parseAttributeValue: false,
      allowBooleanAttributes: true,
      trimValues: true,
      removeNSPrefix: false, // Keep namespace prefixes
      tagValueProcessor: (_tagName: string, tagValue: string, _jPath: string, _hasAttributes: boolean, _isLeafNode: boolean) => {
        // fast-xml-parser v4+ handles XML entity decoding by default for tag values
        return tagValue;
      },
      // Explicitly define which elements should always be arrays
      isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
        if (!isAttribute && !isLeafNode) {
            // Example: if 'w:style' can appear multiple times under 'w:styles'
            if (jpath === "w:styles.w:style") return true;
        }
        return false; // Default: do not treat as array
      }
    };
    const parser = new XMLParser(parserOptions);
    this.stylesXmlObject = parser.parse(xmlContent);
  }

  /**
   * Parses the entire styles.xml content into a StylesModel.
   * @returns The parsed StylesModel.
   */
  public parse(): StylesModel {
    const stylesRoot = this.stylesXmlObject['w:styles'];
    if (!stylesRoot) {
      console.error("Unable to find 'w:styles' root element in XML content.");
      // Return a default or empty StylesModel, or throw an error
      return StylesModel.parse({
        styles: [],
        style_type_defaults: {}, // Empty defaults
      });
    }

    const docDefaultsRPr = this.extractDocDefaultsRPr(stylesRoot);
    const docDefaultsPPr = this.extractDocDefaultsPPr(stylesRoot);
    const styleTypeDefaults = this.extractStyleTypeDefaults(stylesRoot);
    const styles = this.extractAllStyles(stylesRoot);

    return StylesModel.parse({ // Use Zod model's parse method for validation
      doc_defaults_rpr: docDefaultsRPr,
      doc_defaults_ppr: docDefaultsPPr,
      style_type_defaults: styleTypeDefaults,
      styles: styles,
    });
  }

  /**
   * Extracts default run properties (rPr) from w:docDefaults.
   * @param stylesRoot The 'w:styles' XML element object.
   * @returns Parsed RunStylePropertiesModel or undefined.
   */
  private extractDocDefaultsRPr(stylesRoot: any): RunStylePropertiesModel | undefined {
    const rPrDefault = extractElement(stylesRoot, 'w:docDefaults.w:rPrDefault');
    const rPrElement = rPrDefault ? rPrDefault['w:rPr'] : undefined;
    return rPrElement ? parseRunProperties(rPrElement) : undefined;
  }

  /**
   * Extracts default paragraph properties (pPr) from w:docDefaults.
   * @param stylesRoot The 'w:styles' XML element object.
   * @returns Parsed ParagraphStylePropertiesModel or undefined.
   */
  private extractDocDefaultsPPr(stylesRoot: any): ParagraphStylePropertiesModel | undefined {
    const pPrDefault = extractElement(stylesRoot, 'w:docDefaults.w:pPrDefault');
    const pPrElement = pPrDefault ? pPrDefault['w:pPr'] : undefined;
    return pPrElement ? parseParagraphProperties(pPrElement) : undefined;
  }

  /**
   * Extracts style type defaults (e.g., default paragraph style).
   * @param stylesRoot The 'w:styles' XML element object.
   * @returns A StyleDefaultsModel.
   */
  private extractStyleTypeDefaults(stylesRoot: any): StyleDefaultsModel {
    const defaults: Partial<StyleDefaultsModel> = {};
    // The isArray parser option should handle 'w:style' directly under stylesRoot
    const stylesArray = ensureArray(stylesRoot['w:style']);

    for (const styleElement of stylesArray) {
      const isDefault = extractAttribute(styleElement, 'w:default', this.attributePrefix);
      if (isDefault === '1' || isDefault === 'true') {
        const type = extractAttribute(styleElement, 'w:type', this.attributePrefix);
        const styleId = extractAttribute(styleElement, 'w:styleId', this.attributePrefix);

        if (styleId) {
          if (type === 'paragraph') defaults.paragraph = styleId;
          else if (type === 'character') defaults.character = styleId;
          else if (type === 'table') defaults.table = styleId;
          else if (type === 'numbering') defaults.numbering = styleId;
        }
      }
    }
    return StyleDefaultsModel.parse(defaults); // Validate with Zod
  }

  /**
   * Extracts all style definitions.
   * @param stylesRoot The 'w:styles' XML element object.
   * @returns An array of StyleModel.
   */
  private extractAllStyles(stylesRoot: any): StyleModel[] {
    // The isArray parser option should handle 'w:style' directly under stylesRoot
    const stylesArray = ensureArray(stylesRoot['w:style']);
    return stylesArray.map(styleElement => this.extractStyle(styleElement)).filter(Boolean) as StyleModel[];
  }

  /**
   * Extracts a single style definition.
   * @param styleElement The XML element for a style.
   * @returns A StyleModel or undefined if essential data is missing.
   */
  private extractStyle(styleElement: any): StyleModel | undefined {
    const styleId = extractAttribute(styleElement, 'w:styleId', this.attributePrefix);
    if (!styleId) {
        console.warn("Found a style element without a w:styleId. Skipping.", styleElement);
        return undefined; 
    }

    const type = extractAttribute(styleElement, 'w:type', this.attributePrefix);
    
    let name: string | undefined;
    const nameElement = styleElement['w:name'];
    if (nameElement) {
      name = extractAttribute(nameElement, 'w:val', this.attributePrefix);
    }

    const basedOnElement = styleElement['w:basedOn'];
    const basedOnId = basedOnElement ? extractAttribute(basedOnElement, 'w:val', this.attributePrefix) : undefined;

    const linkElement = styleElement['w:link'];
    const linkId = linkElement ? extractAttribute(linkElement, 'w:val', this.attributePrefix) : undefined;
    
    const pPrElement = styleElement['w:pPr'];
    const paragraphProperties = pPrElement ? parseParagraphProperties(pPrElement) : undefined;

    const rPrElement = styleElement['w:rPr'];
    const runProperties = rPrElement ? parseRunProperties(rPrElement) : undefined;

    try {
      const styleData: Partial<StyleModel> = { // Use Partial for constructing StyleModel
        style_id: styleId,
      };
      if (name) styleData.name = name;
      if (type) styleData.type = type;
      if (basedOnId) styleData.based_on = basedOnId;
      if (linkId) styleData.link = linkId;
      if (paragraphProperties) styleData.paragraph_properties = paragraphProperties;
      if (runProperties) styleData.run_properties = runProperties;
      
      return StyleModel.parse(styleData);
    } catch (error) {
      console.error(`Failed to parse style '${styleId}':`, error, styleElement, "Attempted data:", JSON.stringify(styleData));
      return undefined;
    }
  }
}
