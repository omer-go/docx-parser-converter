import {
  extractElement,
  extractAttribute,
  extractBooleanAttribute,
  safeInt,
  // WORDML_NAMESPACE_PREFIX, // Not directly used as prefixes are part of keys
  DEFAULT_ATTRIBUTES_GROUP_NAME,
} from '../../helpers/common_helpers';
import {
  convertHalfPointsToPoints,
  convertTwipsToPoints,
} from '../../utils';
import {
  RunStylePropertiesModel,
  FontPropertiesModel,
  LanguagePropertiesModel,
  // Ensure other necessary models are imported if RunStylePropertiesModel is extended
} from '../../models/styles_models';

/**
 * Parses the <w:rPr> (Run Properties) element from DOCX XML.
 * @param rPrElement The <w:rPr> XML element object, or undefined.
 * @param attributesGroupName The key used by fast-xml-parser for the attributes group.
 * @returns A RunStylePropertiesModel object or undefined if no properties are found or input is invalid.
 */
export function parseRunProperties(
  rPrElement: any | undefined,
  attributesGroupName: string = DEFAULT_ATTRIBUTES_GROUP_NAME
): RunStylePropertiesModel | undefined {
  if (!rPrElement) {
    return undefined;
  }

  const props: Partial<RunStylePropertiesModel> = {};

  // Fonts (w:rFonts)
  const rFontsElement = extractElement(rPrElement, 'w:rFonts');
  if (rFontsElement) {
    const fontProps: Partial<FontPropertiesModel> = {};
    const ascii = extractAttribute(rFontsElement, 'w:ascii', attributesGroupName);
    const hAnsi = extractAttribute(rFontsElement, 'w:hAnsi', attributesGroupName);
    const eastAsia = extractAttribute(rFontsElement, 'w:eastAsia', attributesGroupName);
    const cs = extractAttribute(rFontsElement, 'w:cs', attributesGroupName);
    if (ascii) fontProps.ascii = ascii;
    if (hAnsi) fontProps.hAnsi = hAnsi;
    if (eastAsia) fontProps.eastAsia = eastAsia;
    if (cs) fontProps.cs = cs;
    if (Object.keys(fontProps).length > 0) {
      props.fonts = FontPropertiesModel.parse(fontProps);
    }
  }

  // Font Size (w:sz) - in half-points
  const szElement = extractElement(rPrElement, 'w:sz');
  if (szElement) {
    const val = extractAttribute(szElement, 'w:val', attributesGroupName);
    const sizeHalfPts = safeInt(val);
    if (sizeHalfPts !== undefined) {
      props.size_pt = convertHalfPointsToPoints(sizeHalfPts);
    }
  }
  // Consider w:szCs (complex script font size) if necessary

  // Color (w:color)
  const colorElement = extractElement(rPrElement, 'w:color');
  if (colorElement) {
    const val = extractAttribute(colorElement, 'w:val', attributesGroupName);
    if (val) props.color = val;
  }

  // Bold (w:b)
  const bElement = extractElement(rPrElement, 'w:b');
  if (bElement !== undefined) { // Check for presence of the element itself
    props.bold = extractBooleanAttribute(bElement, 'w:val', attributesGroupName);
  }


  // Italic (w:i)
  const iElement = extractElement(rPrElement, 'w:i');
  if (iElement !== undefined) {
    props.italic = extractBooleanAttribute(iElement, 'w:val', attributesGroupName);
  }

  // Underline (w:u)
  const uElement = extractElement(rPrElement, 'w:u');
  if (uElement) {
    const val = extractAttribute(uElement, 'w:val', attributesGroupName);
    if (val) props.underline = val;
  }

  // Strikethrough (w:strike and w:dstrike)
  const strikeElement = extractElement(rPrElement, 'w:strike');
  if (strikeElement !== undefined) {
    props.strike = extractBooleanAttribute(strikeElement, 'w:val', attributesGroupName);
  }
  const dstrikeElement = extractElement(rPrElement, 'w:dstrike');
  if (dstrikeElement !== undefined) {
     // If dstrike is present and true, it implies strike is also true
    if (extractBooleanAttribute(dstrikeElement, 'w:val', attributesGroupName)) {
        props.strike = true;
    }
  }

  // Hidden (w:vanish) - maps to RunStylePropertiesModel.hidden if such a field exists
  const vanishElement = extractElement(rPrElement, 'w:vanish');
  if (vanishElement !== undefined) {
    props.hidden = extractBooleanAttribute(vanishElement, 'w:val', attributesGroupName);
  }

  // Language (w:lang)
  const langElement = extractElement(rPrElement, 'w:lang');
  if (langElement) {
    const langProps: Partial<LanguagePropertiesModel> = {};
    const val = extractAttribute(langElement, 'w:val', attributesGroupName);
    const eastAsiaLang = extractAttribute(langElement, 'w:eastAsia', attributesGroupName);
    const bidiLang = extractAttribute(langElement, 'w:bidi', attributesGroupName);
    if (val) langProps.val = val;
    if (eastAsiaLang) langProps.eastAsia = eastAsiaLang;
    if (bidiLang) langProps.bidi = bidiLang;
    if (Object.keys(langProps).length > 0) {
      props.language = LanguagePropertiesModel.parse(langProps);
    }
  }

  // Highlight (w:highlight)
  const highlightElement = extractElement(rPrElement, 'w:highlight');
  if (highlightElement) {
    const val = extractAttribute(highlightElement, 'w:val', attributesGroupName);
    if (val) props.highlight = val;
  }

  // Shading (w:shd) - maps to RunStylePropertiesModel.shading_fill if such a field exists
  const shdElement = extractElement(rPrElement, 'w:shd');
  if (shdElement) {
    const fill = extractAttribute(shdElement, 'w:fill', attributesGroupName);
    const color = extractAttribute(shdElement, 'w:color', attributesGroupName);
    if (fill) props.shading_fill = fill;
    if (color) props.shading_color = color; // Assuming shading_color field
  }

  // Vertical Alignment / Text Position (w:vertAlign or w:position)
  const vertAlignElement = extractElement(rPrElement, 'w:vertAlign');
  if (vertAlignElement) {
      const val = extractAttribute(vertAlignElement, 'w:val', attributesGroupName);
      if (val) props.vert_align = val; // e.g., "superscript", "subscript", "baseline"
  }

  const positionElement = extractElement(rPrElement, 'w:position');
  if (positionElement) {
    const val = extractAttribute(positionElement, 'w:val', attributesGroupName);
    const posHalfPts = safeInt(val);
    if (posHalfPts !== undefined) {
      props.position_pt = convertHalfPointsToPoints(posHalfPts);
    }
  }

  // Kerning (w:kern) - in half-points
  const kernElement = extractElement(rPrElement, 'w:kern');
  if (kernElement) {
    const val = extractAttribute(kernElement, 'w:val', attributesGroupName);
    const kernHalfPts = safeInt(val);
    if (kernHalfPts !== undefined) {
      props.kerning_pt = convertHalfPointsToPoints(kernHalfPts);
    }
  }

  // Character Spacing (w:spacing) - in twips
  const spacingElement = extractElement(rPrElement, 'w:spacing');
  if (spacingElement) {
    const val = extractAttribute(spacingElement, 'w:val', attributesGroupName);
    const spacingTwips = safeInt(val);
    if (spacingTwips !== undefined) {
      props.character_spacing_twips = spacingTwips;
      // If model expects points: (props as any).character_spacing_pt = convertTwipsToPoints(spacingTwips);
    }
  }

  // Emboss (w:emboss)
  const embossElement = extractElement(rPrElement, 'w:emboss');
  if (embossElement !== undefined) {
    props.emboss = extractBooleanAttribute(embossElement, 'w:val', attributesGroupName);
  }

  // Outline (w:outline)
  const outlineElement = extractElement(rPrElement, 'w:outline');
  if (outlineElement !== undefined) {
    props.outline = extractBooleanAttribute(outlineElement, 'w:val', attributesGroupName);
  }

  // Shadow (w:shadow)
  const shadowElement = extractElement(rPrElement, 'w:shadow');
  if (shadowElement !== undefined) {
    props.shadow = extractBooleanAttribute(shadowElement, 'w:val', attributesGroupName);
  }

  // AllCaps (w:caps)
  const capsElement = extractElement(rPrElement, 'w:caps');
  if (capsElement !== undefined) {
    props.all_caps = extractBooleanAttribute(capsElement, 'w:val', attributesGroupName);
  }

  // SmallCaps (w:smallCaps)
  const smallCapsElement = extractElement(rPrElement, 'w:smallCaps');
  if (smallCapsElement !== undefined) {
    props.small_caps = extractBooleanAttribute(smallCapsElement, 'w:val', attributesGroupName);
  }

  if (Object.keys(props).length > 0) {
    try {
      return RunStylePropertiesModel.parse(props);
    } catch (error) {
      console.error("Error parsing RunStylePropertiesModel:", error, "Input props:", props, "Original rPrElement:", rPrElement);
      return undefined;
    }
  }
  return undefined;
}
