import {
  TableRowPropertiesSchema,
  // defaultTableRowProperties // If you define defaults
} from './models/table_models.js';
import { getElement, getAttribute, getOnOffElement } from './xml_utils.js'; // MeasurementSchema is handled by direct parsing

/**
 * Parses a <w:trPr> (table row properties) XML node.
 */
export class TableRowPropertiesParser {
  /**
   * Parses the <w:trPr> XML element.
   * @param {Element | null} trPrNode - The <w:trPr> XML element.
   * @returns {object} An object conforming to TableRowPropertiesSchema.
   */
  parse(trPrNode) {
    if (!trPrNode) {
      return TableRowPropertiesSchema.parse({});
    }

    const props = {};

    // Row Height <w:trHeight w:val="..." w:hRule="atLeast|exact|auto"/>
    const trHeightNode = getElement(trPrNode, 'w:trHeight');
    if (trHeightNode) {
      const heightVal = getAttribute(trHeightNode, 'w:val');
      // const hRule = getAttribute(trHeightNode, 'w:hRule'); // hRule is also important
      if (heightVal) {
        props.trHeight = { val: parseInt(heightVal, 10) };
        // TODO: Store hRule if schema is adapted for it.
        // It might be MeasurementSchema.val stores height, and a new field stores hRule.
      }
    }

    // Table Header <w:tblHeader/>
    // getOnOffElement returns the node itself if present, null otherwise.
    // OnOffSchema in table_models.js will convert this to boolean.
    props.tblHeader = getOnOffElement(trPrNode, 'w:tblHeader');


    // Other properties like cantSplit, jc (row alignment) can be added here.
    // Example for cantSplit:
    // props.cantSplit = getOnOffElement(trPrNode, 'w:cantSplit');

    try {
      return TableRowPropertiesSchema.parse(props);
    } catch (error) {
      console.error('TableRowProperties schema validation failed for trPrNode:', trPrNode, error.errors, props);
      return TableRowPropertiesSchema.parse({}); // Fallback to default
    }
  }
}
