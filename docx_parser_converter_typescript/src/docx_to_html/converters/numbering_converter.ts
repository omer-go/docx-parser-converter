import {
  ParagraphNumberingModel,
  NumberingModel,
  NumberingInstanceModel,
  NumberingLevelModel,
  // RunStylePropertiesModel, // For typing, used by getRunStyles
  // ParagraphStylePropertiesModel, // For typing, used by getParagraphStyles
} from '../../../docx_parsers/models/index';
import { getRunStyles, getParagraphStyles } from './style_converter';

// --- Helper functions for number formatting ---
function toRoman(num: number): string {
  if (num < 1 || num > 3999) return num.toString(); // Basic fallback
  const roman = [
    { value: 1000, numeral: "M" }, { value: 900, numeral: "CM" },
    { value: 500, numeral: "D" }, { value: 400, numeral: "CD" },
    { value: 100, numeral: "C" }, { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" }, { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" }, { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" }, { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" }
  ];
  let result = '';
  for (const { value, numeral } of roman) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

function toAlpha(num: number, lowercase: boolean = true): string {
  if (num < 1) return num.toString();
  let result = '';
  let tempNum = num;
  while (tempNum > 0) {
    tempNum--; // 1-indexed to 0-indexed
    result = String.fromCharCode((tempNum % 26) + (lowercase ? 97 : 65)) + result;
    tempNum = Math.floor(tempNum / 26);
  }
  return result;
}


/**
 * Manages numbering counters and list state (open/closed HTML tags).
 */
export class NumberingStateService {
  private counters: { [numId: string]: { [ilvl: string]: number } } = {};
  private currentListStack: { numId: number; ilvl: number; htmlTag: 'ol' | 'ul' }[] = [];

  /**
   * Resets all numbering counters. Useful for new documents or sections.
   */
  public resetAllCounters(): void {
    this.counters = {};
    this.currentListStack = []; // Also reset list stack
  }

  /**
   * Increments the counter for a given numId and ilvl.
   * Resets counters for deeper levels.
   * @returns The new (incremented) counter value for the current level.
   */
  private _incrementCounter(numId: number, ilvl: number): number {
    if (!this.counters[numId]) {
      this.counters[numId] = {};
    }
    // Increment current level or start at 1
    this.counters[numId][ilvl] = (this.counters[numId][ilvl] || 0) + 1;

    // Reset counters for deeper levels
    for (const levelKey in this.counters[numId]) {
      if (parseInt(levelKey) > ilvl) {
        this.counters[numId][levelKey] = 0; // Reset, will become 1 when that level is next encountered
      }
    }
    return this.counters[numId][ilvl];
  }

  /**
   * Gets the current counter value for a given numId and ilvl without incrementing.
   * If the counter is not initialized (e.g. value is 0), it often implies it should be 1 for display.
   * @returns The current counter value.
   */
  private _getCounterValue(numId: number, ilvl: number): number {
    return this.counters[numId]?.[ilvl] || 0; // Return 0 if not started, formatNumber handles 0->1 for display if needed
  }

  /**
   * Formats a number based on the numFmt string.
   * @param counter The number to format.
   * @param numFmt The numbering format string (e.g., "decimal", "upperRoman", "bullet").
   * @returns The formatted string representation of the number.
   */
  public formatNumber(counter: number, numFmt: string): string {
    // For list items, counter is usually 1-based. If it's 0 from _getCounterValue, means it's about to become 1.
    const displayCounter = counter === 0 ? 1 : counter;

    switch (numFmt) {
      case 'decimal': return displayCounter.toString();
      case 'upperRoman': return toRoman(displayCounter);
      case 'lowerRoman': return toRoman(displayCounter).toLowerCase();
      case 'upperLetter': return toAlpha(displayCounter, false);
      case 'lowerLetter': return toAlpha(displayCounter, true);
      case 'bullet': return "•"; // Default bullet, could be from lvlText
      // Add more cases: ordinal, cardinalText, ordinalText, etc.
      default:
        // console.warn(`Unsupported numFmt: ${numFmt}. Defaulting to decimal.`);
        return displayCounter.toString(); // Fallback
    }
  }

  /**
   * Generates the marker text for a list item.
   * It replaces placeholders like %1, %2 in lvlText with actual formatted numbers.
   * It also increments the counter for the current level.
   * @param levelModel The NumberingLevelModel for the current item.
   * @param numId The numId of the list instance.
   * @param ilvl The ilvl of the current item.
   * @returns The fully formatted marker text (e.g., "1.a. ").
   */
  public generateMarkerText(levelModel: NumberingLevelModel, numId: number, ilvl: number): string {
    // Increment counter for the current level first for this item
    // Increment counter for the current level first for this item
    const currentLevelValue = this._incrementCounter(numId, ilvl);

    let lvlText = levelModel.lvlText;

    // If numFmt is 'bullet' and lvlText is the bullet character, no substitution is needed.
    // Otherwise, process placeholders.
    if (levelModel.numFmt === 'bullet') {
        // lvlText for bullets usually IS the bullet character. If it's empty, use a default.
        lvlText = lvlText || "•";
    } else {
        lvlText = lvlText || `%${ilvl + 1}.`; // Default placeholder if lvlText is empty for non-bullet types

        // Replace placeholders like %1, %2, ... %9
        // Placeholders are 1-indexed referring to level index (0-indexed)
    for (let i = 1; i <= 9; i++) {
      const placeholder = `%${i}`;
      if (lvlText.includes(placeholder)) {
        const levelIndexToFormat = i - 1; // %1 refers to ilvl 0, %2 to ilvl 1 etc.
        let valueToFormat: number;
        let formatForLevel: string;

        if (levelIndexToFormat === ilvl) {
            valueToFormat = currentLevelValue;
            formatForLevel = levelModel.numFmt;
        } else {
            // For placeholders of parent levels, get their current (non-incremented) value
            valueToFormat = this._getCounterValue(numId, levelIndexToFormat);
            // Need to find the numFmt of that parent level. This requires access to the NumberingInstanceModel.
            // This part is tricky without passing the full NumberingInstanceModel or having it stored.
            // For now, let's assume if it's not current level, we use decimal or a default. This is a simplification.
            // A full solution would look up the parent level's numFmt.
            formatForLevel = "decimal"; // Simplified: assume decimal for parent levels in compound markers
        }
        lvlText = lvlText.replace(placeholder, this.formatNumber(valueToFormat, formatForLevel));
      }
    }
    return lvlText.endsWith('.') ? lvlText + ' ' : lvlText; // Add space if it ends with a period
  }

  /**
   * Generates HTML tags needed to transition from the current list state to the target list item's state.
   * @param targetNumId The numId of the target list item.
   * @param targetIlvl The ilvl of the target list item.
   * @param targetNumFmt The numFmt of the target list item (to determine <ol> or <ul>).
   * @returns An object with `listStartTags` and `listEndTags`.
   */
  public generateListTransitionTags(
    targetNumId: number,
    targetIlvl: number,
    targetNumFmt: string
  ): { listStartTags: string; listEndTags: string } {
    let listStartTags = "";
    let listEndTags = "";
    const targetHtmlTag = targetNumFmt === 'bullet' ? 'ul' : 'ol';

    // Close deeper or different lists
    while (
      this.currentListStack.length > 0 &&
      (this.currentListStack[this.currentListStack.length - 1].ilvl > targetIlvl ||
       this.currentListStack[this.currentListStack.length - 1].numId !== targetNumId ||
       (this.currentListStack[this.currentListStack.length - 1].ilvl === targetIlvl &&
        this.currentListStack[this.currentListStack.length - 1].htmlTag !== targetHtmlTag))
    ) {
      const closingList = this.currentListStack.pop();
      if (closingList) {
        listEndTags += `</${closingList.htmlTag}>`;
      }
    }

    // Open new or deeper lists
    if (this.currentListStack.length === 0 ||
        this.currentListStack[this.currentListStack.length - 1].ilvl < targetIlvl ||
        this.currentListStack[this.currentListStack.length - 1].numId !== targetNumId ||
        (this.currentListStack[this.currentListStack.length - 1].ilvl === targetIlvl &&
         this.currentListStack[this.currentListStack.length - 1].htmlTag !== targetHtmlTag) // Handles switch from ol to ul at same level
       ) {
      // If switching type at the same level, the old one is already closed by the loop above.
      // Now open the new one.
      const olType = targetNumFmt !== 'bullet' ? this.getOlType(targetNumFmt) : '';
      listStartTags += `<${targetHtmlTag}${olType ? ` type="${olType}"` : ''}>`;
      this.currentListStack.push({ numId: targetNumId, ilvl: targetIlvl, htmlTag: targetHtmlTag });
    }
    return { listStartTags, listEndTags };
  }

  /**
   * Gets the 'type' attribute for an <ol> tag based on numFmt.
   */
  private getOlType(numFmt: string): string {
    switch (numFmt) {
      case 'upperLetter': return 'A';
      case 'lowerLetter': return 'a';
      case 'upperRoman': return 'I';
      case 'lowerRoman': return 'i';
      case 'decimal': return '1';
      default: return ''; // No type for other formats like decimal-zero, etc.
    }
  }

  /**
   * Closes all currently open lists in the stack.
   * @returns HTML string of closing tags.
   */
  public closeAllOpenLists(): string {
    let listEndTags = "";
    while (this.currentListStack.length > 0) {
      const closingList = this.currentListStack.pop();
      if (closingList) {
        listEndTags += `</${closingList.htmlTag}>`;
      }
    }
    return listEndTags;
  }
}


/**
 * Generates details needed to render a paragraph as a list item.
 * @param paragraphNumbering The numbering properties of the paragraph.
 * @param numberingModel The full NumberingModel (definitions).
 * @param stateService The NumberingStateService to manage counters and list hierarchy.
 * @returns An object with HTML tags and marker info, or null if not a valid list item.
 */
export function generateListItemDetails(
  paragraphNumbering: ParagraphNumberingModel,
  numberingModel: NumberingModel,
  stateService: NumberingStateService
): { listStartTags: string; listEndTags: string; itemMarkerHtml: string; listItemOverallCss: string } | null {
  if (!paragraphNumbering || !numberingModel || !stateService) {
    return null;
  }

  const { numId, ilvl } = paragraphNumbering;
  const numberingInstance = numberingModel.instances.find(inst => inst.numId === numId);
  if (!numberingInstance) {
    console.warn(`Numbering instance ${numId} not found.`);
    return null;
  }

  const levelModel = numberingInstance.levels.find(lvl => lvl.ilvl === ilvl);
  if (!levelModel) {
    console.warn(`Numbering level ${ilvl} not found for numId ${numId}.`);
    // Fallback to a default bullet if level is missing
    const defaultBulletFallback = { numFmt: 'bullet', lvlText: '•' } as NumberingLevelModel;
    const transitionTags = stateService.generateListTransitionTags(numId, ilvl, defaultBulletFallback.numFmt);
    const markerText = stateService.generateMarkerText(defaultBulletFallback, numId, ilvl);
    return {
        ...transitionTags,
        itemMarkerHtml: `<span class="list-item-marker">${markerText}</span>`,
        listItemOverallCss: '',
    };
  }

  const { listStartTags, listEndTags } = stateService.generateListTransitionTags(numId, ilvl, levelModel.numFmt);
  const markerText = stateService.generateMarkerText(levelModel, numId, ilvl);

  const markerCss = getRunStyles(levelModel.run_properties);
  const listItemOverallCss = getParagraphStyles(levelModel.paragraph_properties, true); // isListItem = true

  return {
    listStartTags,
    listEndTags,
    itemMarkerHtml: `<span style="${markerCss}" class="list-item-marker">${markerText}</span>`,
    listItemOverallCss,
  };
}

/**
 * Generates closing HTML tags for any lists that are still open in the state service.
 * Useful at the end of document processing.
 * @param stateService The NumberingStateService instance.
 * @returns HTML string of closing tags.
 */
export function closeAnyOpenLists(stateService: NumberingStateService): string {
    return stateService.closeAllOpenLists();
}
