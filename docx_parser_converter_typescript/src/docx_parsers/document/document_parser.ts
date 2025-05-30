import { XMLParser } from 'fast-xml-parser';
import {
  DocumentModel,
  ParagraphModel,
  TableModel,
  DocMarginsModel, // For typing clarity
} from '../../models/index';
import { parseParagraph } from './paragraph_parser';
import { parseTable } from '../tables/tables_parser';
import { parseMargins } from './margins_parser';
import { DEFAULT_ATTRIBUTES_GROUP_NAME } from '../../helpers/common_helpers';

/**
 * Helper to ensure an element is an array for easier iteration.
 * (Though preserveOrder:true with tagsOrderSymbol should make this less necessary for direct children of body)
 * @param item The item to ensure is an array.
 * @returns An array, either the item itself if it's an array, a new array containing the item, or an empty array if the item is null/undefined.
 */
const ensureArray = (item: any): any[] => {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  return [item];
};

/**
 * Parses the main document.xml file content from a DOCX document.
 * @param xmlString The string content of document.xml.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @param preserveOrderElementName The key used by fast-xml-parser for the array of ordered child elements.
 * @returns A DocumentModel object or undefined if parsing fails or input is invalid.
 */
export function parseDocumentXml(
  xmlString: string,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME,
  preserveOrderElementName: string = "$$" // Default to "$$" for ordered elements
): DocumentModel | undefined {
  if (!xmlString) {
    console.error("XML string is empty. Cannot parse document.");
    return undefined;
  }

  const parserOptions = {
    // attributeNamePrefix: attributesGroupName, // This is incorrect for grouping
    attributesGroupName: attributesGroupName, // Correct way to group attributes
    ignoreAttributes: false,
    parseTagValue: false,
    parseAttributeValue: false,
    allowBooleanAttributes: true,
    trimValues: true,
    preserveOrder: true, // Crucial for document content order
    tagsOrderSymbol: preserveOrderElementName, // The symbol for ordered elements array
    textNodeName: "#text", // Consistent text node access
    isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
      // With preserveOrder:true at the root, tagsOrderSymbol handles direct children of body.
      // This might be useful for specific nested tags if they aren't consistently arrays
      // and preserveOrder isn't applied deeper by default (which it usually is).
      return false;
    }
  };

  let docXmlObject: any;
  try {
    const parser = new XMLParser(parserOptions);
    docXmlObject = parser.parse(xmlString);
  } catch (error) {
    console.error("Error parsing document.xml string:", error);
    return undefined;
  }

  const wDocument = docXmlObject['w:document'];
  if (!wDocument) {
    console.error("No <w:document> root element found in XML.");
    return undefined;
  }

  const wBody = wDocument['w:body'];
  if (!wBody) {
    console.error("No <w:body> element found in <w:document>.");
    return undefined;
  }

  const elements: (ParagraphModel | TableModel)[] = [];
  let docMargins: DocMarginsModel | undefined = undefined;

  const orderedBodyChildren = wBody[preserveOrderElementName];

  if (Array.isArray(orderedBodyChildren)) {
    for (const childWrapper of orderedBodyChildren) {
      const tagName = Object.keys(childWrapper)[0];
      const childElement = childWrapper[tagName];

      if (tagName === 'w:p') {
        const paragraph = parseParagraph(childElement, attributesGroupName, preserveOrderElementName);
        if (paragraph) {
          elements.push(paragraph);
        }
      } else if (tagName === 'w:tbl') {
        const table = parseTable(childElement, attributesGroupName, preserveOrderElementName);
        if (table) {
          elements.push(table);
        }
      } else if (tagName === 'w:sectPr') {
        if (!docMargins) {
             docMargins = parseMargins(childElement, attributesGroupName);
        }
      }
    }
  } else {
      console.warn("Document body children order not preserved or no children array found. Parsing 'w:p' and 'w:tbl' by direct access (order may be lost). Body Element:", wBody);
      const paragraphElements = ensureArray(wBody['w:p']);
      for (const pEl of paragraphElements) {
          const paragraph = parseParagraph(pEl, attributesGroupName, preserveOrderElementName);
          if (paragraph) elements.push(paragraph);
      }
      const tableElements = ensureArray(wBody['w:tbl']);
      for (const tblEl of tableElements) {
          const table = parseTable(tblEl, attributesGroupName, preserveOrderElementName);
          if (table) elements.push(table);
      }
      if (!docMargins && wBody['w:sectPr']) {
          const sectPrElements = ensureArray(wBody['w:sectPr']);
          if (sectPrElements.length > 0) {
            docMargins = parseMargins(sectPrElements[sectPrElements.length -1 ], attributesGroupName);
          }
      }
  }

  // If docMargins still not found (e.g. sectPr was not a direct child of body in ordered list or direct access)
  // some documents might place it inside the last paragraph's pPr, which is unusual for whole-doc margins.
  // This parser assumes sectPr for document margins is a child of w:body.

  try {
    return DocumentModel.parse({ elements, docMargins });
  } catch (error) {
    console.error("Error parsing DocumentModel:", error, "Parsed elements count:", elements.length, "Parsed docMargins:", docMargins);
    return undefined;
  }
}
