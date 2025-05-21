import { extractXmlRootFromDocx, getElement, getAttribute, getChildAttribute } from './xml_utils.js';
import {
  NumberingDefinitionsSchema,
  NumberingLevelSchema,
  AbstractNumberingSchema,
  NumberingInstanceSchema,
  // defaultParagraphProperties, // Not strictly needed here if optional() handles defaults
  // defaultRunProperties
} from './models/numbering_models.js';
import { RunPropertiesParser } from './run_properties_parser.js';
import { ParagraphPropertiesParser } from './paragraph_properties_parser.js';
import { defaultParagraphProperties, defaultRunProperties } from './models/properties_models.js';


/**
 * Parses the numbering.xml file from a DOCX document.
 */
export class NumberingParser {
  /**
   * @param {ArrayBuffer} docxBuffer - The DOCX file buffer.
   */
  constructor(docxBuffer) {
    this.docxBuffer = docxBuffer;
    this.numberingXmlRoot = null; // To be populated by _loadNumberingXml
    this.runPropertiesParser = new RunPropertiesParser();
    this.paragraphPropertiesParser = new ParagraphPropertiesParser();
    this._parsedNumberingDefinitions = null; // Cache for parsed definitions
  }

  /**
   * Loads the numbering.xml part from the DOCX file.
   * This is an internal helper method.
   * @private
   */
  async _loadNumberingXml() {
    if (!this.numberingXmlRoot) {
      this.numberingXmlRoot = await extractXmlRootFromDocx(this.docxBuffer, 'word/numbering.xml');
    }
  }

  /**
   * Parses the entire numbering.xml content.
   * @returns {Promise<object>} A promise that resolves with the parsed numbering definitions object,
   *                            validated by NumberingDefinitionsSchema.
   * @throws {Error} If parsing fails or the numbering structure is invalid.
   */
  async parse() {
    if (this._parsedNumberingDefinitions) {
      return this._parsedNumberingDefinitions;
    }

    await this._loadNumberingXml();

    if (!this.numberingXmlRoot) {
      // If numbering.xml doesn't exist, it's valid to have no numbering.
      // Return empty definitions.
      const emptyDefs = { abstractNums: [], numInstances: [] };
      this._parsedNumberingDefinitions = NumberingDefinitionsSchema.parse(emptyDefs);
      return this._parsedNumberingDefinitions;
    }

    const abstractNums = this.parseAbstractNumberingDefinitions();
    const numInstances = this.parseNumberingInstances();

    const numberingData = {
      abstractNums,
      numInstances,
    };

    try {
      this._parsedNumberingDefinitions = NumberingDefinitionsSchema.parse(numberingData);
      return this._parsedNumberingDefinitions;
    } catch (error) {
      console.error('NumberingDefinitions schema validation failed:', error.errors);
      throw new Error('Invalid numbering data after parsing.');
    }
  }

  /**
   * Parses abstract numbering definitions (<w:abstractNum>).
   * Assumes this.numberingXmlRoot is already loaded.
   * @returns {Array<object>} An array of parsed abstract numbering objects.
   */
  parseAbstractNumberingDefinitions() {
    const abstractNumNodes = this.numberingXmlRoot.getElementsByTagName('w:abstractNum');
    const parsedAbstractNums = [];

    for (let i = 0; i < abstractNumNodes.length; i++) {
      const abstractNumNode = abstractNumNodes[i];
      const abstractNumIdStr = getAttribute(abstractNumNode, 'w:abstractNumId');

      if (abstractNumIdStr === null) {
        // console.warn('Skipping abstractNum with missing abstractNumId:', abstractNumNode);
        continue;
      }
      const abstractNumId = parseInt(abstractNumIdStr, 10);
      if (isNaN(abstractNumId)) {
        // console.warn('Skipping abstractNum with invalid abstractNumId:', abstractNumIdStr, abstractNumNode);
        continue;
      }

      const name = getChildAttribute(abstractNumNode, 'w:name', 'w:val');
      const multiLevelType = getChildAttribute(abstractNumNode, 'w:multiLevelType', 'w:val');
      const levelNodes = abstractNumNode.getElementsByTagName('w:lvl');
      const levels = [];

      for (let j = 0; j < levelNodes.length; j++) {
        const levelNode = levelNodes[j];
        const levelIndexStr = getAttribute(levelNode, 'w:ilvl');
        if (levelIndexStr === null) {
          // console.warn('Skipping level with missing ilvl:', levelNode);
          continue;
        }
        const levelIndex = parseInt(levelIndexStr, 10);
         if (isNaN(levelIndex)) {
          // console.warn('Skipping level with invalid ilvl:', levelIndexStr, levelNode);
          continue;
        }

        const startValStr = getChildAttribute(levelNode, 'w:start', 'w:val');
        const startVal = startValStr ? parseInt(startValStr, 10) : undefined;

        const numFmt = getChildAttribute(levelNode, 'w:numFmt', 'w:val');
        const lvlText = getChildAttribute(levelNode, 'w:lvlText', 'w:val');
        const lvlJc = getChildAttribute(levelNode, 'w:lvlJc', 'w:val');

        const pPrNode = getElement(levelNode, 'w:pPr');
        const rPrNode = getElement(levelNode, 'w:rPr');

        const paragraphProperties = pPrNode
          ? this.paragraphPropertiesParser.parse(pPrNode)
          : defaultParagraphProperties; // Use default if not present
        const runProperties = rPrNode
          ? this.runPropertiesParser.parse(rPrNode)
          : defaultRunProperties; // Use default if not present

        const levelData = {
          level: levelIndex,
          start: startVal,
          format: numFmt || undefined,
          text: lvlText || undefined,
          jc: lvlJc || undefined,
          paragraphProperties,
          runProperties,
        };
        try {
            levels.push(NumberingLevelSchema.parse(levelData));
        } catch (error) {
            console.error(`NumberingLevel schema validation failed for level ${levelIndex} in abstractNum ${abstractNumId}:`, error.errors, levelData);
        }
      }

      const abstractNumData = {
        abstractNumId,
        name: name || undefined,
        multiLevelType: multiLevelType || undefined,
        levels,
      };

      try {
        const validatedAbstractNum = AbstractNumberingSchema.parse(abstractNumData);
        parsedAbstractNums.push(validatedAbstractNum);
      } catch (error) {
        console.error(`AbstractNumbering schema validation failed for abstractNumId '${abstractNumId}':`, error.errors, abstractNumData);
      }
    }
    return parsedAbstractNums;
  }

  /**
   * Parses numbering instances (<w:num>).
   * Assumes this.numberingXmlRoot is already loaded.
   * @returns {Array<object>} An array of parsed numbering instance objects.
   */
  parseNumberingInstances() {
    const numNodes = this.numberingXmlRoot.getElementsByTagName('w:num');
    const parsedNumInstances = [];

    for (let i = 0; i < numNodes.length; i++) {
      const numNode = numNodes[i];
      const numIdStr = getAttribute(numNode, 'w:numId');
      if (numIdStr === null) {
        // console.warn('Skipping num instance with missing numId:', numNode);
        continue;
      }
      const numId = parseInt(numIdStr, 10);
      if (isNaN(numId)) {
        // console.warn('Skipping num instance with invalid numId:', numIdStr, numNode);
        continue;
      }

      const abstractNumIdValStr = getChildAttribute(numNode, 'w:abstractNumId', 'w:val');
      if (abstractNumIdValStr === null) {
        // console.warn(`Skipping num instance ${numId} with missing abstractNumId mapping:`, numNode);
        continue;
      }
      const abstractNumIdVal = parseInt(abstractNumIdValStr, 10);
       if (isNaN(abstractNumIdVal)) {
        // console.warn(`Skipping num instance ${numId} with invalid abstractNumId mapping:`, abstractNumIdValStr, numNode);
        continue;
      }

      // TODO: Parse <w:lvlOverride> elements if needed.
      // For now, levelOverrides will be an empty array or undefined.

      const numInstanceData = {
        numId,
        abstractNumId: abstractNumIdVal,
        levelOverrides: [], // Placeholder for now
      };

      try {
        const validatedInstance = NumberingInstanceSchema.parse(numInstanceData);
        parsedNumInstances.push(validatedInstance);
      } catch (error) {
        console.error(`NumberingInstance schema validation failed for numId '${numId}':`, error.errors, numInstanceData);
      }
    }
    return parsedNumInstances;
  }

  /**
   * Returns the cached parsed numbering definitions. Parses if not already parsed.
   * This method is the primary public interface for getting parsed numbering definitions.
   * @returns {Promise<object>} A promise that resolves with the parsed numbering definitions object.
   */
  async getNumberingDefinitions() {
    if (!this._parsedNumberingDefinitions) {
      // Ensure parse() is awaited correctly.
      await this.parse(); 
    }
    return this._parsedNumberingDefinitions;
  }
}

// Example Usage (Illustrative - requires a DOCX buffer)
// async function testNumberingParser(docxBuffer) {
//   if (!docxBuffer || docxBuffer.byteLength === 0) {
//     console.warn("Skipping NumberingParser test: No DOCX buffer provided.");
//     // Create a dummy parser to allow schema checks even without real data
//     const parser = new NumberingParser(new ArrayBuffer(0));
//     try {
//         await parser.parse(); // This will use empty defs
//         console.log("Empty numbering definition schema is valid.");
//     } catch(e) {
//         console.error("Error with empty numbering definitions:", e);
//     }
//     return;
//   }
//   const numberingParser = new NumberingParser(docxBuffer);
//   try {
//     const numberingDefs = await numberingParser.parse();
//     console.log("Parsed Numbering Definitions:", JSON.stringify(numberingDefs, null, 2));

//     // Test caching
//     const numberingDefsAgain = await numberingParser.getNumberingDefinitions();
//     console.log("Parsed Numbering Definitions (from cache):", numberingDefs === numberingDefsAgain); // Should be true

//   } catch (error) {
//     console.error("Error parsing numbering.xml:", error);
//   }
// }

// To run the test, you'd need to load a DOCX file into an ArrayBuffer.
// For example, in Node.js:
// import fs from 'fs/promises';
// async function main() {
//   try {
//     const filePath = 'path/to/your/document.docx'; // Replace with actual path
//     const fileBuffer = await fs.readFile(filePath);
//     const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
//     await testNumberingParser(arrayBuffer);
//   } catch (e) {
//     console.error("Failed to load DOCX or run test:", e);
//     await testNumberingParser(new ArrayBuffer(0)); // Run with empty buffer
//   }
// }
// main();
