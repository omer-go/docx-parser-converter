import {
  RunModel,
  TextContentModel,
  TabContentModel,
  // RunContentModel, // Type for iterating contents
} from '../../../docx_parsers/models/index';

// Type guards for RunContentModel items
function isTextContent(item: any): item is TextContentModel {
  return item && typeof item.text === 'string';
}

function isTabContent(item: any): item is TabContentModel {
  // TabContentModel has a 'type' field that defaults to 'tab'.
  // Check if item exists and has this property.
  return item && item.type === 'tab';
}

/**
 * Converts a RunModel object to its plain text representation.
 * @param runModel The RunModel object to convert.
 * @returns Plain text string representing the run's content.
 */
export function convertRunToTxt(runModel?: RunModel): string {
  if (!runModel || !runModel.contents || runModel.contents.length === 0) {
    return "";
  }

  let text = "";

  for (const runContent of runModel.contents) {
    // runContent is of type RunContentModel, which has an 'item' field
    // that is a union of TextContentModel | TabContentModel
    if (runContent.item) { // Check if item exists
      if (isTextContent(runContent.item)) {
        text += runContent.item.text;
      } else if (isTabContent(runContent.item)) {
        text += '\t'; // Replace tab objects with a literal tab character
      }
      // Other run content types like <w:br> (breaks), <w:drawing>, etc.,
      // are not typically converted to text in this direct manner for TXT output,
      // or might be handled by specific logic (e.g., <w:br> -> newline in paragraph converter).
    }
  }

  return text;
}
