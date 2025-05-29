// src/parsers/document/run-parser.ts
import { TextRun } from '../../models/paragraph-models';
import { parseRunProperties } from '../styles/run-properties-parser';
import { getElement, getElements, getChildElementText } from '../../utils/xml-utils'; // getChildElementText might not be needed if accessing #text directly

export function parseTextRun(rNode: any): TextRun | null {
  if (!rNode || typeof rNode !== 'object' || Object.keys(rNode).length === 0) {
    return null;
  }

  const rPrNode = getElement(rNode, 'w:rPr');
  const parsedRunProperties = rPrNode ? parseRunProperties(rPrNode) : undefined;

  let extractedText = "";

  // Extract from <w:t> elements
  const tElements = getElements(rNode, 'w:t');
  for (const tNode of tElements) {
    // fast-xml-parser with textNodeName: '#text' gives { '#text': 'content' }
    // or if attributes exist, { attr: 'val', '#text': 'content' }
    let textContent = '';
    if (typeof tNode === 'object' && tNode !== null && tNode['#text'] !== undefined) {
      textContent = String(tNode['#text']);
      // Handle xml:space="preserve" - fast-xml-parser's trimValues might have already trimmed.
      // If xml:space="preserve" is critical, trimValues should be false, or a custom text extractor is needed.
      // For now, we assume text is as provided by parser after its trim settings.
      // If tNode.xml_space === "preserve" (or tNode['xml:space']), then don't trim.
      // This requires attribute parsing to be configured to not strip 'xml:' prefix,
      // or use the exact attribute name as parsed.
      // Assuming attributeNamePrefix: '' in parser, it would be tNode['xml:space'].
      // This detail might need refinement based on actual parser output for attributes with colons.
    } else if (typeof tNode === 'string') { 
      // This case might occur if a w:t element has no attributes and parseTagValue: true was set for it.
      // However, our current global config is parseTagValue: false.
      textContent = tNode;
    }
    extractedText += textContent;
  }

  // Extract from <w:instrText> elements (simple text from field codes)
  const instrTextElements = getElements(rNode, 'w:instrText');
  for (const instrNode of instrTextElements) {
     let textContent = '';
    if (typeof instrNode === 'object' && instrNode !== null && instrNode['#text'] !== undefined) {
      textContent = String(instrNode['#text']);
    } else if (typeof instrNode === 'string') {
      textContent = instrNode;
    }
    extractedText += textContent;
  }
  
  // TODO: Handle other text-containing elements like w:delText, w:sym, w:cr, w:tab etc.
  // For now, w:br is not handled here; it's a structural element at paragraph content level.

  if (extractedText === "") {
    // If a run has properties but no text (e.g. <w:r><w:rPr><w:b/></w:rPr></w:r>),
    // it might be a formatting mark for an empty space.
    // For now, we return null if there's no visible text.
    // This behavior can be changed if needed (e.g., to return TextRun with empty string if it has properties).
    // However, other elements like <w:br/>, <w:tab/>, drawings are expected to be separate elements, not TextRuns.
    // If we only found an rPr but no text, it's not a TextRun.
    // Let's check if there were any text-producing children at all.
    // If tElements or instrTextElements were empty, and no other text sources, then no text.
    if (tElements.length === 0 && instrTextElements.length === 0) {
        // Consider if there are other children like <w:drawing/> that mean this isn't a "text" run.
        // For now, simple: if no text, return null.
        return null;
    }
  }

  return {
    type: 'textRun',
    text: extractedText,
    properties: parsedRunProperties, // This can be undefined
  };
}
