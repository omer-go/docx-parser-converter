/**
 * @file text_converter.js
 * @description Defines the TextConverter class for converting enhanced DocumentSchema to plain text.
 */

// Counter-to-string helpers (can be moved to a shared util if used by multiple converters)
function toAlphaLower(num) {
  let alpha = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    alpha = String.fromCharCode(97 + remainder) + alpha;
    num = Math.floor((num - 1) / 26);
  }
  return alpha;
}

function toAlphaUpper(num) {
  return toAlphaLower(num).toUpperCase();
}

const ROMAN_MAP = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
function toRomanLower(num) {
  if (num <= 0 || num >= 4000) return num.toString();
  let roman = '';
  for (const key in ROMAN_MAP) {
    while (num >= ROMAN_MAP[key]) {
      roman += key;
      num -= ROMAN_MAP[key];
    }
  }
  return roman.toLowerCase();
}

function toRomanUpper(num) {
    return toRomanLower(num).toUpperCase();
}


/**
 * The TextConverter class converts an enhanced DocumentSchema object
 * (output from StyleEnhancer) into a plain text string.
 */
export class TextConverter {
  /**
   * Constructs a TextConverter instance.
   * @param {object} options - Optional configuration for the converter.
   *                           - `lineWidth`: Maximum line width for attempting to wrap/center text. (Default: null, no wrapping)
   *                           - `listItemIndent`: String to use for indenting list items per level. (Default: "  ")
   *                           - `paragraphBreak`: String for breaks between paragraphs/tables. (Default: "\n\n")
   *                           - `listItemBreak`: String for breaks between list items in same list. (Default: "\n")
   */
  constructor(options = {}) {
    this.options = {
      lineWidth: null,
      listItemIndent: "  ",
      paragraphBreak: "\n\n",
      listItemBreak: "\n",
      ...options,
    };
  }

  /**
   * Converts the entire enhanced document schema to a plain text string.
   *
   * @param {object} documentSchema - The enhanced DocumentSchema object.
   * @returns {string} A plain text string representing the document.
   */
  convertToText(documentSchema) {
    if (!documentSchema || !documentSchema.elements) {
      console.error("TextConverter.convertToText: Invalid documentSchema object received.");
      return '';
    }

    const textParts = [];
    let currentListItems = [];
    let listCounters = {}; // To manage counters for different numIds and levels

    for (let i = 0; i < documentSchema.elements.length; i++) {
      const element = documentSchema.elements[i];
      const isListItem = element.type === 'paragraph' && element.properties?.numPr?.numId !== undefined;

      if (isListItem) {
        currentListItems.push(element);
      } else {
        if (currentListItems.length > 0) {
          textParts.push(this._convertListToText(currentListItems, documentSchema, listCounters));
          // After a list, there should be a paragraph break unless the next element is also a list (which it isn't here)
          textParts.push(this.options.paragraphBreak);
          currentListItems = [];
          // listCounters might persist or reset based on desired behavior for subsequent lists.
          // For now, let's assume they persist for the document lifetime unless explicitly reset by list logic.
        }
        
        switch (element.type) {
          case 'paragraph':
            textParts.push(this._convertParagraphToText(element));
            textParts.push(this.options.paragraphBreak);
            break;
          case 'table':
            textParts.push(this._convertTableToText(element));
            textParts.push(this.options.paragraphBreak);
            break;
          default:
            console.warn(`TextConverter.convertToText: Unknown element type '${element.type}'. Skipping.`);
            break;
        }
      }
    }

    // If the document ends with list items
    if (currentListItems.length > 0) {
      textParts.push(this._convertListToText(currentListItems, documentSchema, listCounters));
      textParts.push(this.options.paragraphBreak); // Add break after the final list
    }

    // Join all parts and normalize line endings (e.g., ensure single \n)
    // Trim trailing paragraph breaks for a cleaner end.
    let fullText = textParts.join('').replace(/(\r\n|\r)/g, '\n');
    if (fullText.endsWith(this.options.paragraphBreak)) {
        fullText = fullText.substring(0, fullText.length - this.options.paragraphBreak.length);
    }
    return fullText;
  }

  /**
   * Converts a ParagraphSchema object to a plain text string.
   *
   * @param {object} paragraph - The enhanced ParagraphSchema object.
   * @param {object} [listInfo=null] - Optional information if this paragraph is a list item.
   *                                   Example: { marker: '1. ', indent: '  ' }
   * @returns {string} A plain text string for the paragraph.
   * @private
   */
  _convertParagraphToText(paragraph, listInfo = null) {
    if (!paragraph || !paragraph.runs) {
      return '';
    }

    let text = paragraph.runs.map(run => run.text || '').join('');
    let prefix = '';

    // Handle indentation from paragraph properties
    // A simple heuristic: 3 spaces per 360 twips (approx 0.25 inch)
    const TWIPS_PER_INDENT_LEVEL = 360; // Define a standard indent unit
    const SPACES_PER_INDENT_LEVEL = 3;  // How many spaces per unit

    if (listInfo) {
      prefix += listInfo.indent || '';
      prefix += listInfo.marker || '';
    } else if (paragraph.properties?.ind) {
      // This indentation is applied if it's NOT a list item already handled by listInfo.indent
      // If it's a list item, its numPr defines indentation, not pPr.ind usually.
      // However, pPr.ind on a list item might provide *additional* indentation.
      // For now, assume listInfo.indent is comprehensive for list items.
      let indentSpaces = 0;
      if (paragraph.properties.ind.left?.val) {
        indentSpaces += Math.round(paragraph.properties.ind.left.val / TWIPS_PER_INDENT_LEVEL) * SPACES_PER_INDENT_LEVEL;
      }
      if (paragraph.properties.ind.firstLine?.val) {
        indentSpaces += Math.round(paragraph.properties.ind.firstLine.val / TWIPS_PER_INDENT_LEVEL) * SPACES_PER_INDENT_LEVEL;
      } else if (paragraph.properties.ind.hanging?.val) {
        // Hanging indent is complex. For plain text, often ignored or first line is NOT indented
        // while subsequent lines (if wrapped) would be.
        // This simple model doesn't handle line wrapping based on text content here.
      }
      prefix += " ".repeat(Math.max(0, indentSpaces));
    }
    
    text = prefix + text;

    // Handle alignment (very basic, if lineWidth is provided)
    if (this.options.lineWidth && paragraph.properties?.jc) {
        if (paragraph.properties.jc === 'center') {
            const padding = Math.max(0, Math.floor((this.options.lineWidth - text.length) / 2));
            text = " ".repeat(padding) + text;
        } else if (paragraph.properties.jc === 'right') {
            const padding = Math.max(0, this.options.lineWidth - text.length);
            text = " ".repeat(padding) + text;
        }
    }
    // Justify is not handled for plain text.

    return text;
  }

  /**
   * Converts a sequence of list item paragraphs to plain text.
   * @param {Array<object>} listParagraphs - Array of consecutive ParagraphSchema objects.
   * @param {object} documentSchema - The full DocumentSchema.
   * @param {object} listCounters - Persistent counters object.
   * @returns {string} Plain text string for the list.
   * @private
   */
  _convertListToText(listParagraphs, documentSchema, listCounters) {
    if (!listParagraphs || listParagraphs.length === 0) return '';

    const listParts = [];
    // More sophisticated counter management: { [numId_ilvl]: counter }
    // For simplicity, let's use a simpler approach if nesting isn't deep or complex.
    // Reset/manage counters based on numId and ilvl changes.
    // This is a placeholder for a more robust list tracking mechanism.
    // For now, we'll manage counters more locally within this function for one pass.
    
    let currentNumId = null;
    let levelCounters = {}; // Tracks counter for each level of the current numId: { [ilvl]: counter }


    for (let i = 0; i < listParagraphs.length; i++) {
      const paragraph = listParagraphs[i];
      const numPr = paragraph.properties?.numPr;

      if (!numPr || numPr.numId === undefined || numPr.ilvl === undefined) {
        // Should not happen if called correctly from convertToText
        listParts.push(this._convertParagraphToText(paragraph) + this.options.paragraphBreak);
        continue;
      }

      const itemNumId = parseInt(numPr.numId, 10);
      const itemIlvl = parseInt(numPr.ilvl, 10);

      // Find numbering definitions
      const numInstance = documentSchema.numberingDefinitions?.numInstances.find(inst => inst.numId === itemNumId);
      if (!numInstance) {
        listParts.push(this._convertParagraphToText(paragraph) + this.options.listItemBreak); // Fallback
        continue;
      }
      const abstractNum = documentSchema.numberingDefinitions?.abstractNums.find(
        abs => abs.abstractNumId === numInstance.abstractNumId
      );
      if (!abstractNum) {
        listParts.push(this._convertParagraphToText(paragraph) + this.options.listItemBreak); // Fallback
        continue;
      }
      const levelDef = abstractNum.levels.find(l => l.level === itemIlvl);
      if (!levelDef) {
        listParts.push(this._convertParagraphToText(paragraph) + this.options.listItemBreak); // Fallback
        continue;
      }
      
      // Reset counters if numId changes or if moving to a higher level in the same list
      if (currentNumId !== itemNumId) {
          currentNumId = itemNumId;
          levelCounters = {}; // Reset for new list definition
      }
      // Reset counters for deeper levels if we are moving up then down
      for (const lvl in levelCounters) {
          if (parseInt(lvl) > itemIlvl) {
              delete levelCounters[lvl];
          }
      }


      const startValue = levelDef.start !== undefined ? levelDef.start : 1;
      if (levelCounters[itemIlvl] === undefined) {
          levelCounters[itemIlvl] = startValue;
      }
      
      const currentCounter = levelCounters[itemIlvl];
      const marker = this._generateListMarkerText(levelDef, currentCounter, abstractNum, levelCounters);
      
      const indent = this.options.listItemIndent.repeat(itemIlvl);
      
      listParts.push(this._convertParagraphToText(paragraph, { marker, indent }));
      
      levelCounters[itemIlvl]++;

      if (i < listParagraphs.length - 1) {
          listParts.push(this.options.listItemBreak);
      }
    }
    return listParts.join('');
  }

  /**
   * Generates the text for the list marker.
   * @param {object} numberingLevelSchema - The NumberingLevelSchema for this item.
   * @param {number} currentCounter - The current counter for this level.
   * @param {object} abstractNumSchema - The parent AbstractNumberingSchema.
   * @param {object} levelCounters - Object holding counters for all active levels of current list.
   * @returns {string} The marker string.
   * @private
   */
  _generateListMarkerText(numberingLevelSchema, currentCounter, abstractNumSchema, levelCounters) {
    let markerText = '';
    const format = numberingLevelSchema.format || 'decimal';
    // lvlText from XML, e.g., "%1.%2." or "•"
    let lvlTextFormat = numberingLevelSchema.text || `%${numberingLevelSchema.level + 1}.`;


    // Replace placeholders like %1, %2, ... %N with actual counter values for those levels
    // N corresponds to level index + 1.
    for (let i = 0; i <= numberingLevelSchema.level; i++) {
        const placeholder = `%${i + 1}`;
        if (lvlTextFormat.includes(placeholder)) {
            const levelDefForPlaceholder = abstractNumSchema.levels.find(l => l.level === i);
            const counterForLevel = levelCounters[i] !== undefined ? levelCounters[i] : (levelDefForPlaceholder?.start || 1);
            let counterStrSegment = counterForLevel.toString();

            // Use the format defined for *that specific level* (level 'i')
            const formatForLevelI = levelDefForPlaceholder?.format || 'decimal';
            switch (formatForLevelI) {
                case 'decimal': break; // Default
                case 'lowerLetter': counterStrSegment = toAlphaLower(counterForLevel); break;
                case 'upperLetter': counterStrSegment = toAlphaUpper(counterForLevel); break;
                case 'lowerRoman': counterStrSegment = toRomanLower(counterForLevel); break;
                case 'upperRoman': counterStrSegment = toRomanUpper(counterForLevel); break;
                case 'bullet': counterStrSegment = levelDefForPlaceholder?.text || '•'; break; // Use bullet char from its level's lvlText
                // Other formats like cardinalText, ordinalText, etc. are complex
                default: counterStrSegment = levelDefForPlaceholder?.text || counterStrSegment; break; 
            }
            lvlTextFormat = lvlTextFormat.replace(placeholder, counterStrSegment);
        }
    }
    
    markerText = lvlTextFormat;

    // If after all replacements, it's still just a placeholder (e.g. %N for a level not yet counted)
    // or if it's a bullet format that didn't resolve to a char in lvlTextFormat, use a default.
    if (markerText.startsWith('%') || (format === 'bullet' && markerText === `%${numberingLevelSchema.level + 1}`)) {
      markerText = (format === 'bullet') ? '•' : currentCounter.toString(); // Fallback
    }

    return markerText + " "; // Add a trailing space for separation
  }

  /**
   * Converts a TableSchema object to plain text.
   * Placeholder implementation.
   * @param {object} table - The enhanced TableSchema object.
   * @returns {string} A plain text representation of the table.
   * @private
   */
  _convertTableToText(table, documentSchema) {
    if (!table || !table.rows) {
      return '[Table data missing]';
    }

    const processedRows = [];
    let maxCols = 0;
    if (table.grid && table.grid.length > 0) {
        maxCols = table.grid.length;
    } else if (table.rows.length > 0) {
        // Estimate maxCols from the first row if no grid info (less reliable for colspans)
        table.rows[0].cells.forEach(cell => {
            maxCols += cell.properties?.gridSpan || 1;
        });
    }


    // For simplicity, calculate max content width for each column (basic approach)
    const colWidths = new Array(maxCols).fill(0);

    table.rows.forEach(row => {
      let currentCol = 0;
      row.cells.forEach(cell => {
        const cellText = this._convertCellElementsToText(cell.elements, documentSchema);
        const lines = cellText.split('\n');
        const cellWidth = Math.max(...lines.map(line => line.length));
        
        const gridSpan = cell.properties?.gridSpan || 1;
        for (let i = 0; i < gridSpan && (currentCol + i) < maxCols; i++) {
          // Distribute width for spanned cells approximately or assign to first col in span
          if (i === 0) { // Assign full width to the first column of the span for simplicity
             colWidths[currentCol + i] = Math.max(colWidths[currentCol + i] || 0, cellWidth);
          }
        }
        currentCol += gridSpan;
      });
    });
    
    // Fallback if colWidths are still zero (e.g. empty table)
    for(let i=0; i<colWidths.length; ++i) {
        if(colWidths[i] === 0) colWidths[i] = 10; // Default min width
    }


    // Generate row strings with padding
    table.rows.forEach(row => {
      const rowCellTexts = [];
      let currentCol = 0;
      row.cells.forEach(cell => {
        const cellText = this._convertCellElementsToText(cell.elements, documentSchema);
        const lines = cellText.split('\n');
        const gridSpan = cell.properties?.gridSpan || 1;
        
        let effectiveCellWidth = 0;
        for (let i = 0; i < gridSpan && (currentCol + i) < maxCols; i++) {
          effectiveCellWidth += colWidths[currentCol + i];
          if (i > 0) effectiveCellWidth += 3; // for " | " separators between spanned columns
        }

        // Pad each line of the cell text to the effectiveCellWidth
        const paddedLines = lines.map(line => line.padEnd(effectiveCellWidth - (lines.length > 1 && line === lines[lines.length-1] ? 1:0) ) ); // a bit hacky for last line padding
        rowCellTexts.push(paddedLines.join('\n')); // Rejoin if multiline, already padded
        currentCol += gridSpan;
      });
      processedRows.push(rowCellTexts.join(' | '));
    });

    const horizontalBorder = colWidths.map(w => '-'.repeat(w)).join('-|-') + (colWidths.length > 0 ? '-' : '');
    
    let tableText = horizontalBorder + '\n';
    tableText += processedRows.join('\n' + horizontalBorder + '\n');
    tableText += '\n' + horizontalBorder;

    return tableText;
  }

  /**
   * Converts elements within a table cell to plain text.
   * Uses modified options for breaks and indentation.
   * @param {Array<object>} elements - Array of elements within the cell.
   * @param {object} documentSchema - The full DocumentSchema.
   * @returns {string} Plain text string for the cell content.
   * @private
   */
  _convertCellElementsToText(elements, documentSchema) {
    const cellTextParts = [];
    const originalOptions = { ...this.options };
    
    // Modify options for cell content: single newline for paragraph breaks, minimal list indent
    this.options.paragraphBreak = "\n"; 
    this.options.listItemIndent = " "; // Minimal indent inside cell

    let currentListItems = [];
    let listCounters = {}; // Cell-specific list counters

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const isListItem = element.type === 'paragraph' && element.properties?.numPr?.numId !== undefined;

      if (isListItem) {
        currentListItems.push(element);
      } else {
        if (currentListItems.length > 0) {
          cellTextParts.push(this._convertListToText(currentListItems, documentSchema, listCounters));
          cellTextParts.push(this.options.listItemBreak); // Use listItemBreak after list within cell
          currentListItems = [];
        }
        
        switch (element.type) {
          case 'paragraph':
            cellTextParts.push(this._convertParagraphToText(element));
            // paragraphBreak (now '\n') will be added by the calling loop if needed
            break;
          case 'table': // Nested table
            cellTextParts.push(this._convertTableToText(element, documentSchema));
            break;
          // No default case for unknown type, just skip
        }
      }
       // Add a newline after each element within a cell if it's not the last one,
       // or if it's a list that just finished.
      if (i < elements.length - 1 && !isListItem) { // Avoid double newlines if next is list item handled by list logic
          if (elements[i+1].type === 'paragraph' && elements[i+1].properties?.numPr?.numId === undefined ) { // If next is normal para
             cellTextParts.push("\n");
          }
      } else if (isListItem && (i === elements.length -1 || elements[i+1].properties?.numPr?.numId === undefined)){
          // If current is list item and it's the last or next is not a list item
          // The list conversion already adds listItemBreak between items.
      }
    }
     // If the cell ends with list items
    if (currentListItems.length > 0) {
      cellTextParts.push(this._convertListToText(currentListItems, documentSchema, listCounters));
    }

    // Restore original options
    this.options = originalOptions;
    
    // Join parts. If a part already ends with \n (from list processing), don't add another.
    return cellTextParts.map(p => p.trimEnd()).join('\n').replace(/\n+/g, '\n');
  }
}

// Example Usage (Conceptual)
// import { DocumentParser } from '../parsers/document_parser.js';
// import { StylesParser } from '../parsers/styles_parser.js';
// import { NumberingParser } from '../parsers/numbering_parser.js';
// import { StyleEnhancer } from '../enhancers/style_enhancer.js';

// async function processDocxToText(docxBuffer) {
//   const stylesParser = new StylesParser(docxBuffer);
//   const numberingParser = new NumberingParser(docxBuffer);
//   const docParser = new DocumentParser(docxBuffer); // Assuming setup

//   const styles = await stylesParser.getStylesSchema();
//   const numbering = await numberingParser.getNumberingDefinitions();
//   const initialDocument = await docParser.parse();

//   const enhancer = new StyleEnhancer(styles, numbering);
//   const enhancedDocument = enhancer.enhanceDocument(initialDocument);

//   const textConverter = new TextConverter({ lineWidth: 80 });
//   const plainText = textConverter.convertToText(enhancedDocument);
//   console.log(plainText);
// }
