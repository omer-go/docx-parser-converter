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

    const bodyContent = bodyContentParts.join('\n');
    const marginStyles = convertMarginsToCss(documentSchema.margins);
    let html = `<div class="docx-container" style="${marginStyles}">\n`;
    html += bodyContent;
    html += '\n</div>';

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

    let numberingPrefix = '';
    // Only add default prefix if it's NOT part of a list item being handled by _convertListItemToHtml
    if (!isListItemContent && paragraph.properties?.numPr?.numId && paragraph.properties?.numPr?.ilvl !== undefined) {
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
    
    const { css, wrapTags } = convertRunPropertiesToCss(run.properties);
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
 * Converts a sequence of list item paragraphs to HTML list(s).
 * Handles basic list creation and nesting based on ilvl.
 *
 * @param {Array<object>} listParagraphs - Array of consecutive ParagraphSchema objects that are list items.
 * @param {object} documentSchema - The full DocumentSchema containing numberingDefinitions.
 * @returns {string} HTML string for the list(s).
 * @private
 */
HtmlConverter.prototype._convertListToHtml = function(listParagraphs, documentSchema) {
    if (!listParagraphs || listParagraphs.length === 0) return '';

    let html = '';
    let currentLevel = -1;
    let listStack = []; // To manage nesting: { numId, ilvl, tag, counter, abstractNum, numFmt }
    let currentCounter = 1; // Reset for each distinct list part

    for (let i = 0; i < listParagraphs.length; i++) {
        const paragraph = listParagraphs[i];
        const numPr = paragraph.properties?.numPr;

        if (!numPr || numPr.numId === undefined || numPr.ilvl === undefined) {
            // This paragraph is not a list item or is malformed, close any open lists.
            while (listStack.length > 0) {
                const openList = listStack.pop();
                html += `</${openList.tag}>`;
            }
            currentLevel = -1;
            // Render as a normal paragraph if it's not a list item (shouldn't happen if logic in convertToHtml is correct)
            html += this._convertParagraphToHtml(paragraph); 
            continue;
        }
        
        const itemNumId = parseInt(numPr.numId, 10);
        const itemIlvl = parseInt(numPr.ilvl, 10);

        // Find numbering definitions
        const numInstance = documentSchema.numberingDefinitions?.numInstances.find(inst => inst.numId === itemNumId);
        if (!numInstance) {
            console.warn(`_convertListToHtml: Numbering instance ID '${itemNumId}' not found.`);
            html += this._convertParagraphToHtml(paragraph); // Render as normal paragraph
            continue;
        }
        const abstractNum = documentSchema.numberingDefinitions?.abstractNums.find(
            abs => abs.abstractNumId === numInstance.abstractNumId
        );
        if (!abstractNum) {
            console.warn(`_convertListToHtml: Abstract numbering definition ID '${numInstance.abstractNumId}' not found.`);
            html += this._convertParagraphToHtml(paragraph);
            continue;
        }
        const levelDef = abstractNum.levels.find(l => l.level === itemIlvl);
        if (!levelDef) {
            console.warn(`_convertListToHtml: Level '${itemIlvl}' for abstract num ID '${abstractNum.abstractNumId}' not found.`);
            html += this._convertParagraphToHtml(paragraph);
            continue;
        }

        // Determine list type (ol/ul)
        const numFmt = levelDef.format || 'decimal'; // Default to decimal if not specified
        const listTag = (['decimal', 'lowerLetter', 'upperLetter', 'lowerRoman', 'upperRoman'].includes(numFmt)) ? 'ol' : 'ul';
        
        // Start counter for this level based on levelDef.start or default to 1
        const startValue = levelDef.start !== undefined ? levelDef.start : 1;


        if (itemIlvl > currentLevel) { // Start a new nested list
            if (listStack.length > 0 && listStack[listStack.length -1].tag === 'ol') {
                 // If parent is an OL, reset counter based on the new level's start value
                currentCounter = startValue;
            } else if (listStack.length === 0) { // Top-level list
                currentCounter = startValue;
            }
            // For UL or if parent is UL, counter is not strictly reset in the same way for display purposes,
            // but we need to ensure the currentCounter for OLs is managed per level.
            // The `start` attribute on <ol> handles visual start for OL.

            listStack.push({ numId: itemNumId, ilvl: itemIlvl, tag: listTag, counter: currentCounter, abstractNum, numFmt });
            html += `<${listTag}${listTag === 'ol' ? ` start="${startValue}"` : ''}>`; // Add start attribute for OL
            currentLevel = itemIlvl;
        } else if (itemIlvl < currentLevel) { // End nested list(s)
            while (listStack.length > 0 && listStack[listStack.length - 1].ilvl > itemIlvl) {
                const openList = listStack.pop();
                html += `</${openList.tag}>`;
            }
            currentLevel = listStack.length > 0 ? listStack[listStack.length - 1].ilvl : -1;
            // If, after popping, the new current list's numId or format doesn't match, close it too.
            if (listStack.length > 0 && (listStack[listStack.length - 1].numId !== itemNumId || listStack[listStack.length - 1].numFmt !== numFmt) ) {
                 const openList = listStack.pop();
                 html += `</${openList.tag}>`;
                 currentLevel = -1; // Force new list creation
            }
        } else if (listStack.length > 0 && (listStack[listStack.length - 1].numId !== itemNumId || listStack[listStack.length-1].numFmt !== numFmt)) {
            // Same level, but different list type or numId (meaning different abstract list)
            const openList = listStack.pop();
            html += `</${openList.tag}>`;
            currentLevel = -1; // Force new list creation because it's a different list definition
        }


        // If no list is open (either initially, or after closing previous ones)
        if (currentLevel === -1 || listStack.length === 0) {
            currentCounter = startValue; // Reset counter for the new list
            listStack.push({ numId: itemNumId, ilvl: itemIlvl, tag: listTag, counter: currentCounter, abstractNum, numFmt });
            html += `<${listTag}${listTag === 'ol' ? ` start="${startValue}"` : ''}>`;
            currentLevel = itemIlvl;
        }
        
        // Get the current list from stack top for counter and levelDef
        const currentOpenList = listStack[listStack.length - 1];
        const currentListLevelDef = currentOpenList.abstractNum.levels.find(l => l.level === currentOpenList.ilvl);

        html += this._convertListItemToHtml(paragraph, currentListLevelDef, currentOpenList.counter);
        
        if (currentOpenList.tag === 'ol') {
            currentOpenList.counter++;
        }
    }

    // Close any remaining open lists
    while (listStack.length > 0) {
        const openList = listStack.pop();
        html += `</${openList.tag}>`;
    }
    return html;
};

/**
 * Converts a single list item paragraph to an HTML <li> string.
 *
 * @param {object} paragraph - The enhanced ParagraphSchema object for the list item.
 * @param {object} numberingLevelSchema - The NumberingLevelSchema for this item.
 * @param {number} currentCounter - The current counter for ordered lists (1-based).
 * @returns {string} HTML string for the <li> element.
 * @private
 */
HtmlConverter.prototype._convertListItemToHtml = function(paragraph, numberingLevelSchema, currentCounter) {
    // Paragraph styling will be applied to the <p> tag inside <li>
    // List item specific styling (from numberingLevelSchema.paragraphProperties) could be applied to <li>
    // For now, we let the paragraph's own resolved properties handle most of its appearance.
    
    const markerHtml = this._generateListMarkerHtml(numberingLevelSchema, currentCounter);
    
    // Convert paragraph content (runs) without the outer <p> tag's styling or marker
    // The paragraph's own <p> tag will be rendered by _convertParagraphToHtml
    // We need to ensure _convertParagraphToHtml doesn't re-add a marker if called in this context.
    // For now, we'll call _convertParagraphToHtml and it will render a <p> with its styles.
    // The marker is placed *before* this <p> tag, inside the <li>.

    // The paragraph already has its properties resolved by StyleEnhancer.
    // We don't want the default _convertParagraphToHtml to add its own basic numbering prefix.
    const paragraphHtmlContent = this._convertParagraphToHtml(paragraph, true); // Pass a flag to indicate it's a list item


    // Basic li styling: remove default markers, let our span handle it.
    // Some list-specific indentation from numberingLevelSchema.paragraphProperties might be applied here.
    let liStyles = ['list-style-type: none;']; // Disable default browser markers
    
    // Apply paragraph properties from numbering level to the <li> if they exist
    // This is tricky because paragraph.properties already includes these.
    // However, some properties like specific indentations for the list item itself
    // might be best applied to the <li>.
    // For now, this is simplified. The paragraph's own styles are primary.
    // const levelParaCss = convertParagraphPropertiesToCss(numberingLevelSchema.paragraphProperties);
    // if (levelParaCss) liStyles.push(levelParaCss);


    return `<li style="${liStyles.join(' ')}">${markerHtml}${paragraphHtmlContent}</li>`;
};


/**
 * Generates the HTML for the list marker (bullet or number).
 *
 * @param {object} numberingLevelSchema - The NumberingLevelSchema for this item.
 * @param {number} currentCounter - The current counter for ordered lists (1-based).
 * @returns {string} HTML string for the marker (e.g., <span class="list-marker">...</span>).
 * @private
 */
HtmlConverter.prototype._generateListMarkerHtml = function(numberingLevelSchema, currentCounter) {
    let markerText = '';
    const format = numberingLevelSchema.format || 'decimal';
    const lvlText = numberingLevelSchema.text || '%1.'; // Default to '%1.' if not specified

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
            break;
        // Add more cases for other formats like 'cardinalText', 'ordinalText', etc.
        default: // Includes 'bullet' if lvlText is not just the bullet char, or other unknown formats
            // For bullet types or specific text, lvlText might not use %1.
            // If lvlText contains %1, %2, etc., replace them.
            // For simplicity, we assume %N refers to the counter for level N (1-indexed).
            // Here, currentCounter is for the current level.
            // The spec says %X refers to level X (1-indexed). So %1 is level 0's counter, %2 is level 1's.
            // This simple replacement assumes lvlText uses %1 for the current level's counter.
            // A more robust solution would need to track counters for all levels in the hierarchy.
            markerText = lvlText.replace(`%${numberingLevelSchema.level + 1}`, counterStr);
            break;
    }
    
    // If markerText wasn't directly assigned (e.g. for bullet format), it means we used counterStr
    if (format !== 'bullet') {
         markerText = lvlText.replace(`%${numberingLevelSchema.level + 1}`, counterStr);
    }
    // If after replacement, it's still like "%X", it means the format was complex or not %1.
    // Or if it was a bullet and lvlText was empty, provide a default bullet.
    if (markerText.startsWith('%') || (format === 'bullet' && !markerText)) {
        markerText = (format === 'bullet' || !markerText) ? '•' : counterStr; // Default bullet or just counter
    }


    const { css: markerCss, wrapTags } = convertRunPropertiesToCss(numberingLevelSchema.runProperties);
    // Basic marker styling for positioning.
    const finalMarkerCss = `display: inline-block; margin-right: 0.25em; ${markerCss}`;

    let content = `<span class="list-marker" style="${finalMarkerCss}">${escapeHtml(markerText)}</span>`;
    if (wrapTags.open || wrapTags.close) {
        content = `${wrapTags.open}${content}${wrapTags.close}`;
    }
    return content;
};
