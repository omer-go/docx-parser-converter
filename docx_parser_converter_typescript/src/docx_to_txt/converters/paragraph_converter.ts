import {
  ParagraphModel,
  NumberingModel as DocxNumberingModel,
  IndentationPropertiesModel,
} from '../../../docx_parsers/models/index';
import { convertRunToTxt } from './run_converter';
// Forward declarations for TXT Numbering Converter components
import { TxtNumberingStateService, generateTxtListItemPrefix } from './numbering_converter';

/**
 * Applies indentation (tabs and spaces) to the first line of text based on indentation properties.
 * @param text The text content of the paragraph.
 * @param indentProps Indentation properties from the paragraph style.
 * @returns Text with leading indentation applied to the first line.
 * @todo Handle multi-line text if runConverter can produce newline characters within a single paragraph's text.
 */
function applyTextIndentation(text: string, indentProps?: IndentationPropertiesModel): string {
  if (!text || !indentProps) {
    return text;
  }

  // Calculate total first-line indentation.
  // DOCX 'left' is for the whole block, 'firstLine' is relative to 'left'.
  // 'hanging' is also relative to 'left' but has an opposite effect to 'firstLine'.
  // For simple text output, we often just care about the effective first-line indent.
  let firstLineIndentPt = indentProps.firstline_pt || 0;
  const leftIndentPt = indentProps.left_pt || 0;

  // Total indent for the first line from the page margin.
  // If firstLine is negative (hanging), it reduces the effective left indent for the first line.
  // However, for plain text, a hanging indent usually means the marker is at `left_pt`
  // and the text starts further in, or the first line starts at `left_pt` and subsequent lines are further indented.
  // This simplified version primarily handles first-line indent relative to any block indent.
  // For TXT, we'll assume the first line's *additional* indent is `firstLine_pt`.
  // A full block indent (`left_pt`) would require indenting all lines.

  // Simplified: apply only firstLine_pt as additional indent for the first line.
  // Block indent (left_pt) would require indenting all lines of a multi-line paragraph.
  // This function, as is, only indents the very start of the `text` string.
  let totalEffectiveIndentPt = firstLineIndentPt;
  if (leftIndentPt > 0 && firstLineIndentPt >= 0) { // Typical case: left indent + first line indent
      totalEffectiveIndentPt = leftIndentPt + firstLineIndentPt;
  } else if (leftIndentPt > 0 && firstLineIndentPt < 0) { // Hanging indent: first line is less indented than left
      totalEffectiveIndentPt = leftIndentPt + firstLineIndentPt; // firstLine_pt is negative
      if (totalEffectiveIndentPt < 0) totalEffectiveIndentPt = 0; // Cannot be less than zero total indent
  }
  // If only left_pt is set, this function won't apply it unless firstLine_pt is also set.
  // This could be adjusted if all lines should get left_pt.
  // For now, focusing on first-line behavior as per typical text indent.

  if (totalEffectiveIndentPt <= 0) {
    return text;
  }

  const pointsPerTab = 36; // Standard 0.5 inch tab stop (72 points per inch)
  const pointsPerSpace = 6;  // Approximate: 6 spaces per 0.5 inch tab (very rough)

  const numTabs = Math.floor(totalEffectiveIndentPt / pointsPerTab);
  const remainingPoints = totalEffectiveIndentPt % pointsPerTab;
  const numSpaces = Math.round(remainingPoints / pointsPerSpace);

  const indentPrefix = '\t'.repeat(numTabs) + ' '.repeat(numSpaces);
  return indentPrefix + text;
}


export interface ConvertParagraphToTxtOptions {
    /** Whether to apply indentation based on paragraph properties. Defaults to true. */
    applyIndentation?: boolean;
}

/**
 * Converts a ParagraphModel object to its plain text representation.
 * Handles list item marker generation and optional indentation.
 * @param paragraph The ParagraphModel object to convert.
 * @param numberingModel The full parsed NumberingModel (from numbering.xml), undefined if no numbering.
 * @param numberingStateService The active instance of TxtNumberingStateService managing list state.
 * @param options Configuration options for text conversion.
 * @returns Plain text string representing the paragraph.
 *          Newline characters are typically added by the calling Document/TXT generator after each paragraph.
 */
export function convertParagraphToTxt(
  paragraph: ParagraphModel,
  numberingModel: DocxNumberingModel | undefined,
  numberingStateService: TxtNumberingStateService, // Assuming TxtNumberingStateService is compatible or defined
  options: ConvertParagraphToTxtOptions = { applyIndentation: true }
): string {
  if (!paragraph) {
    return "";
  }

  // Get text from all runs
  let runsText = "";
  if (paragraph.runs) {
    for (const run of paragraph.runs) {
      runsText += convertRunToTxt(run);
    }
  }

  // Handle Numbering
  let listMarker = "";
  if (paragraph.numbering && numberingModel && numberingStateService) {
    // generateTxtListItemPrefix is expected to return the text marker, e.g., "1. ", "a) ", "- "
    listMarker = generateTxtListItemPrefix(
      paragraph.numbering,
      numberingModel,
      numberingStateService
    );
  }

  let paragraphContent = listMarker + runsText;

  // Handle Indentation
  // The indentation should apply to the line, including the marker.
  if (options.applyIndentation !== false) { // Defaults to true if option not provided
    paragraphContent = applyTextIndentation(paragraphContent, paragraph.properties?.indentation);
  }

  return paragraphContent;
}
