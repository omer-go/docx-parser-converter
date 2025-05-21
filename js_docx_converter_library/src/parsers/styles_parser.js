import { extractXmlRootFromDocx, getElement, getAttribute, getChildAttribute } from './xml_utils.js';
import {
  StylesSchema,
  StyleSchema,
  DocDefaultsSchema,
  StyleTypeDefaultsSchema,
  defaultRunProperties,
  defaultParagraphProperties
} from './models/styles_models.js';
import { RunPropertiesParser } from './run_properties_parser.js';
import { ParagraphPropertiesParser } from './paragraph_properties_parser.js';

/**
 * Parses the styles.xml file from a DOCX document.
 */
export class StylesParser {
  /**
   * @param {ArrayBuffer} docxBuffer - The DOCX file buffer.
   */
  constructor(docxBuffer) {
    this.docxBuffer = docxBuffer;
    this.stylesXmlRoot = null; // To be populated by _loadStylesXml
    this.runPropertiesParser = new RunPropertiesParser();
    this.paragraphPropertiesParser = new ParagraphPropertiesParser();
    this._parsedStyles = null; // Cache for parsed styles
  }

  /**
   * Loads the styles.xml part from the DOCX file.
   * This is an internal helper method.
   * @private
   */
  async _loadStylesXml() {
    if (!this.stylesXmlRoot) {
      this.stylesXmlRoot = await extractXmlRootFromDocx(this.docxBuffer, 'word/styles.xml');
    }
  }

  /**
   * Parses the entire styles.xml content.
   * @returns {Promise<object>} A promise that resolves with the parsed styles object,
   *                            validated by StylesSchema.
   * @throws {Error} If parsing fails or the styles structure is invalid.
   */
  async parse() {
    if (this._parsedStyles) {
      return this._parsedStyles;
    }

    await this._loadStylesXml();

    if (!this.stylesXmlRoot) {
      throw new Error('Styles XML root could not be loaded.');
    }

    const docDefaults = this.parseDocDefaults();
    const { styles, styleTypeDefaults } = this.parseStyles();

    const stylesData = {
      docDefaults,
      styles,
      styleTypeDefaults,
    };

    try {
      this._parsedStyles = StylesSchema.parse(stylesData);
      return this._parsedStyles;
    } catch (error) {
      console.error('Styles schema validation failed:', error.errors);
      throw new Error('Invalid styles data after parsing.');
    }
  }

  /**
   * Parses document defaults from <w:docDefaults>.
   * Assumes this.stylesXmlRoot is already loaded.
   * @returns {object} An object conforming to DocDefaultsSchema.
   */
  parseDocDefaults() {
    const docDefaultsNode = getElement(this.stylesXmlRoot, 'w:docDefaults');
    let pPrDefault = { ...defaultParagraphProperties };
    let rPrDefault = { ...defaultRunProperties };

    if (docDefaultsNode) {
      const pPrDefaultNode = getElement(docDefaultsNode, 'w:pPrDefault');
      if (pPrDefaultNode) {
        const pPrNode = getElement(pPrDefaultNode, 'w:pPr');
        if (pPrNode) {
          pPrDefault = this.paragraphPropertiesParser.parse(pPrNode);
        }
      }

      const rPrDefaultNode = getElement(docDefaultsNode, 'w:rPrDefault');
      if (rPrDefaultNode) {
        const rPrNode = getElement(rPrDefaultNode, 'w:rPr');
        if (rPrNode) {
          rPrDefault = this.runPropertiesParser.parse(rPrNode);
        }
      }
    }

    try {
        return DocDefaultsSchema.parse({
            paragraphProperties: pPrDefault,
            runProperties: rPrDefault,
        });
    } catch(error) {
        console.error('DocDefaults schema validation failed:', error.errors);
        // Fallback to ensure schema structure even if sub-parsing failed slightly
        return DocDefaultsSchema.parse({
            paragraphProperties: defaultParagraphProperties,
            runProperties: defaultRunProperties,
        });
    }
  }

  /**
   * Parses all <w:style> elements.
   * Assumes this.stylesXmlRoot is already loaded.
   * @returns {{styles: Array<object>, styleTypeDefaults: object}}
   *           An object containing an array of parsed style objects and
   *           an object mapping style types to their default style IDs.
   */
  parseStyles() {
    const styleNodes = this.stylesXmlRoot.getElementsByTagName('w:style');
    const parsedStyles = [];
    const styleTypeDefaults = {};

    for (let i = 0; i < styleNodes.length; i++) {
      const styleNode = styleNodes[i];
      const styleId = getAttribute(styleNode, 'w:styleId');
      const type = getAttribute(styleNode, 'w:type');

      if (!styleId || !type) {
        // console.warn('Skipping style with missing styleId or type:', styleNode);
        continue;
      }

      // Ensure type is one of the enum values, default to 'paragraph' or skip if invalid
      const validTypes = StyleSchema.shape.type.options;
      if (!validTypes.includes(type)) {
        // console.warn(`Skipping style with invalid type '${type}':`, styleNode);
        continue;
      }

      const name = getChildAttribute(styleNode, 'w:name', 'w:val');
      const basedOn = getChildAttribute(styleNode, 'w:basedOn', 'w:val');
      const isDefaultVal = getAttribute(styleNode, 'w:default');
      const isDefault = isDefaultVal === '1' || isDefaultVal === 'true';

      const pPrNode = getElement(styleNode, 'w:pPr');
      const rPrNode = getElement(styleNode, 'w:rPr');

      const paragraphProperties = pPrNode
        ? this.paragraphPropertiesParser.parse(pPrNode)
        : undefined; // Let Zod handle default if undefined
      const runProperties = rPrNode
        ? this.runPropertiesParser.parse(rPrNode)
        : undefined; // Let Zod handle default if undefined

      // Placeholders for table properties - these would need their own parsers
      const tblPrNode = getElement(styleNode, 'w:tblPr');
      const tcPrNode = getElement(styleNode, 'w:tcPr');
      const tableProperties = tblPrNode ? { rawXml: tblPrNode.toString() } : undefined;
      const tableCellProperties = tcPrNode ? { rawXml: tcPrNode.toString() } : undefined;


      const styleData = {
        styleId,
        type,
        name: name || undefined, // Ensure optional fields are undefined if null
        basedOn: basedOn || undefined,
        isDefault: isDefault || undefined,
        paragraphProperties,
        runProperties,
        tableProperties,
        tableCellProperties,
      };

      try {
        const validatedStyle = StyleSchema.parse(styleData);
        parsedStyles.push(validatedStyle);

        if (validatedStyle.isDefault) {
          styleTypeDefaults[validatedStyle.type] = validatedStyle.styleId;
        }
      } catch (error) {
        console.error(`Style schema validation failed for styleId '${styleId}':`, error.errors, styleData);
        // Decide whether to skip the style or add a partially parsed/default version
      }
    }
    
    const validatedStyleTypeDefaults = StyleTypeDefaultsSchema.parse(styleTypeDefaults);

    return { styles: parsedStyles, styleTypeDefaults: validatedStyleTypeDefaults };
  }

  /**
   * Returns the cached parsed styles schema. Parses if not already parsed.
   * This method is the primary public interface for getting parsed styles.
   * @returns {Promise<object>} A promise that resolves with the parsed styles object.
   */
  async getStylesSchema() {
    if (!this._parsedStyles) {
      // Ensure parse() is awaited correctly.
      // The parse method itself handles the XML loading and parsing.
      await this.parse(); 
    }
    return this._parsedStyles;
  }
}

// Example Usage (Illustrative - requires a DOCX buffer)
// async function testStylesParser(docxBuffer) {
//   if (!docxBuffer || docxBuffer.byteLength === 0) {
//     console.warn("Skipping StylesParser test: No DOCX buffer provided.");
//     return;
//   }
//   const stylesParser = new StylesParser(docxBuffer);
//   try {
//     const styles = await stylesParser.parse();
//     console.log("Parsed Styles:", JSON.stringify(styles, null, 2));
//
//     // Test caching
//     const stylesAgain = await stylesParser.getStylesSchema();
//     console.log("Parsed Styles (from cache):", styles === stylesAgain); // Should be true
//
//   } catch (error) {
//     console.error("Error parsing styles.xml:", error);
//   }
// }

// To run the test, you'd need to load a DOCX file into an ArrayBuffer.
// For example, in Node.js:
// import fs from 'fs/promises';
// async function main() {
//   try {
//     const filePath = 'path/to/your/document.docx'; // Replace with actual path
//     const fileBuffer = await fs.readFile(filePath);
//     // Convert Node.js Buffer to ArrayBuffer
//     const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
//     await testStylesParser(arrayBuffer);
//   } catch (e) {
//     console.error("Failed to load DOCX or run test:", e);
//     await testStylesParser(new ArrayBuffer(0)); // Run with empty buffer to see warning
//   }
// }
// main();
