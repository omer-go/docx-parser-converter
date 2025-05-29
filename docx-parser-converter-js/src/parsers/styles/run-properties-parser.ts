// src/parsers/styles/run-properties-parser.ts
import {
  RunProperties,
  UnderlineEnum,
  ScriptEnum,
  EmphasisMarkEnum,
} from '../../models/styles-models';
import { parseValAttribute, parseOnOffProperty } from '../helpers/common-helpers';
import { getElement, getAttribute } from '../../utils/xml-utils';

export function parseRunProperties(rPrNode: any): RunProperties | undefined {
  if (!rPrNode || typeof rPrNode !== 'object' || Object.keys(rPrNode).length === 0) {
    return undefined;
  }

  const props: RunProperties = {};

  // Font name
  const rFontsNode = getElement(rPrNode, 'w:rFonts');
  if (rFontsNode) {
    // Prioritize 'ascii', then 'hAnsi', then 'cs'. EastAsia can be stored separately if needed or handled by a more complex logic.
    props.name = getAttribute(rFontsNode, 'w:ascii') || 
                 getAttribute(rFontsNode, 'w:hAnsi') || 
                 getAttribute(rFontsNode, 'w:cs') ||
                 getAttribute(rFontsNode, 'w:eastAsia'); // Added eastAsia as fallback
  }

  // Size (in half-points)
  const sz = parseValAttribute(rPrNode, 'w:sz');
  if (sz) props.size = parseInt(sz, 10);

  // Color
  const color = parseValAttribute(rPrNode, 'w:color');
  if (color) props.color = color;

  // Bold
  const bold = parseOnOffProperty(rPrNode, 'w:b');
  if (bold !== undefined) props.bold = bold;

  // Italic
  const italic = parseOnOffProperty(rPrNode, 'w:i');
  if (italic !== undefined) props.italic = italic;

  // Underline
  const u = parseValAttribute(rPrNode, 'w:u');
  if (u && UnderlineEnum.safeParse(u).success) {
    props.underline = u as RunProperties['underline'];
  }

  // Strikethrough
  const strike = parseOnOffProperty(rPrNode, 'w:strike');
  if (strike !== undefined) props.strikethrough = strike;
  
  // Double Strikethrough
  const dstrike = parseOnOffProperty(rPrNode, 'w:dstrike');
  if (dstrike !== undefined) props.doubleStrikethrough = dstrike;

  // Small Caps
  const smallCaps = parseOnOffProperty(rPrNode, 'w:smallCaps');
  if (smallCaps !== undefined) props.smallCaps = smallCaps;

  // Capitalized (Caps)
  const caps = parseOnOffProperty(rPrNode, 'w:caps');
  if (caps !== undefined) props.capitalized = caps;
  
  // Highlight
  const highlight = parseValAttribute(rPrNode, 'w:highlight');
  if (highlight) props.highlight = highlight;

  // Vertical Align (Superscript/Subscript)
  const vertAlign = parseValAttribute(rPrNode, 'w:vertAlign');
  if (vertAlign && ScriptEnum.safeParse(vertAlign).success) {
    props.verticalAlign = vertAlign as RunProperties['verticalAlign'];
  }
  
  // Kerning (font kerning size in half-points)
  const kern = parseValAttribute(rPrNode, 'w:kern');
  if (kern) props.kerning = parseInt(kern, 10);

  // Spacing (character spacing in twips)
  const spacing = parseValAttribute(rPrNode, 'w:spacing');
  if (spacing) props.spacing = parseInt(spacing, 10);
  
  // Language
  const langNode = getElement(rPrNode, 'w:lang');
  if (langNode) {
      props.language = getAttribute(langNode, 'w:val') || // Standard language
                       getAttribute(langNode, 'w:eastAsia') || // East Asian language
                       getAttribute(langNode, 'w:bidi'); // Bidirectional language
  }

  // Emphasis Mark
  const em = parseValAttribute(rPrNode, 'w:em');
  if (em && EmphasisMarkEnum.safeParse(em).success) {
    props.emphasisMark = em as RunProperties['emphasisMark'];
  }
  
  // TODO: Add other run properties like w:effect, w:position, w:textScale, w:shd (run shading), w:bdr (run border) etc.

  return Object.keys(props).length > 0 ? props : undefined;
}
