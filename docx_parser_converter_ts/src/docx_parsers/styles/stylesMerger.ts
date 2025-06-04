import type { DocumentSchema } from '../models/documentModels';
import type { StylesSchema, Style } from '../models/stylesModels';
import type { NumberingSchema } from '../models/numberingModels';
import type { Paragraph } from '../models/paragraphModels';
import type { Table } from '../models/tableModels';
import { mergeProperties, readBinaryFromFilePath, deepMergeBasePreserves } from '../utils';
// Example usage dependencies (for Node.js CLI/testing only)
import { StylesParser } from './stylesParser';
import { DocumentParser } from '../document/documentParser';
import { NumberingParser } from '../numbering/numberingParser';
import * as path from 'path';

/**
 * A class to merge styles from styles.xml and numbering.xml into the document schema from document.xml.
 * This involves resolving based-on styles, applying numbering properties, and applying default properties.
 */
export class StylesMerger {
  documentSchema: DocumentSchema;
  stylesSchema: StylesSchema;
  numberingSchema: NumberingSchema;

  constructor(documentSchema: DocumentSchema, stylesSchema: StylesSchema, numberingSchema: NumberingSchema) {
    this.documentSchema = documentSchema;
    this.stylesSchema = stylesSchema;
    this.numberingSchema = numberingSchema;
    this.resolveBasedOnStyles();
    this.mergeStyles();
  }

  /**
   * Resolves styles that are based on other styles by merging their properties recursively.
   */
  private resolveBasedOnStyles(): void {
    for (const style of this.stylesSchema.styles) {
      let baseStyleId = style.basedOn;
      while (baseStyleId) {
        const baseStyle = this.findStyle(baseStyleId);
        if (!baseStyle) break;
        style.paragraphProperties = deepMergeBasePreserves(baseStyle.paragraphProperties, style.paragraphProperties) || {};
        style.runProperties = deepMergeBasePreserves(baseStyle.runProperties, style.runProperties) || {};
        baseStyleId = baseStyle.basedOn;
      }
    }
  }

  /**
   * Merges styles into the document schema (paragraphs and tables).
   */
  private mergeStyles(): void {
    for (const element of this.documentSchema.elements) {
      if (this.isParagraph(element)) {
        this.mergeParagraphStyles(element);
      } else if (this.isTable(element)) {
        for (const row of element.rows) {
          for (const cell of row.cells) {
            for (const paragraph of cell.paragraphs) {
              this.mergeParagraphStyles(paragraph);
            }
          }
        }
      }
    }
  }

  /**
   * Merges styles into a paragraph.
   */
  private mergeParagraphStyles(paragraph: Paragraph): void {
    if (paragraph.numbering) {
      this.applyNumberingProperties(paragraph);
    }
    this.applyStyleProperties(paragraph);
    this.applyDefaultProperties(paragraph);
  }

  /**
   * Applies numbering properties to a paragraph if it has numbering.
   */
  private applyNumberingProperties(paragraph: Paragraph): void {
    const numId = paragraph.numbering?.numId;
    const ilvl = paragraph.numbering?.ilvl;
    if (numId == null || ilvl == null) return;
    const numberingInstance = this.numberingSchema.instances.find(inst => inst.numId === numId);
    if (numberingInstance) {
      const numberingLevel = numberingInstance.levels.find(level => level.ilvl === ilvl);
      if (numberingLevel && numberingLevel.indent) {
        paragraph.properties = mergeProperties(paragraph.properties, { indent: numberingLevel.indent }) || paragraph.properties;
      }
    }
  }

  /**
   * Applies style properties to a paragraph if it has a styleId.
   */
  private applyStyleProperties(paragraph: Paragraph): void {
    const styleId = paragraph.properties.styleId;
    if (styleId) {
      const style = this.findStyle(styleId);
      if (style) {
        paragraph.properties = mergeProperties(paragraph.properties, style.paragraphProperties) || paragraph.properties;
        for (const run of paragraph.runs) {
          const merged = mergeProperties(run.properties, style.runProperties);
          if (merged && Object.keys(merged).length > 0) {
            run.properties = merged;
          } else {
            delete run.properties;
          }
        }
      }
    }
  }

  /**
   * Finds a style by its ID.
   */
  private findStyle(styleId: string | undefined): Style | undefined {
    if (!styleId) return undefined;
    return this.stylesSchema.styles.find(style => style.styleId === styleId);
  }

  /**
   * Applies default properties to a paragraph (default style and doc defaults).
   */
  private applyDefaultProperties(paragraph: Paragraph): void {
    // If no styleId, apply default paragraph style
    if (!paragraph.properties.styleId && this.stylesSchema.styleTypeDefaults.paragraph) {
      const defaultParagraphStyle = this.findStyle(this.stylesSchema.styleTypeDefaults.paragraph);
      if (defaultParagraphStyle) {
        paragraph.properties = deepMergeBasePreserves(defaultParagraphStyle.paragraphProperties, paragraph.properties) || paragraph.properties;
        for (const run of paragraph.runs) {
          const merged = deepMergeBasePreserves(defaultParagraphStyle.runProperties, run.properties);
          if (merged && Object.keys(merged).length > 0) {
            run.properties = merged;
          } else if (Object.keys(merged).length === 0 && run.properties && Object.keys(run.properties).length > 0) {
            // If merged is empty but run.properties was not, keep original run.properties
          } else {
            delete run.properties;
          }
        }
      }
    }
    // Always apply docDefaultsPpr to paragraph properties
    if (this.stylesSchema.docDefaultsPpr) {
      paragraph.properties = deepMergeBasePreserves(this.stylesSchema.docDefaultsPpr, paragraph.properties) || paragraph.properties;
    }
    
    // Restore the application of docDefaultsRpr for runs
    if (this.stylesSchema.docDefaultsRpr) {
      for (const run of paragraph.runs) {
        const merged = deepMergeBasePreserves(this.stylesSchema.docDefaultsRpr, run.properties);
        if (merged && Object.keys(merged).length > 0) {
          run.properties = merged;
        } else if (Object.keys(merged).length === 0 && run.properties && Object.keys(run.properties).length > 0) {
          // If merged is empty but run.properties was not, keep original run.properties
        } else {
          delete run.properties;
        }
      }
    }
  }

  public isParagraph(element: any): element is Paragraph {
    return 'properties' in element && 'runs' in element;
  }

  public isTable(element: any): element is Table {
    return 'rows' in element && Array.isArray(element.rows);
  }
}

// --- Example Usage Block (full parity with Python __main__) ---
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    const docxPath = path.resolve('C:/Users/omerh/Desktop/file-sample_1MB.docx');
    const docxFile = readBinaryFromFilePath(docxPath);

    const stylesParser = new StylesParser(docxFile);
    const stylesSchema = stylesParser.getStylesSchema();

    const documentParser = await DocumentParser.initFromDocx(docxFile);
    const documentSchema = documentParser.getDocumentSchema();

    const numberingParser = await NumberingParser.create(docxFile);
    const numberingSchema = numberingParser.getNumberingSchema();

    if (!stylesSchema || !documentSchema || !numberingSchema) {
      console.error('Failed to parse one or more schemas.');
      return;
    }

    const stylesMerger = new StylesMerger(documentSchema, stylesSchema, numberingSchema);

    // Print the properties of all table cells
    for (const element of documentSchema.elements) {
      if (stylesMerger.isTable(element)) {
        for (const row of element.rows) {
          for (const cell of row.cells) {
            // Print the cell as JSON, excluding undefined/null
            console.log('TableCell properties:');
            console.log(JSON.stringify(cell, (_, value) => (value === undefined ? undefined : value), 2));
          }
        }
      }
    }
    // Optionally, print the full filtered schema
    // console.log(JSON.stringify(documentSchema, (key, value) => (value === undefined ? undefined : value), 2));
  })();
} 