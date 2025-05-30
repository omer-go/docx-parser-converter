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
  // RunStylePropertiesModel, // No longer needed directly here
  // ParagraphStylePropertiesModel, // No longer needed directly here
} from '../models/styles_models';
import { parseRunProperties } from './run_properties_parser';
import { parseParagraphProperties } from './paragraph_properties_parser';

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
  // private attributePrefix: string; // Replaced by storing parserOptions
  private parserOptions: any; // To store parser options for later use

  /**
   * Initializes the StylesParser with XML content.
   * @param xmlContent The string content of styles.xml.
   */
  constructor(xmlContent: string) {
    // this.attributePrefix = DEFAULT_ATTRIBUTE_PREFIX;
    const options = {
      // attributeNamePrefix: "@_", // Using attributesGroupName instead
      attributesGroupName: "$attributes", // Group attributes under $attributes
      ignoreAttributes: false,
      parseTagValue: false,
      parseAttributeValue: false,
      allowBooleanAttributes: true,
      trimValues: true,
      removeNSPrefix: false,
      tagValueProcessor: (_tagName: string, tagValue: string, _jPath: string, _hasAttributes: boolean, _isLeafNode: boolean) => {
        return tagValue;
      },
      isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
        if (!isAttribute && !isLeafNode) {
            if (jpath === "w:styles.w:style") return true;
        }
        return false;
      }
    };
    this.parserOptions = options; // Store options
    const parser = new XMLParser(this.parserOptions);
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
  private extractDocDefaultsRPr(stylesRoot: any): ReturnType<typeof parseRunProperties> {
    const rPrDefault = extractElement(stylesRoot, 'w:docDefaults.w:rPrDefault');
    const rPrElement = rPrDefault ? rPrDefault['w:rPr'] : undefined;
    return rPrElement ? parseRunProperties(rPrElement, this.parserOptions.attributesGroupName) : undefined;
  }

  /**
   * Extracts default paragraph properties (pPr) from w:docDefaults.
   * @param stylesRoot The 'w:styles' XML element object.
   * @returns Parsed ParagraphStylePropertiesModel or undefined.
   */
  private extractDocDefaultsPPr(stylesRoot: any): ReturnType<typeof parseParagraphProperties> {
    const pPrDefault = extractElement(stylesRoot, 'w:docDefaults.w:pPrDefault');
    const pPrElement = pPrDefault ? pPrDefault['w:pPr'] : undefined;
    return pPrElement ? parseParagraphProperties(pPrElement, this.parserOptions.attributesGroupName) : undefined;
  }

  /**
   * Extracts style type defaults (e.g., default paragraph style).
   * @param stylesRoot The 'w:styles' XML element object.
   * @returns A StyleDefaultsModel.
   */
  private extractStyleTypeDefaults(stylesRoot: any): StyleDefaultsModel {
    const defaults: Partial<StyleDefaultsModel> = {};
    const stylesArray = ensureArray(stylesRoot['w:style']);

    for (const styleElement of stylesArray) {
      const isDefault = extractAttribute(styleElement, 'w:default', this.parserOptions.attributesGroupName);
      if (isDefault === '1' || isDefault === 'true') {
        const type = extractAttribute(styleElement, 'w:type', this.parserOptions.attributesGroupName);
        const styleId = extractAttribute(styleElement, 'w:styleId', this.parserOptions.attributesGroupName);

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
    const stylesArray = ensureArray(stylesRoot['w:style']);
    return stylesArray.map(styleElement => this.extractStyle(styleElement)).filter(Boolean) as StyleModel[];
  }

  /**
   * Extracts a single style definition.
   * @param styleElement The XML element for a style.
   * @returns A StyleModel or undefined if essential data is missing.
   */
  private extractStyle(styleElement: any): StyleModel | undefined {
    const styleId = extractAttribute(styleElement, 'w:styleId', this.parserOptions.attributesGroupName);
    if (!styleId) {
        console.warn("Found a style element without a w:styleId. Skipping.", styleElement);
        return undefined;
    }

    const type = extractAttribute(styleElement, 'w:type', this.parserOptions.attributesGroupName);

    let name: string | undefined;
    const nameElement = styleElement['w:name'];
    if (nameElement) {
      name = extractAttribute(nameElement, 'w:val', this.parserOptions.attributesGroupName);
    }

    const basedOnElement = styleElement['w:basedOn'];
    const basedOnId = basedOnElement ? extractAttribute(basedOnElement, 'w:val', this.parserOptions.attributesGroupName) : undefined;

    const linkElement = styleElement['w:link'];
    const linkId = linkElement ? extractAttribute(linkElement, 'w:val', this.parserOptions.attributesGroupName) : undefined;

    const pPrElement = styleElement['w:pPr'];
    const paragraphProperties = pPrElement ? parseParagraphProperties(pPrElement, this.parserOptions.attributesGroupName) : undefined;

    const rPrElement = styleElement['w:rPr'];
    const runProperties = rPrElement ? parseRunProperties(rPrElement, this.parserOptions.attributesGroupName) : undefined;

    try {
      const styleData: Partial<StyleModel> = {
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
