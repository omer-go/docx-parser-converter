/**
 * @file style_enhancer.js
 * @description Defines the StyleEnhancer class responsible for resolving and merging styles and properties.
 */

// Import Zod schemas for type hinting and validation (optional, but good practice)
// import { StylesSchema } from '../parsers/models/styles_models.js';
// import { NumberingDefinitionsSchema } from '../parsers/models/numbering_models.js';
// import { DocumentSchema, ParagraphSchema } from '../parsers/models/document_models.js';
// import { ParagraphPropertiesSchema, RunPropertiesSchema } from '../parsers/models/properties_models.js';

/**
 * The StyleEnhancer class is responsible for applying styles and resolving properties
 * for document elements. It merges direct formatting with style-defined formatting
 * and handles style inheritance.
 */
export class StyleEnhancer {
  /**
   * Constructs a StyleEnhancer instance.
   *
   * @param {object} stylesSchema - The fully parsed StylesSchema object from StylesParser.
   * @param {object} numberingDefinitionsSchema - The fully parsed NumberingDefinitionsSchema
   *                                              object from NumberingParser. (Not used in this subtask)
   */
  constructor(stylesSchema, numberingDefinitionsSchema) {
    if (!stylesSchema || typeof stylesSchema !== 'object') {
      throw new Error("StyleEnhancer constructor requires a valid stylesSchema object.");
    }
    // Numbering definitions might not be strictly required if not immediately used,
    // but good to include for future completeness.
    if (!numberingDefinitionsSchema || typeof numberingDefinitionsSchema !== 'object') {
      throw new Error("StyleEnhancer constructor requires a valid numberingDefinitionsSchema object.");
    }

    this.stylesSchema = stylesSchema;
    this.numberingDefinitionsSchema = numberingDefinitionsSchema;

    // Cache for resolved styles to avoid redundant computations
    this._resolvedStyleCache = new Map();
  }

  /**
   * Enhances a document by resolving and merging styles for all its elements.
   *
   * @param {object} documentSchema - The initial DocumentSchema object parsed from document.xml.
   * @returns {object} A new DocumentSchema object with properties resolved and merged.
   */
  enhanceDocument(documentSchema) {
    // Check if documentSchema has the correct structure
    if (!documentSchema || !Array.isArray(documentSchema.elements)) {
      console.warn("enhanceDocument: Invalid documentSchema or missing elements array.");
      return documentSchema; // Or throw error, depending on desired strictness
    }

    const enhancedElements = documentSchema.elements.map(element => {
      if (element.type === 'paragraph') {
        // Deep clone the paragraph to avoid mutating the original schema directly
        const clonedParagraph = JSON.parse(JSON.stringify(element));
        return this._enhanceParagraph(clonedParagraph);
      }
      // TODO: Add handling for other element types like tables
      return element; // Return other elements unchanged for now
    });

    // Deep clone the document schema and update its elements
    const enhancedDocument = JSON.parse(JSON.stringify(documentSchema));
    enhancedDocument.elements = enhancedElements;
    
    // Add the numbering definitions to the enhanced document so the HTML converter can access them
    enhancedDocument.numberingDefinitions = this.numberingDefinitionsSchema;
    
    return enhancedDocument;
  }

  /**
   * Enhances a single paragraph by resolving and merging its styles and properties.
   *
   * @param {object} paragraph - The ParagraphSchema object to enhance.
   * @returns {object} A new ParagraphSchema object with resolved properties.
   * @private
   */
  _enhanceParagraph(paragraph) {
    // 1. Start with document default paragraph properties as the absolute base.
    //    Deep clone to prevent modification of the original defaults.
    let finalParagraphProps = JSON.parse(JSON.stringify(this.stylesSchema.docDefaults.paragraphProperties || {}));

    // 2. Apply default paragraph style (if any).
    const defaultParaStyleId = this.stylesSchema.styleTypeDefaults?.paragraph;
    if (defaultParaStyleId) {
      const defaultParaStyleProps = this._getResolvedStyleProperties(defaultParaStyleId, 'paragraph');
      if (defaultParaStyleProps) {
        finalParagraphProps = this.mergeParagraphProperties(finalParagraphProps, defaultParaStyleProps);
      } else {
        // console.warn(`_enhanceParagraph: Default paragraph style ID '${defaultParaStyleId}' not found.`);
      }
    }

    // 3. Apply paragraph style if pStyle is present.
    //    (paragraph.properties comes from the direct <w:pPr> on the <w:p> element)
    const directParagraphProps = paragraph.properties || {};
    if (directParagraphProps.pStyle) {
      const paraStyleProps = this._getResolvedStyleProperties(directParagraphProps.pStyle, 'paragraph');
      if (paraStyleProps) {
        finalParagraphProps = this.mergeParagraphProperties(finalParagraphProps, paraStyleProps);
      } else {
        console.warn(`_enhanceParagraph: Paragraph style ID '${directParagraphProps.pStyle}' not found.`);
      }
    }

    // 4. Apply direct paragraph properties (from the paragraph's own <w:pPr>).
    //    These have the highest precedence.
    finalParagraphProps = this.mergeParagraphProperties(finalParagraphProps, directParagraphProps);

    // Create a new paragraph object with the original runs and the new, fully resolved properties.
    // Deep clone the original paragraph and then replace its properties.
    const newParagraph = JSON.parse(JSON.stringify(paragraph));
    newParagraph.properties = finalParagraphProps;

    // Enhance each run within this paragraph, passing the resolved paragraph properties for context.
    newParagraph.runs = newParagraph.runs.map(run => this._enhanceRun(run, finalParagraphProps));

    return newParagraph;
  }

  /**
   * Enhances a single run by resolving and merging its styles and properties.
   *
   * @param {object} run - The RunSchema object to enhance.
   * @param {object} resolvedParagraphProps - The fully resolved ParagraphPropertiesSchema
   *                                          object of the parent paragraph.
   * @returns {object} A new RunSchema object with resolved properties.
   * @private
   */
  /**
   * Retrieves and resolves the properties defined by a specific numbering level.
   * This includes the paragraph properties of the level and merges the level's
   * run properties into the paragraph's default run properties (rPr).
   *
   * @param {string} numIdStr - The numbering instance ID (from numPr.numId).
   * @param {string} ilvlStr - The indentation level (from numPr.ilvl).
   * @returns {object | null} The resolved ParagraphPropertiesSchema object from the numbering level,
   *                          or null if not found.
   * @private
   */
  _getNumberingLevelResolvedProperties(numIdStr, ilvlStr) {
    if (numIdStr === undefined || ilvlStr === undefined) return null;

    const numId = parseInt(numIdStr, 10);
    const ilvl = parseInt(ilvlStr, 10);

    if (isNaN(numId) || isNaN(ilvl)) {
      // console.warn(`_getNumberingLevelResolvedProperties: Invalid numId ('${numIdStr}') or ilvl ('${ilvlStr}').`);
      return null;
    }

    const numInstance = this.numberingDefinitionsSchema.numInstances.find(inst => inst.numId === numId);
    if (!numInstance) {
      // console.warn(`_getNumberingLevelResolvedProperties: Numbering instance ID '${numId}' not found.`);
      return null;
    }

    const abstractNum = this.numberingDefinitionsSchema.abstractNums.find(
      abs => abs.abstractNumId === numInstance.abstractNumId
    );
    if (!abstractNum) {
      // console.warn(`_getNumberingLevelResolvedProperties: Abstract numbering definition ID '${numInstance.abstractNumId}' not found.`);
      return null;
    }

    const levelDefinition = abstractNum.levels.find(l => l.level === ilvl);
    if (!levelDefinition) {
      // console.warn(`_getNumberingLevelResolvedProperties: Level '${ilvl}' for abstract numbering ID '${abstractNum.abstractNumId}' not found.`);
      return null;
    }

    // Deep clone the paragraph properties from the numbering level to avoid mutating the original schema.
    let resolvedNumberingPProps = JSON.parse(JSON.stringify(levelDefinition.paragraphProperties || {}));

    // Merge the numbering level's run properties into its paragraph's default run properties (rPr).
    if (levelDefinition.runProperties) {
      resolvedNumberingPProps.rPr = this.mergeRunProperties(
        resolvedNumberingPProps.rPr || {}, // Base is existing rPr or empty object
        levelDefinition.runProperties       // Props to merge
      );
    }
    return resolvedNumberingPProps;
  }

  _enhanceRun(run, resolvedParagraphProps) {
    // 1. Start with document default run properties as the absolute base.
    //    Deep clone to prevent modification of the original defaults.
    let finalRunProps = JSON.parse(JSON.stringify(this.stylesSchema.docDefaults.runProperties || {}));

    // 2. Apply default character style (if any).
    const defaultCharStyleId = this.stylesSchema.styleTypeDefaults?.character;
    if (defaultCharStyleId) {
      const defaultCharStyleProps = this._getResolvedStyleProperties(defaultCharStyleId, 'character');
      if (defaultCharStyleProps) {
        finalRunProps = this.mergeRunProperties(finalRunProps, defaultCharStyleProps);
      } else {
        // console.warn(`_enhanceRun: Default character style ID '${defaultCharStyleId}' not found.`);
      }
    }

    // 3. Apply paragraph's default run properties (pPr/rPr).
    //    These are already resolved considering paragraph style and direct paragraph formatting.
    if (resolvedParagraphProps && resolvedParagraphProps.rPr) {
      finalRunProps = this.mergeRunProperties(finalRunProps, resolvedParagraphProps.rPr);
    }

    // 4. Apply character style if rStyle is present on the run.
    //    (run.properties comes from the direct <w:rPr> on the <w:r> element)
    const directRunProps = run.properties || {};
    if (directRunProps.rStyle) {
      const charStyleProps = this._getResolvedStyleProperties(directRunProps.rStyle, 'character');
      if (charStyleProps) {
        finalRunProps = this.mergeRunProperties(finalRunProps, charStyleProps);
      } else {
        // console.warn(`_enhanceRun: Character style ID '${directRunProps.rStyle}' for run not found.`);
      }
    }

    // 5. Apply direct run properties (from the run's own <w:rPr>).
    //    These have the highest precedence.
    finalRunProps = this.mergeRunProperties(finalRunProps, directRunProps);

    // Create a new run object with the original text and the new, fully resolved properties.
    // Deep clone the original run and then replace its properties.
    const newRun = JSON.parse(JSON.stringify(run));
    newRun.properties = finalRunProps;
    return newRun;
  }


  /**
   * Retrieves and resolves a style by its ID, including its inheritance chain.
   * Caches results to avoid redundant computations.
   *
   * @param {string} styleId - The ID of the style to resolve.
   * @param {('paragraph'|'character'|'table'|'numbering')} styleType - The type of style.
   * @returns {object | null} The resolved style properties object (e.g., ParagraphPropertiesSchema or RunPropertiesSchema)
   *                          or null if the style is not found.
   * @private
   */
  _getResolvedStyleProperties(styleId, styleType) {
    const cacheKey = `${styleId}-${styleType}`;
    if (this._resolvedStyleCache.has(cacheKey)) {
      return this._resolvedStyleCache.get(cacheKey);
    }

    const styleDefinition = this.stylesSchema.styles.find(s => s.styleId === styleId && s.type === styleType);

    if (!styleDefinition) {
      // console.warn(`_getResolvedStyleProperties: Style ID '${styleId}' of type '${styleType}' not found.`);
      return null;
    }

    let resolvedProps = {};

    // 1. Recursively resolve basedOn style first
    if (styleDefinition.basedOn) {
      const baseStyleProps = this._getResolvedStyleProperties(styleDefinition.basedOn, styleType);
      if (baseStyleProps) {
        resolvedProps = baseStyleProps; // Start with base properties
      } else {
        console.warn(`_getResolvedStyleProperties: Base style ID '${styleDefinition.basedOn}' for style '${styleId}' not found.`);
      }
    } else {
      // If no base style, use document defaults for that type as the ultimate fallback.
      // This is crucial for ensuring all styles eventually inherit from docDefaults.
      if (styleType === 'paragraph') {
        resolvedProps = JSON.parse(JSON.stringify(this.stylesSchema.docDefaults.paragraphProperties || {}));
      } else if (styleType === 'character') {
        resolvedProps = JSON.parse(JSON.stringify(this.stylesSchema.docDefaults.runProperties || {}));
      }
      // TODO: Add for table and numbering if applicable
    }

    // 2. Merge current style's properties onto the base/default properties
    if (styleType === 'paragraph') {
      resolvedProps = this.mergeParagraphProperties(
        resolvedProps,
        styleDefinition.paragraphProperties || {}
      );
    } else if (styleType === 'character') {
      // Assuming character styles only define run properties
      resolvedProps = this.mergeRunProperties(
        resolvedProps, // This should be run properties from base or docDefaults
        styleDefinition.runProperties || {}
      );
    }
    // TODO: Add for table and numbering styles

    this._resolvedStyleCache.set(cacheKey, resolvedProps);
    return resolvedProps;
  }


  /**
   * Merges two RunPropertiesSchema objects. `newProps` override `baseProps`.
   * This is a deep merge for nested objects like rFonts, color, sz.
   *
   * @param {object} baseProps - The base RunPropertiesSchema object.
   * @param {object} newProps - The new RunPropertiesSchema object to merge over the base.
   * @returns {object} A new RunPropertiesSchema object with merged properties.
   */
  mergeRunProperties(baseProps, newProps) {
    const merged = { ...baseProps };

    for (const key in newProps) {
      if (newProps.hasOwnProperty(key)) {
        const newValue = newProps[key];
        // If the new value is explicitly null or undefined, it might mean "unset" or "remove base property".
        // However, typical OOXML merging usually means if a property is specified in a derived style,
        // it overrides, even if it's to set something to 'auto' or a default-like state.
        // For Zod schemas, optional fields might be undefined if not present.
        // If new value is undefined, we keep the base. If it's null, it might be an explicit unset.
        // For simplicity here: if a key exists in newProps, its value is taken,
        // unless that value is undefined.
        if (newValue !== undefined) {
          if (newValue === null) { // Explicitly setting to null (e.g. removing a color)
            merged[key] = null;
          } else if (typeof newValue === 'object' && !Array.isArray(newValue) && newValue !== null) {
            // Deep merge for objects (like rFonts, color, sz which are objects in schema)
            merged[key] = this.mergeRunProperties(merged[key] || {}, newValue);
          } else {
            merged[key] = newValue;
          }
        }
      }
    }
    return merged;
  }

  /**
   * Merges two ParagraphPropertiesSchema objects. `newProps` override `baseProps`.
   *
   * @param {object} baseProps - The base ParagraphPropertiesSchema object.
   * @param {object} newProps - The new ParagraphPropertiesSchema object to merge over the base.
   * @returns {object} A new ParagraphPropertiesSchema object with merged properties.
   */
  mergeParagraphProperties(baseProps, newProps) {
    const merged = { ...baseProps };

    for (const key in newProps) {
      if (newProps.hasOwnProperty(key)) {
        const newValue = newProps[key];
        if (newValue !== undefined) {
          if (key === 'rPr' && newValue) { // Default run properties for the paragraph
            merged.rPr = this.mergeRunProperties(merged.rPr || {}, newValue);
          } else if (typeof newValue === 'object' && !Array.isArray(newValue) && newValue !== null) {
            // Deep merge for other nested objects (like ind, spacing)
            // Assuming a generic deep merge strategy for simplicity here.
            // For specific sub-objects like 'ind' or 'spacing', if they are fully replaced
            // by the newProps, a simple assignment is fine. If they also need deep merging:
            merged[key] = this.mergeParagraphProperties(merged[key] || {}, newValue); // Recursive call for generic objects
          } else {
            merged[key] = newValue;
          }
        }
      }
    }
    // `pStyle` itself is generally not inherited in the final computed properties of an element,
    // but used to fetch the style. So, we don't typically merge pStyle from base to new.
    // The newProps.pStyle (direct property) is what matters for the element.
    // However, the merged object might be an intermediate style definition.
    // For now, if newProps has pStyle, it's taken. If not, baseProps.pStyle is kept.
    // This behavior might need refinement based on how merged style definitions are used.
    if (newProps.pStyle === undefined && baseProps.pStyle !== undefined) {
        merged.pStyle = baseProps.pStyle;
    } else if (newProps.pStyle !== undefined) {
        merged.pStyle = newProps.pStyle;
    }


    return merged;
  }
}

// Example Usage (Conceptual - would be in a main script)
// import { StylesParser } from '../parsers/styles_parser.js';
// import { NumberingParser } from '../parsers/numbering_parser.js';
// import { DocumentParser } from '../parsers/document_parser.js'; // Assuming it exists

// async function main(docxBuffer) {
//   const stylesParser = new StylesParser(docxBuffer);
//   const numberingParser = new NumberingParser(docxBuffer);
//   const documentParser = new DocumentParser(docxBuffer); // You'd pass necessary parsers to it or handle it differently

//   const styles = await stylesParser.getStylesSchema();
//   const numbering = await numberingParser.getNumberingDefinitions();
//   const initialDocument = await documentParser.parse(); // Assuming parse method returns DocumentSchema

//   const styleEnhancer = new StyleEnhancer(styles, numbering);
//   const enhancedDocument = styleEnhancer.enhanceDocument(initialDocument);

//   console.log("Enhanced Document:", JSON.stringify(enhancedDocument, null, 2));
// }
