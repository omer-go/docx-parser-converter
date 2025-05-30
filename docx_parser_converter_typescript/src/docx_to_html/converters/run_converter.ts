import {
  RunModel,
  ParagraphModel, // For context, e.g., tab stops
  TextContentModel,
  TabContentModel,
  // RunContentModel, // Type for iterating contents
} from '../../../docx_parsers/models/index';
import { getRunStyles } from './style_converter';

/**
 * Escapes special HTML characters in a string.
 * @param text The input string.
 * @returns The escaped string.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converts a TabContentModel to its HTML representation.
 * For now, uses a fixed-width span or a literal tab character.
 * A more advanced version would calculate width based on paragraph tab stops.
 * @param _tab The TabContentModel object (currently unused as tab is fixed).
 * @param _paragraphModel The parent ParagraphModel (for future use with tab stops).
 * @returns HTML string for a tab.
 */
function convertTabToHtml(_tab: TabContentModel, _paragraphModel?: ParagraphModel): string {
  // Option 1: Fixed width span (adjust width as needed, 36pt = 0.5 inch)
  // return '<span style="display:inline-block;width:36pt;">&nbsp;</span>';
  // Using a non-breaking space to ensure the span isn't collapsed if empty.

  // Option 2: Literal tab character (relies on white-space: pre-wrap or similar on a parent)
  return '\t';
}

// Type guards for RunContentModel items
function isTextContent(item: any): item is TextContentModel {
  return item && typeof item.text === 'string';
}

function isTabContent(item: any): item is TabContentModel {
  // TabContentModel is currently an empty object (or has a default 'type' field)
  // This check might need to be more robust if TabContentModel gets more fields.
  // For now, if it's not TextContent, and exists, it's likely TabContent in this context.
  return item && (item.type === 'tab' || Object.keys(item).length === 0 || (Object.keys(item).length === 1 && item.type === 'tab'));
}


/**
 * Converts a RunModel object to its HTML representation.
 * @param runModel The RunModel object to convert.
 * @param paragraphModel The parent ParagraphModel, providing context (e.g., for tab stops).
 * @returns HTML string representing the run, or an empty string if the run is empty.
 */
export function convertRunToHtml(runModel: RunModel, paragraphModel?: ParagraphModel): string {
  if (!runModel) {
    return "";
  }

  const cssStyleString = getRunStyles(runModel.properties);
  let htmlContent = "";

  if (runModel.contents) {
    for (const runContent of runModel.contents) {
      // runContent is of type RunContentModel, which has an 'item' field
      // that is a union of TextContentModel | TabContentModel
      if (runContent.item) { // Check if item exists
        if (isTextContent(runContent.item)) {
          // Preserve spaces: leading/trailing spaces are significant in DOCX runs
          // A common approach is to replace multiple spaces with &nbsp; sequences,
          // or rely on white-space: pre-wrap; on a containing element.
          // For simplicity here, we'll escape HTML and preserve spaces as they are.
          // The browser will collapse multiple spaces unless white-space CSS is applied.
          let text = runContent.item.text;
          // If text might contain sequences of spaces that need to be preserved,
          // and pre-wrap is not used, they could be converted to &nbsp; sequences.
          // e.g., text = text.replace(/  /g, ' &nbsp;').replace(/^ | $/g, '&nbsp;');
          htmlContent += escapeHtml(text);
        } else if (isTabContent(runContent.item)) {
          htmlContent += convertTabToHtml(runContent.item, paragraphModel);
        }
        // TODO: Handle other RunContent types like <w:br>, <w:drawing> here
      }
    }
  }

  // Avoid empty <span> tags if there's no content and no styling to apply.
  // However, an empty span might be needed if it has styles that affect layout (e.g. specific height/width for an empty inline block).
  // The Python reference output for empty runs <w:r><w:rPr><w:vanish /></w:r></w:r> is just "".
  // If runModel.properties exists and results in a non-empty cssStyleString, a span should be rendered.
  if (htmlContent === "" && !cssStyleString) {
    return "";
  }

  // If content is just a tab or spaces and there are no other styles,
  // it might not need a <span> wrapper if the parent handles whitespace correctly.
  // However, for consistency and applying styles, <span> is generally used.
  return `<span style="${cssStyleString}">${htmlContent}</span>`;
}
