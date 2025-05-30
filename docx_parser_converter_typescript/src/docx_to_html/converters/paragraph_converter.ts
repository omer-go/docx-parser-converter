import {
  ParagraphModel,
  NumberingModel as DocxNumberingModel, // Full numbering.xml model
  // RunModel, // Type is inferred for iteration
} from '../../../docx_parsers/models/index';
import { getParagraphStyles, aggregateCss } from './style_converter';
import { convertRunToHtml } from './run_converter';
import {
    NumberingStateService,
    generateListItemDetails,
    // closeAnyOpenLists // This will be called at a higher level (document converter)
} from './numbering_converter';


/**
 * Converts a ParagraphModel object to its HTML representation,
 * integrating with NumberingStateService for list item formatting.
 * @param paragraph The ParagraphModel object to convert.
 * @param numberingModel The full parsed NumberingModel (from numbering.xml), undefined if no numbering.
 * @param numberingStateService The active instance of NumberingStateService managing list state.
 * @returns HTML string representing the paragraph.
 */
export function convertParagraphToHtml(
  paragraph: ParagraphModel,
  numberingModel: DocxNumberingModel | undefined, // Model from numbering.xml
  numberingStateService: NumberingStateService
): string {
  if (!paragraph) {
    return "";
  }

  // Get paragraph's direct styles
  // isListItem will be determined by generateListItemDetails
  const paragraphCssDirect = getParagraphStyles(paragraph.properties, !!paragraph.numbering);

  // Convert runs to HTML
  let runsHtml = "";
  if (paragraph.runs) {
    for (const run of paragraph.runs) {
      runsHtml += convertRunToHtml(run, paragraph);
    }
  }

  let listStartTags = "";
  let listEndTags = ""; // These are from the previous state transition
  let itemMarkerHtml = "";
  let listItemOverallCss = ""; // CSS derived from numbering level properties
  let finalTag = "p";
  // let isListItem = false; // Not strictly needed here, finalTag serves this role

  if (paragraph.numbering && numberingModel) {
    const listItemDetails = generateListItemDetails(
      paragraph.numbering, // This is ParagraphNumberingModel {ilvl, numId}
      numberingModel,
      numberingStateService
    );

    if (listItemDetails) {
      // isListItem = true;
      listStartTags = listItemDetails.listStartTags;
      listEndTags = listItemDetails.listEndTags; // Tags to close *before* this item's list potentially opens
      itemMarkerHtml = listItemDetails.itemMarkerHtml;
      listItemOverallCss = listItemDetails.listItemOverallCss;
      finalTag = "li";
    } else {
      // Failed to generate list item details, treat as a normal paragraph
      // but ensure any previously open lists are closed.
      listEndTags = numberingStateService.closeAllOpenLists();
    }
  } else {
    // Not a list item, close any open lists from previous paragraphs
    listEndTags = numberingStateService.closeAllOpenLists();
  }

  // Combine CSS: list-defined PPr, then direct PPr.
  // Precedence: direct paragraph properties should override list-defined paragraph properties.
  let fullCss = aggregateCss(listItemOverallCss, paragraphCssDirect);

  // Add white-space: pre-wrap for tabs and multiple spaces.
  fullCss = aggregateCss(fullCss, 'white-space: pre-wrap;');


  let content = itemMarkerHtml + runsHtml;
  // Handling for empty paragraphs/list items to ensure they render with height
  if (content.trim() === "" && (finalTag === "p" || finalTag === "li")) {
    // For empty elements that should occupy space (like an empty line),
    // a non-breaking space is a common trick if CSS doesn't enforce min-height.
    // However, `white-space: pre-wrap` combined with a line break in the source
    // or default block element display usually handles this.
    // If a paragraph is truly empty (no runs, no text), it still forms a block.
    // Let's ensure there's content if it's meant to be a visible empty line,
    // but only if there's no marker (which provides content).
    if (!itemMarkerHtml) {
        // content = "&nbsp;"; // This can be too aggressive. CSS min-height is better.
                              // `white-space: pre-wrap` already makes even space-only content visible.
    }
  }

  // Assemble the HTML
  // 1. Close tags from previous list item (if any)
  // 2. Open tags for current list item (if any)
  // 3. Render the item itself (p or li)
  let outputHtml = listEndTags;
  outputHtml += listStartTags;

  outputHtml += `<${finalTag}${fullCss ? ' style="' + fullCss.trim() + '"' : ''}>${content}</${finalTag}>`;

  // IMPORTANT: The closing of the list *this item belongs to* (e.g. the final </ol> for the document)
  // is NOT handled here. It's handled by the *next* paragraph's transition logic,
  // or by a final call to `numberingStateService.closeAllOpenLists()` at the very end of document processing
  // by the main document-to-HTML converter.

  return outputHtml;
}
