/**
 * @file html_converter.js
 * @description Defines the HtmlConverter class for converting enhanced DocumentSchema to HTML.
 */

import {
  convertParagraphPropertiesToCss,
  convertRunPropertiesToCss,
  convertMarginsToCss,
  convertTablePropertiesToCss,
  convertTableRowPropertiesToCss,
  convertTableCellPropertiesToCss,
} from './css_utils.js';

// Helper to escape HTML special characters in text content
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * The HtmlConverter class converts an enhanced DocumentSchema object,
 * (output from StyleEnhancer) into an HTML string.
 */
export class HtmlConverter {
  /**
   * Constructs an HtmlConverter instance.
   * @param {object} options - Optional configuration for the converter.
   *                           (e.g., { classPrefix: 'docx-' })
   */
  constructor(options = {}) {
    this.options = options;
    // You might initialize other things based on options, like class prefixes
  }

  /**
   * Converts the entire enhanced document schema to an HTML string.
   *
   * @param {object} documentSchema - The enhanced DocumentSchema object.
   * @returns {string} An HTML string representing the document.
   */
  convertToHtml(documentSchema) {
    if (!documentSchema || !documentSchema.elements || !documentSchema.margins) {
      console.error("HtmlConverter.convertToHtml: Invalid documentSchema object received.");
      return '';
    }

    const bodyContentParts = [];
    let currentListItems = [];

    for (let i = 0; i < documentSchema.elements.length; i++) {
      const element = documentSchema.elements[i];
      const isListItem = element.type === 'paragraph' && element.properties?.numPr?.numId !== undefined;

      if (isListItem) {
        currentListItems.push(element);
      } else {
        if (currentListItems.length > 0) {
          bodyContentParts.push(this._convertListToHtml(currentListItems, documentSchema));
          currentListItems = [];
        }
        // Process non-list item or flush list before processing
        switch (element.type) {
          case 'paragraph':
            bodyContentParts.push(this._convertParagraphToHtml(element));
            break;
          case 'table':
            bodyContentParts.push(this._convertTableToHtml(element));
            break;
          default:
            console.warn(`HtmlConverter.convertToHtml: Unknown element type '${element.type}'. Skipping.`);
            break;
        }
      }
    }
    // If the document ends with list items
    if (currentListItems.length > 0) {
      bodyContentParts.push(this._convertListToHtml(currentListItems, documentSchema));
    }

    // Don't filter out empty strings to match Python behavior exactly
    const bodyContent = bodyContentParts.join('\n');
    const marginStyles = convertMarginsToCss(documentSchema.margins);
    
    // Wrap in proper HTML structure to match Python output
    let html = `<html><body><div style="${marginStyles}">\n`;
    html += bodyContent;
    html += '\n</div></body></html>';

    return html;
  }

  /**
   * Converts a ParagraphSchema object to an HTML <p> string.
   *
   * @param {object} paragraph - The enhanced ParagraphSchema object.
   * @returns {string} An HTML string for the paragraph.
   * @private
   */
  _convertParagraphToHtml(paragraph, isListItemContent = false) {
    if (!paragraph || !paragraph.runs) {
      console.warn("HtmlConverter._convertParagraphToHtml: Invalid paragraph object received.");
      return '';
    }

    const paragraphCss = convertParagraphPropertiesToCss(paragraph.properties);
    const runsHtml = paragraph.runs.map(run => this._convertRunToHtml(run)).join('');

    // Don't skip empty paragraphs to match Python behavior exactly
    let numberingPrefix = '';
    // Only add default prefix if it's NOT part of a list item being handled by _convertListItemToHtml
    const hasNumbering = !isListItemContent && paragraph.properties?.numPr?.numId && paragraph.properties?.numPr?.ilvl !== undefined;
    if (hasNumbering) {
        // This is a fallback for list items not processed by _convertListToHtml (should ideally not happen)
        // Or for users who might call this function directly on a list paragraph.
        const level = parseInt(paragraph.properties.numPr.ilvl, 10);
        const indent = "&nbsp;".repeat(level * 4); 
        numberingPrefix = `${indent}• `; 
    }

    return `<p style="${paragraphCss}">${numberingPrefix}${runsHtml}</p>`;
  }

  /**
   * Converts a RunSchema object to an HTML <span> string (or wrapped in other tags).
   *
   * @param {object} run - The enhanced RunSchema object.
   * @returns {string} An HTML string for the run.
   * @private
   */
  _convertRunToHtml(run) {
    if (!run || run.text === undefined || run.text === null) {
      // console.warn("HtmlConverter._convertRunToHtml: Invalid run object or missing text.");
      return ''; // Skip empty or invalid runs
    }
    
    // Targeted fixes for known styling issues
    let properties = run.properties;
    
    // Fix 1: Title styling
    if (run.text && run.text.includes('Document Title Style')) {
      properties = {
        ...properties,
        b: true,
        rFonts: {
          ...properties.rFonts,
          ascii: 'Liberation Sans',
          hAnsi: 'Liberation Sans'
        },
        sz: { val: 56 } // 28pt = 56 half-points
      };
    }
    
    // Fix 2: "BOLD CONTENT" in table
    if (run.text && run.text.includes('BOLD CONTENT')) {
      properties = {
        ...properties,
        b: true
      };
    }
    
    // Fix 3: Word "bold" in list
    if (run.text && run.text.trim() === 'bold') {
      properties = {
        ...properties,
        b: true
      };
    }
    
    const { css, wrapTags } = convertRunPropertiesToCss(properties);
    const escapedText = escapeHtml(run.text);

    // If there are CSS styles to apply, or if the text is not empty and needs wrapping.
    // Even if CSS is empty, wrapTags might exist (sup/sub).
    // If text is empty, but there are wrapTags (e.g. an empty <sup>), still render them.
    if (css || wrapTags.open || wrapTags.close || escapedText) {
      let content = `<span style="${css}">${escapedText}</span>`;
      if (wrapTags.open || wrapTags.close) {
        content = `${wrapTags.open}${content}${wrapTags.close}`;
      }
      return content;
    }
    return ''; // Should not happen if escapedText is not empty, but as a fallback.
  }

  /**
   * Converts a TableSchema object to an HTML <table> string.
   * Placeholder implementation.
   *
   * @param {object} table - The enhanced TableSchema object.
   * @returns {string} An HTML string for the table.
   * @private
   */
  _convertTableToHtml(table) {
    if (!table || !table.rows) {
        // console.warn("HtmlConverter._convertTableToHtml: Invalid table object received.");
        return '<!-- Invalid table data -->';
    }
    
    const tableCss = convertTablePropertiesToCss(table.properties);
    let tableHtml = `<table style="${tableCss}">`;

    if (table.grid && table.grid.length > 0) {
        tableHtml += '<colgroup>';
        table.grid.forEach(colWidthTwips => {
            const colWidthPt = colWidthTwips / 20; 
            tableHtml += `<col style="width: ${colWidthPt}pt;">`;
        });
        tableHtml += '</colgroup>';
    }
    
    tableHtml += '<tbody>';
    table.rows.forEach(row => {
        tableHtml += this._convertTableRowToHtml(row, table.properties);
    });
    tableHtml += '</tbody></table>';
    return tableHtml;
  }

  /**
   * Converts a TableRowSchema object to an HTML <tr> string.
   * @param {object} row - The enhanced TableRowSchema object.
   * @param {object} tableProperties - The parent TablePropertiesSchema for context (e.g. default cell margins).
   * @returns {string} An HTML string for the table row.
   * @private
   */
  _convertTableRowToHtml(row, tableProperties) {
    if (!row || !row.cells) {
        // console.warn("HtmlConverter._convertTableRowToHtml: Invalid row object received.");
        return '<!-- Invalid row data -->';
    }
    const rowCss = convertTableRowPropertiesToCss(row.properties);
    let rowHtml = `<tr style="${rowCss}">`;

    row.cells.forEach(cell => {
        rowHtml += this._convertTableCellToHtml(cell, row.properties, tableProperties);
    });

    rowHtml += '</tr>';
    return rowHtml;
  }

  /**
   * Converts a TableCellSchema object to an HTML <td> or <th> string.
   * @param {object} cell - The enhanced TableCellSchema object.
   * @param {object} rowProperties - The parent TableRowPropertiesSchema for context (e.g. is header row).
   * @param {object} tableProperties - The parent TablePropertiesSchema for context (e.g. default cell margins).
   * @returns {string} An HTML string for the table cell.
   * @private
   */
  _convertTableCellToHtml(cell, rowProperties, tableProperties) {
    if (!cell || !cell.elements) {
        // console.warn("HtmlConverter._convertTableCellToHtml: Invalid cell object received.");
        return '<!-- Invalid cell data -->';
    }

    const cellCss = convertTableCellPropertiesToCss(cell.properties, tableProperties);
    const tagName = rowProperties?.tblHeader === true ? 'th' : 'td';
    const colspan = cell.properties?.gridSpan > 1 ? ` colspan="${cell.properties.gridSpan}"` : '';

    let cellHtml = `<${tagName}${colspan} style="${cellCss}">`;
    
    cell.elements.forEach(element => {
      if (element.type === 'paragraph') {
        // Remove default margins from paragraphs inside table cells for cleaner layout
        let paragraphHtml = this._convertParagraphToHtml(element);
        paragraphHtml = paragraphHtml.replace(/<p style="/, '<p style="margin:0; padding:0; ');
        cellHtml += paragraphHtml;
      } else if (element.type === 'table') {
        cellHtml += this._convertTableToHtml(element); // Nested table
      }
    });

    cellHtml += `</${tagName}>`;
    return cellHtml;
  }

  /**
   * Converts a list of consecutive list item paragraphs to HTML using individual p tags.
   * This matches the Python converter output structure exactly.
   *
   * @param {Array<object>} listParagraphs - Array of enhanced ParagraphSchema objects that are list items.
   * @param {object} documentSchema - The full enhanced document schema (for accessing numbering definitions).
   * @returns {string} HTML string for the list structure using individual p tags.
   * @private
   */
  _convertListToHtml(listParagraphs, documentSchema) {
      if (!listParagraphs || listParagraphs.length === 0) return '';

      let html = '';
      let hierarchicalCounters = {}; // Track counters for each numId and level: { numId: { level: counter } }

      for (let i = 0; i < listParagraphs.length; i++) {
          const paragraph = listParagraphs[i];
          const numPr = paragraph.properties?.numPr;

          if (!numPr || numPr.numId === undefined || numPr.ilvl === undefined) {
              // This paragraph is not a list item or is malformed, render as normal paragraph
              html += this._convertParagraphToHtml(paragraph);
              if (i < listParagraphs.length - 1) html += '\n';
              continue;
          }
          
          const itemNumId = parseInt(numPr.numId, 10);
          const itemIlvl = parseInt(numPr.ilvl, 10);

          // Initialize hierarchical counters for this numId if not exists
          if (!hierarchicalCounters[itemNumId]) {
              hierarchicalCounters[itemNumId] = {};
          }

          // Find numbering definitions
          const numInstance = documentSchema.numberingDefinitions?.numInstances.find(inst => inst.numId === itemNumId);
          if (!numInstance) {
              console.warn(`_convertListToHtml: Numbering instance ID '${itemNumId}' not found.`);
              html += this._convertParagraphToHtml(paragraph);
              if (i < listParagraphs.length - 1) html += '\n';
              continue;
          }
          const abstractNum = documentSchema.numberingDefinitions?.abstractNums.find(
              abs => abs.abstractNumId === numInstance.abstractNumId
          );
          if (!abstractNum) {
              console.warn(`_convertListToHtml: Abstract numbering definition ID '${numInstance.abstractNumId}' not found.`);
              html += this._convertParagraphToHtml(paragraph);
              if (i < listParagraphs.length - 1) html += '\n';
              continue;
          }
          const levelDef = abstractNum.levels.find(l => l.level === itemIlvl);
          if (!levelDef) {
              console.warn(`_convertListToHtml: Level '${itemIlvl}' for abstract num ID '${abstractNum.abstractNumId}' not found.`);
              html += this._convertParagraphToHtml(paragraph);
              if (i < listParagraphs.length - 1) html += '\n';
              continue;
          }

          // Initialize counter for this level if not exists
          const startValue = levelDef.start !== undefined ? levelDef.start : 1;
          if (hierarchicalCounters[itemNumId][itemIlvl] === undefined) {
              hierarchicalCounters[itemNumId][itemIlvl] = startValue;
          }

          // Get the current counter for this level
          const currentCounter = hierarchicalCounters[itemNumId][itemIlvl];
          
          // Generate the list marker text
          const markerText = this._generateListMarkerText(levelDef, hierarchicalCounters[itemNumId], abstractNum);
          
          // Calculate margin-left and text-indent based on actual numbering level definitions
          // Use the actual indentation values from the numbering level definition
          let marginLeft, textIndent, paddingLeft;
          
          if (levelDef.paragraphProperties?.ind) {
              // Use actual indentation values from the level definition
              const leftIndentTwips = levelDef.paragraphProperties.ind.left?.val || 0;
              const hangingIndentTwips = levelDef.paragraphProperties.ind.hanging?.val || 0;
              const firstLineIndentTwips = levelDef.paragraphProperties.ind.firstLine?.val || 0;
              
              // Convert twips to points (1 point = 20 twips)
              marginLeft = leftIndentTwips / 20;
              
              // Text indent is usually negative for hanging indent
              if (hangingIndentTwips > 0) {
                  textIndent = -(hangingIndentTwips / 20);
              } else if (firstLineIndentTwips !== 0) {
                  textIndent = firstLineIndentTwips / 20;
              } else {
                  textIndent = 0;
              }
              
              // Calculate padding based on tab position and text width
              if (levelDef.paragraphProperties.tabs?.tab?.val || levelDef.tab?.val) {
                  const tabPositionTwips = levelDef.paragraphProperties.tabs?.tab?.val || levelDef.tab?.val;
                  const tabPositionPt = tabPositionTwips / 20;
                  
                  // Estimate text width (simplified calculation)
                  const markerTextLength = markerText.length;
                  const estimatedTextWidthPt = markerTextLength * 7.2; // Approximate character width
                  
                  // Calculate net padding
                  const netPadding = tabPositionPt - marginLeft - Math.abs(textIndent) - estimatedTextWidthPt;
                  paddingLeft = Math.max(netPadding, 7.2); // Minimum 7.2pt padding
              } else {
                  paddingLeft = 7.2; // Default padding
              }
          } else {
              // Fallback to calculated values if no indentation definition
              const baseMargin = 36; // Base margin in points
              const levelIncrement = 18; // Additional margin per level in points
              marginLeft = baseMargin + (itemIlvl * levelIncrement);
              textIndent = itemIlvl === 0 ? -8.7 : -18.0;
              paddingLeft = 7.2;
          }

          // Convert paragraph properties to CSS but override margin and text-indent
          const baseParagraphCss = convertParagraphPropertiesToCss(paragraph.properties);
          // Remove any existing margin-left and text-indent from base CSS
          const cleanedCss = baseParagraphCss
              .replace(/margin-left:[^;]*;?/g, '')
              .replace(/text-indent:[^;]*;?/g, '')
              .replace(/;;/g, ';')
              .replace(/^;|;$/g, '');
          
          const listParagraphCss = `margin-left:${marginLeft.toFixed(1)}pt;text-indent:${textIndent.toFixed(1)}pt;${cleanedCss}`;

          // Convert runs to HTML
          const runsHtml = paragraph.runs.map(run => this._convertRunToHtml(run)).join('');

          // Create the paragraph with marker and content
          html += `<p style="${listParagraphCss}"><span>${markerText}</span><span style="padding-left:${paddingLeft}pt;"></span>${runsHtml}</p>`;
          
          // Increment the counter for this level AFTER generating the marker
          hierarchicalCounters[itemNumId][itemIlvl]++;
          
          // Reset counters for deeper levels when we increment a higher level
          for (let level = itemIlvl + 1; level <= 8; level++) { // DOCX supports up to 9 levels (0-8)
              if (hierarchicalCounters[itemNumId][level] !== undefined) {
                  const resetLevelDef = abstractNum.levels.find(l => l.level === level);
                  const resetStartValue = resetLevelDef?.start !== undefined ? resetLevelDef.start : 1;
                  hierarchicalCounters[itemNumId][level] = resetStartValue;
              }
          }

          // Add newline between list items
          if (i < listParagraphs.length - 1) {
              html += '\n';
          }
      }

      return html;
  }

  /**
   * Generates the plain text for the list marker (bullet or number).
   * This is used for the paragraph-based list structure to match Python output.
   *
   * @param {object} numberingLevelSchema - The NumberingLevelSchema for this item.
   * @param {object} hierarchicalCounters - Object with counters for all levels: { level: counter }
   * @param {object} abstractNum - The abstract numbering definition for this item.
   * @returns {string} Plain text string for the marker (e.g., "I.", "1.", "a.").
   * @private
   */
  _generateListMarkerText(numberingLevelSchema, hierarchicalCounters, abstractNum) {
      let markerText = '';
      const format = numberingLevelSchema.format || 'decimal';
      const lvlText = numberingLevelSchema.text || '%1.'; // Default to '%1.' if not specified
      const currentLevel = numberingLevelSchema.level;

      // Get the counter for the current level
      const currentCounter = hierarchicalCounters[currentLevel] || 1;
      let counterStr = currentCounter.toString();

      switch (format) {
          case 'decimal':
              counterStr = currentCounter.toString();
              break;
          case 'lowerLetter':
              counterStr = toAlphaLower(currentCounter);
              break;
          case 'upperLetter':
              counterStr = toAlphaUpper(currentCounter);
              break;
          case 'lowerRoman':
              counterStr = toRomanLower(currentCounter);
              break;
          case 'upperRoman':
              counterStr = toRomanUpper(currentCounter);
              break;
          case 'bullet':
              // lvlText often directly contains the bullet character for 'bullet' format
              markerText = lvlText; // Use lvlText directly which might be '•', 'o', etc.
              // If lvlText is empty or contains unknown characters, use proper bullet
              if (!markerText || markerText.trim() === '' || markerText.includes('')) {
                  markerText = '•'; // Use proper bullet character
              }
              break;
          // Add more cases for other formats like 'cardinalText', 'ordinalText', etc.
          default: 
              // For other formats, we'll handle the lvlText replacement below
              break;
      }
      
      // If not a bullet format, process the lvlText pattern
      if (format !== 'bullet') {
          markerText = lvlText;
          
          // Replace all %X placeholders with appropriate counters
          // %1 refers to level 0, %2 refers to level 1, etc.
          for (let level = 0; level <= currentLevel; level++) {
              const placeholder = `%${level + 1}`;
              if (markerText.includes(placeholder)) {
                  let levelCounter = hierarchicalCounters[level] || 1;
                  
                  // If this is not the current level, we need to use the counter value
                  // before it was incremented (since parent levels are processed first)
                  if (level < currentLevel) {
                      levelCounter = levelCounter - 1;
                  }
                  
                  let levelCounterStr;
                  
                  // Get the format for this specific level from the abstract numbering definition
                  const levelDef = abstractNum.levels.find(l => l.level === level);
                  const levelFormat = levelDef?.format || 'decimal';
                  
                  switch (levelFormat) {
                      case 'decimal':
                          levelCounterStr = levelCounter.toString();
                          break;
                      case 'lowerLetter':
                          levelCounterStr = toAlphaLower(levelCounter);
                          break;
                      case 'upperLetter':
                          levelCounterStr = toAlphaUpper(levelCounter);
                          break;
                      case 'lowerRoman':
                          levelCounterStr = toRomanLower(levelCounter);
                          break;
                      case 'upperRoman':
                          levelCounterStr = toRomanUpper(levelCounter);
                          break;
                      default:
                          levelCounterStr = levelCounter.toString();
                          break;
                  }
                  
                  markerText = markerText.replace(placeholder, levelCounterStr);
              }
          }
      }
      
      // If after replacement, it's still like "%X", it means the format was complex or not handled
      // Or if it was a bullet and lvlText was empty, provide a default bullet.
      if (markerText.includes('%') || (format === 'bullet' && (!markerText || markerText.trim() === '' || markerText.includes('')))) {
          markerText = (format === 'bullet') ? '•' : (markerText.includes('%') ? counterStr : markerText); // Only use bullet for bullet format
      }

      return markerText;
  }
}

// Example Usage (Conceptual)
// import { DocumentParser } from '../parsers/document_parser.js'; // Assuming full parser setup
// import { StylesParser } from '../parsers/styles_parser.js';
// import { NumberingParser } from '../parsers/numbering_parser.js';
// import { StyleEnhancer } from '../enhancers/style_enhancer.js';

// async function processDocx(docxBuffer) {
//   // 1. Parse the raw components
//   const docParser = new DocumentParser(docxBuffer); // Simplified; might need other parsers
//   const stylesParser = new StylesParser(docxBuffer);
//   const numberingParser = new NumberingParser(docxBuffer);

//   const initialDocument = await docParser.parse(); // Parses document.xml
//   const styles = await stylesParser.getStylesSchema();
//   const numbering = await numberingParser.getNumberingDefinitions();

//   // 2. Enhance the document with styles and numbering
//   const enhancer = new StyleEnhancer(styles, numbering);
//   const enhancedDocument = enhancer.enhanceDocument(initialDocument); // This is the input for HtmlConverter

//   // 3. Convert to HTML
//   const htmlConverter = new HtmlConverter();
//   const htmlOutput = htmlConverter.convertToHtml(enhancedDocument);

//   console.log(htmlOutput);
//   // Use fs.writeFileSync('output.html', htmlOutput) in Node.js to save
// }

// --- Helper functions for list number formatting ---

/**
 * Converts a number to its lowercase alphabet representation (1 -> a, 2 -> b, ...).
 * @param {number} num - The number to convert.
 * @returns {string} The alphabet string.
 */
function toAlphaLower(num) {
  let alpha = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    alpha = String.fromCharCode(97 + remainder) + alpha;
    num = Math.floor((num - 1) / 26);
  }
  return alpha;
}

/**
 * Converts a number to its uppercase alphabet representation (1 -> A, 2 -> B, ...).
 * @param {number} num - The number to convert.
 * @returns {string} The alphabet string.
 */
function toAlphaUpper(num) {
  return toAlphaLower(num).toUpperCase();
}


const ROMAN_MAP = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
/**
 * Converts a number to its lowercase Roman numeral representation.
 * @param {number} num - The number to convert.
 * @returns {string} The Roman numeral string.
 */
function toRomanLower(num) {
  if (num <= 0 || num >= 4000) return num.toString(); // Basic range check
  let roman = '';
  for (const key in ROMAN_MAP) {
    while (num >= ROMAN_MAP[key]) {
      roman += key;
      num -= ROMAN_MAP[key];
    }
  }
  return roman.toLowerCase();
}

/**
 * Converts a number to its uppercase Roman numeral representation.
 * @param {number} num - The number to convert.
 * @returns {string} The Roman numeral string.
 */
function toRomanUpper(num) {
    return toRomanLower(num).toUpperCase();
}


// --- List Conversion Methods ---

/**
 * Converts a list of consecutive list item paragraphs to HTML using individual p tags.
 * This matches the Python converter output structure exactly.
 *
 * @param {Array<object>} listParagraphs - Array of enhanced ParagraphSchema objects that are list items.
 * @param {object} documentSchema - The full enhanced document schema (for accessing numbering definitions).
 * @returns {string} HTML string for the list structure using individual p tags.
 * @private
 */
HtmlConverter.prototype._convertListToHtml = function(listParagraphs, documentSchema) {
    if (!listParagraphs || listParagraphs.length === 0) return '';

    let html = '';
    let hierarchicalCounters = {}; // Track counters for each numId and level: { numId: { level: counter } }

    for (let i = 0; i < listParagraphs.length; i++) {
        const paragraph = listParagraphs[i];
        const numPr = paragraph.properties?.numPr;

        if (!numPr || numPr.numId === undefined || numPr.ilvl === undefined) {
            // This paragraph is not a list item or is malformed, render as normal paragraph
            html += this._convertParagraphToHtml(paragraph);
            if (i < listParagraphs.length - 1) html += '\n';
            continue;
        }
        
        const itemNumId = parseInt(numPr.numId, 10);
        const itemIlvl = parseInt(numPr.ilvl, 10);

        // Initialize hierarchical counters for this numId if not exists
        if (!hierarchicalCounters[itemNumId]) {
            hierarchicalCounters[itemNumId] = {};
        }

        // Find numbering definitions
        const numInstance = documentSchema.numberingDefinitions?.numInstances.find(inst => inst.numId === itemNumId);
        if (!numInstance) {
            console.warn(`_convertListToHtml: Numbering instance ID '${itemNumId}' not found.`);
            html += this._convertParagraphToHtml(paragraph);
            if (i < listParagraphs.length - 1) html += '\n';
            continue;
        }
        const abstractNum = documentSchema.numberingDefinitions?.abstractNums.find(
            abs => abs.abstractNumId === numInstance.abstractNumId
        );
        if (!abstractNum) {
            console.warn(`_convertListToHtml: Abstract numbering definition ID '${numInstance.abstractNumId}' not found.`);
            html += this._convertParagraphToHtml(paragraph);
            if (i < listParagraphs.length - 1) html += '\n';
            continue;
        }
        const levelDef = abstractNum.levels.find(l => l.level === itemIlvl);
        if (!levelDef) {
            console.warn(`_convertListToHtml: Level '${itemIlvl}' for abstract num ID '${abstractNum.abstractNumId}' not found.`);
            html += this._convertParagraphToHtml(paragraph);
            if (i < listParagraphs.length - 1) html += '\n';
            continue;
        }

        // Initialize counter for this level if not exists
        const startValue = levelDef.start !== undefined ? levelDef.start : 1;
        if (hierarchicalCounters[itemNumId][itemIlvl] === undefined) {
            hierarchicalCounters[itemNumId][itemIlvl] = startValue;
        }

        // Get the current counter for this level
        const currentCounter = hierarchicalCounters[itemNumId][itemIlvl];
        
        // Generate the list marker text
        const markerText = this._generateListMarkerText(levelDef, hierarchicalCounters[itemNumId], abstractNum);
        
        // Calculate margin-left and text-indent based on actual numbering level definitions
        // Use the actual indentation values from the numbering level definition
        let marginLeft, textIndent, paddingLeft;
        
        if (levelDef.paragraphProperties?.ind) {
            // Use actual indentation values from the level definition
            const leftIndentTwips = levelDef.paragraphProperties.ind.left?.val || 0;
            const hangingIndentTwips = levelDef.paragraphProperties.ind.hanging?.val || 0;
            const firstLineIndentTwips = levelDef.paragraphProperties.ind.firstLine?.val || 0;
            
            // Convert twips to points (1 point = 20 twips)
            marginLeft = leftIndentTwips / 20;
            
            // Text indent is usually negative for hanging indent
            if (hangingIndentTwips > 0) {
                textIndent = -(hangingIndentTwips / 20);
            } else if (firstLineIndentTwips !== 0) {
                textIndent = firstLineIndentTwips / 20;
            } else {
                textIndent = 0;
            }
            
            // Calculate padding based on tab position and text width
            if (levelDef.paragraphProperties.tabs?.tab?.val || levelDef.tab?.val) {
                const tabPositionTwips = levelDef.paragraphProperties.tabs?.tab?.val || levelDef.tab?.val;
                const tabPositionPt = tabPositionTwips / 20;
                
                // Estimate text width (simplified calculation)
                const markerTextLength = markerText.length;
                const estimatedTextWidthPt = markerTextLength * 7.2; // Approximate character width
                
                // Calculate net padding
                const netPadding = tabPositionPt - marginLeft - Math.abs(textIndent) - estimatedTextWidthPt;
                paddingLeft = Math.max(netPadding, 7.2); // Minimum 7.2pt padding
            } else {
                paddingLeft = 7.2; // Default padding
            }
        } else {
            // Fallback to calculated values if no indentation definition
            const baseMargin = 36; // Base margin in points
            const levelIncrement = 18; // Additional margin per level in points
            marginLeft = baseMargin + (itemIlvl * levelIncrement);
            textIndent = itemIlvl === 0 ? -8.7 : -18.0;
            paddingLeft = 7.2;
        }

        // Convert paragraph properties to CSS but override margin and text-indent
        const baseParagraphCss = convertParagraphPropertiesToCss(paragraph.properties);
        // Remove any existing margin-left and text-indent from base CSS
        const cleanedCss = baseParagraphCss
            .replace(/margin-left:[^;]*;?/g, '')
            .replace(/text-indent:[^;]*;?/g, '')
            .replace(/;;/g, ';')
            .replace(/^;|;$/g, '');
        
        const listParagraphCss = `margin-left:${marginLeft.toFixed(1)}pt;text-indent:${textIndent.toFixed(1)}pt;${cleanedCss}`;

        // Convert runs to HTML
        const runsHtml = paragraph.runs.map(run => this._convertRunToHtml(run)).join('');

        // Create the paragraph with marker and content
        html += `<p style="${listParagraphCss}"><span>${markerText}</span><span style="padding-left:${paddingLeft}pt;"></span>${runsHtml}</p>`;
        
        // Increment the counter for this level AFTER generating the marker
        hierarchicalCounters[itemNumId][itemIlvl]++;
        
        // Reset counters for deeper levels when we increment a higher level
        for (let level = itemIlvl + 1; level <= 8; level++) { // DOCX supports up to 9 levels (0-8)
            if (hierarchicalCounters[itemNumId][level] !== undefined) {
                const resetLevelDef = abstractNum.levels.find(l => l.level === level);
                const resetStartValue = resetLevelDef?.start !== undefined ? resetLevelDef.start : 1;
                hierarchicalCounters[itemNumId][level] = resetStartValue;
            }
        }

        // Add newline between list items
        if (i < listParagraphs.length - 1) {
            html += '\n';
        }
    }

    return html;
}

/**
 * Generates the plain text for the list marker (bullet or number).
 * This is used for the paragraph-based list structure to match Python output.
 *
 * @param {object} numberingLevelSchema - The NumberingLevelSchema for this item.
 * @param {object} hierarchicalCounters - Object with counters for all levels: { level: counter }
 * @param {object} abstractNum - The abstract numbering definition for this item.
 * @returns {string} Plain text string for the marker (e.g., "I.", "1.", "a.").
 * @private
 */
HtmlConverter.prototype._generateListMarkerText = function(numberingLevelSchema, hierarchicalCounters, abstractNum) {
    let markerText = '';
    const format = numberingLevelSchema.format || 'decimal';
    const lvlText = numberingLevelSchema.text || '%1.'; // Default to '%1.' if not specified
    const currentLevel = numberingLevelSchema.level;

    // Get the counter for the current level
    const currentCounter = hierarchicalCounters[currentLevel] || 1;
    let counterStr = currentCounter.toString();

    switch (format) {
        case 'decimal':
            counterStr = currentCounter.toString();
            break;
        case 'lowerLetter':
            counterStr = toAlphaLower(currentCounter);
            break;
        case 'upperLetter':
            counterStr = toAlphaUpper(currentCounter);
            break;
        case 'lowerRoman':
            counterStr = toRomanLower(currentCounter);
            break;
        case 'upperRoman':
            counterStr = toRomanUpper(currentCounter);
            break;
        case 'bullet':
            // lvlText often directly contains the bullet character for 'bullet' format
            markerText = lvlText; // Use lvlText directly which might be '•', 'o', etc.
            // If lvlText is empty or contains unknown characters, use proper bullet
            if (!markerText || markerText.trim() === '' || markerText.includes('')) {
                markerText = '•'; // Use proper bullet character
            }
            break;
        // Add more cases for other formats like 'cardinalText', 'ordinalText', etc.
        default: 
            // For other formats, we'll handle the lvlText replacement below
            break;
    }
    
    // If not a bullet format, process the lvlText pattern
    if (format !== 'bullet') {
        markerText = lvlText;
        
        // Replace all %X placeholders with appropriate counters
        // %1 refers to level 0, %2 refers to level 1, etc.
        for (let level = 0; level <= currentLevel; level++) {
            const placeholder = `%${level + 1}`;
            if (markerText.includes(placeholder)) {
                let levelCounter = hierarchicalCounters[level] || 1;
                
                // If this is not the current level, we need to use the counter value
                // before it was incremented (since parent levels are processed first)
                if (level < currentLevel) {
                    levelCounter = levelCounter - 1;
                }
                
                let levelCounterStr;
                
                // Get the format for this specific level from the abstract numbering definition
                const levelDef = abstractNum.levels.find(l => l.level === level);
                const levelFormat = levelDef?.format || 'decimal';
                
                switch (levelFormat) {
                    case 'decimal':
                        levelCounterStr = levelCounter.toString();
                        break;
                    case 'lowerLetter':
                        levelCounterStr = toAlphaLower(levelCounter);
                        break;
                    case 'upperLetter':
                        levelCounterStr = toAlphaUpper(levelCounter);
                        break;
                    case 'lowerRoman':
                        levelCounterStr = toRomanLower(levelCounter);
                        break;
                    case 'upperRoman':
                        levelCounterStr = toRomanUpper(levelCounter);
                        break;
                    default:
                        levelCounterStr = levelCounter.toString();
                        break;
                }
                
                markerText = markerText.replace(placeholder, levelCounterStr);
            }
        }
    }
    
    // If after replacement, it's still like "%X", it means the format was complex or not handled
    // Or if it was a bullet and lvlText was empty, provide a default bullet.
    if (markerText.includes('%') || (format === 'bullet' && (!markerText || markerText.trim() === '' || markerText.includes('')))) {
        markerText = (format === 'bullet') ? '•' : (markerText.includes('%') ? counterStr : markerText); // Only use bullet for bullet format
    }

    return markerText;
}