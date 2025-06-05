import { NAMESPACE } from '../helpers/commonHelpers';
import { extractXmlRootFromDocx, extractXmlRootFromString } from '../utils';
import type { Paragraph } from '../models/paragraphModels';
import type { Table } from '../models/tableModels';
import type { DocumentSchema, DocMargins } from '../models/documentModels';
import { MarginsParser } from './marginsParser';
import { ParagraphParser } from './paragraphParser';
import { TablesParser } from '../tabels/tablesParser';

/**
 * Parses the main document.xml part of a DOCX file.
 *
 * This class handles the extraction and parsing of the document.xml file
 * within a DOCX file, converting it into a structured DocumentSchema.
 */
export class DocumentParser {
  root: Element | null;
  documentSchema: DocumentSchema | null;

  /**
   * Initializes the DocumentParser with the given DOCX file or document XML content.
   *
   * @param source Either the binary content of the DOCX file or the document.xml content as a string.
   */
  constructor(source?: Uint8Array | ArrayBuffer | string) {
    if (source) {
      if (typeof source === 'string') {
        this.root = extractXmlRootFromString(source);
      } else {
        // Uint8Array or ArrayBuffer
        // Note: extractXmlRootFromDocx is async, so this must be handled outside constructor if needed
        throw new Error('Use DocumentParser.initFromDocx for async DOCX parsing.');
      }
      this.documentSchema = this.parse();
    } else {
      this.root = null;
      this.documentSchema = null;
    }
  }

  /**
   * Async factory for DOCX binary input.
   */
  static async initFromDocx(docxContent: Uint8Array | ArrayBuffer): Promise<DocumentParser> {
    const parser = new DocumentParser();
    parser.root = await extractXmlRootFromDocx(docxContent, 'document.xml');
    parser.documentSchema = parser.parse();
    return parser;
  }

  /**
   * Parses the document XML into a DocumentSchema.
   */
  parse(): DocumentSchema {
    const elements = this.extractElements();
    const docMargins = this.extractMargins();
    return { elements, docMargins };
  }

  /**
   * Extracts elements (paragraphs and tables) from the document XML.
   */
  extractElements(): (Paragraph | Table)[] {
    if (!this.root) return [];
    const elements: (Paragraph | Table)[] = [];
    const paragraphParser = new ParagraphParser();
    // Find the <w:body> element
    const body = this.root.getElementsByTagNameNS(NAMESPACE.w, 'body')[0];
    if (!body) return elements;
    for (let i = 0; i < body.childNodes.length; i++) {
      const child = body.childNodes[i];
      if (!(child instanceof Element)) continue;
      if (child.localName === 'p') {
        elements.push(paragraphParser.parse(child));
      } else if (child.localName === 'tbl') {
        const tablesParser = new TablesParser(child);
        elements.push(tablesParser.parse());
      }
    }
    return elements;
  }

  /**
   * Extracts margins from the document XML.
   */
  extractMargins(): DocMargins | undefined {
    if (!this.root) return undefined;
    const body = this.root.getElementsByTagNameNS(NAMESPACE.w, 'body')[0];
    if (!body) return undefined;
    // Find the first <w:sectPr> inside <w:body>
    for (let i = 0; i < body.childNodes.length; i++) {
      const child = body.childNodes[i];
      if (child instanceof Element && child.localName === 'sectPr') {
        return MarginsParser.parse(child) || undefined;
      }
    }
    return undefined;
  }

  /**
   * Gets the parsed document schema.
   */
  getDocumentSchema(): DocumentSchema | null {
    return this.documentSchema;
  }
} 