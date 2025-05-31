import {
  ParagraphNumberingModel,
  NumberingModel as DocxNumberingModel,
  NumberingInstanceModel,
  NumberingLevelModel,
} from '../../../docx_parsers/models/index';

// --- Helper functions for number formatting ---
function toRoman(num: number, isUpper: boolean = true): string {
  if (num < 1 || num > 3999) return num.toString(); // Basic fallback
  const romanMap = [
    { value: 1000, numeral: "M" }, { value: 900, numeral: "CM" },
    { value: 500, numeral: "D" }, { value: 400, numeral: "CD" },
    { value: 100, numeral: "C" }, { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" }, { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" }, { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" }, { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" }
  ];
  let result = '';
  for (const { value, numeral } of romanMap) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return isUpper ? result : result.toLowerCase();
}

function toAlpha(num: number, isUpper: boolean = true): string {
  if (num < 1) return num.toString();
  let result = '';
  let tempNum = num;
  while (tempNum > 0) {
    tempNum--; // 1-indexed to 0-indexed
    result = String.fromCharCode((tempNum % 26) + (isUpper ? 65 : 97)) + result;
    tempNum = Math.floor(tempNum / 26);
  }
  return result;
}

/**
 * Manages numbering counters and context for plain text conversion.
 */
export class TxtNumberingStateService {
  private counters: { [numId: string]: { [ilvl: string]: number } } = {};
  public currentNumId: number | null = null;
  public currentIlvl: number = -1;

  /**
   * Resets all numbering counters and current list context.
   */
  public resetAllCounters(): void {
    this.counters = {};
    this.currentNumId = null;
    this.currentIlvl = -1;
  }

  /**
   * Increments the counter for a given numId and ilvl.
   * Resets counters for deeper levels within the same numId.
   * @returns The new (incremented) counter value for the current level.
   */
  private _incrementCounter(numId: number, ilvl: number): number {
    if (!this.counters[numId]) {
      this.counters[numId] = {};
    }
    this.counters[numId][ilvl] = (this.counters[numId][ilvl] || 0) + 1;

    for (const levelKey in this.counters[numId]) {
      if (parseInt(levelKey) > ilvl) {
        this.counters[numId][levelKey] = 0; // Reset for next use at that deeper level
      }
    }
    return this.counters[numId][ilvl];
  }

  /**
   * Gets the current counter value for a given numId and ilvl without incrementing.
   * Returns 0 if the counter hasn't been initialized for that level (or for a parent level placeholder).
   * @returns The current counter value, or 0 if not yet used at this level.
   */
  private _getCounterValue(numId: number, ilvl: number): number {
    return this.counters[numId]?.[ilvl] || 0;
  }

  /**
   * Formats a number based on the numFmt string.
   * @param counter The number to format.
   * @param numFmt The numbering format string (e.g., "decimal", "upperRoman", "bullet").
   * @returns The formatted string representation of the number.
   */
  public formatNumber(counter: number, numFmt: string): string {
    // If counter is 0 (e.g. from _getCounterValue for a level not yet started),
    // it implies it's about to become 1 for display in a placeholder.
    const displayCounter = counter === 0 ? 1 : counter;

    switch (numFmt) {
      case 'decimal': return displayCounter.toString();
      case 'upperRoman': return toRoman(displayCounter, true);
      case 'lowerRoman': return toRoman(displayCounter, false);
      case 'upperLetter': return toAlpha(displayCounter, true);
      case 'lowerLetter': return toAlpha(displayCounter, false);
      case 'bullet': return "•"; // Default bullet, actual char often in lvlText
      // TODO: Add more cases: ordinal, cardinalText, ordinalText, decimalZero, etc.
      default:
        // console.warn(`Unsupported numFmt for TXT: ${numFmt}. Defaulting to decimal.`);
        return displayCounter.toString();
    }
  }

  /**
   * Generates the marker text for a list item.
   * It replaces placeholders like %1, %2 in lvlText with actual formatted numbers.
   * Crucially, it increments the counter for the *current* level (`ilvl`)
   * before its value is used in a placeholder.
   * @param levelModel The NumberingLevelModel for the current item.
   * @param numId The numId of the list instance.
   * @param currentItemIlvl The ilvl of the current item being processed.
   * @returns The fully formatted marker text (e.g., "1.a. ").
   */
  public generateMarkerText(levelModel: NumberingLevelModel, numId: number, currentItemIlvl: number): string {
    let lvlText = levelModel.lvlText;

    if (levelModel.numFmt === 'bullet') {
      return lvlText || "•"; // Use lvlText if present (e.g. custom bullet), else default
    }

    // Default lvlText if empty for non-bullet types
    lvlText = lvlText || `%${currentItemIlvl + 1}.`;

    // Replace placeholders %1, %2, ... %9
    // Placeholders are 1-indexed referring to the level index (0-indexed)
    for (let i = 1; i <= 9; i++) {
      const placeholder = `%${i}`;
      if (lvlText.includes(placeholder)) {
        const placeholderIlvl = i - 1; // %1 corresponds to ilvl 0, %2 to ilvl 1, etc.
        let valueToFormat: number;
        let numFmtForPlaceholder: string;

        if (placeholderIlvl === currentItemIlvl) {
          // This is the placeholder for the current item's level. Increment its counter.
          valueToFormat = this._incrementCounter(numId, currentItemIlvl);
          numFmtForPlaceholder = levelModel.numFmt;
        } else {
          // This placeholder refers to a parent level or a level not yet reached (if placeholderIlvl > currentItemIlvl).
          // Get its current value without incrementing.
          valueToFormat = this._getCounterValue(numId, placeholderIlvl);
          // Determining numFmt for other levels requires looking up that level's model.
          // This is a simplification: assume decimal for other levels in compound markers for TXT.
          // A full solution would need access to the full NumberingInstanceModel.
          numFmtForPlaceholder = "decimal";
        }
        lvlText = lvlText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), this.formatNumber(valueToFormat, numFmtForPlaceholder));
      }
    }
    return lvlText;
  }

  /**
   * Notifies the state service of a change in numbering context (current list item).
   * This primarily helps in deciding when to reset counters for deeper levels if a higher level changes.
   * @param numId The numId of the current list item, or null if not a list item.
   * @param ilvl The ilvl of the current list item, or null.
   */
  public notifyContextChange(numId: number | null, ilvl: number | null): void {
    // If we move to a different list (numId changes) or to a higher level (ilvl decreases)
    // in the same list, it implies that any deeper levels of the *previous* list/level
    // should have their counters reset if they were being tracked.
    // The _incrementCounter method already handles resetting deeper levels for the *current* numId.
    // This method is more about conceptual state tracking if needed for more complex scenarios.
    // For current TXT generation, _incrementCounter's reset is the primary mechanism.

    this.currentNumId = numId;
    this.currentIlvl = ilvl ?? -1;
  }
}

/**
 * Generates the text prefix for a list item (e.g., "1. ", "a) ", "- ").
 * @param paragraphNumbering The numbering properties of the paragraph.
 * @param numberingModel The full NumberingModel (definitions from numbering.xml).
 * @param stateService The TxtNumberingStateService to manage counters and context.
 * @returns The list item prefix string, including a trailing space.
 */
export function generateTxtListItemPrefix(
  paragraphNumbering: ParagraphNumberingModel,
  numberingModel: DocxNumberingModel,
  stateService: TxtNumberingStateService
): string {
  if (!paragraphNumbering || !numberingModel || !stateService) {
    return "";
  }

  const { numId, ilvl } = paragraphNumbering;
  stateService.notifyContextChange(numId, ilvl); // Inform state service of current context

  const numberingInstance = numberingModel.instances.find(inst => inst.numId === numId);
  if (!numberingInstance) {
    console.warn(`TXT: Numbering instance ${numId} not found.`);
    return "- "; // Default fallback prefix
  }

  const levelModel = numberingInstance.levels.find(lvl => lvl.ilvl === ilvl);
  if (!levelModel) {
    console.warn(`TXT: Numbering level ${ilvl} not found for numId ${numId}.`);
    // Fallback marker using basic properties if level model is missing
    const tempLevelModel = { numFmt: 'bullet', lvlText: "-", ilvl } as NumberingLevelModel;
    const markerText = stateService.generateMarkerText(tempLevelModel, numId, ilvl);
    return markerText.endsWith(" ") || markerText.endsWith("\t") ? markerText : markerText + " ";
  }

  const markerText = stateService.generateMarkerText(levelModel, numId, ilvl);

  // Add a trailing space if not already ending with one or a tab (common for markers)
  return markerText.endsWith(" ") || markerText.endsWith("\t") ? markerText : markerText + " ";
}
