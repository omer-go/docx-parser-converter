import {
  StylesModel,
  StyleModel,
  ParagraphStylePropertiesModel,
  RunStylePropertiesModel,
} from '../../models/styles_models';
import { mergeProperties } from '../../utils';

/**
 * Deep clones a StyleModel object.
 * This is important to avoid modifying the original style definitions from the input StylesModel.
 * @param style The StyleModel to clone.
 * @returns A deep cloned StyleModel.
 */
function cloneStyleModel(style: StyleModel): StyleModel {
  const cloned: StyleModel = { ...style };
  if (style.paragraph_properties) {
    cloned.paragraph_properties = { ...style.paragraph_properties };
  }
  if (style.run_properties) {
    cloned.run_properties = { ...style.run_properties };
  }
  // Other properties like style_id, name, type, based_on, link are primitive and copied by spread.
  return cloned;
}

/**
 * Recursively resolves a single style's properties by merging with its parent and/or document defaults.
 * @param styleToResolve The style model to resolve.
 * @param stylesModel The full styles model containing all style definitions and document defaults.
 * @param resolvedStylesMap A map caching already resolved styles.
 * @param processingMap A map to detect circular dependencies.
 * @returns The resolved StyleModel.
 */
function resolveSingleStyle(
  styleToResolve: StyleModel,
  stylesModel: StylesModel,
  resolvedStylesMap: Map<string, StyleModel>,
  processingMap: Map<string, boolean>
): StyleModel {
  const styleId = styleToResolve.style_id;

  if (resolvedStylesMap.has(styleId)) {
    return resolvedStylesMap.get(styleId)!;
  }

  if (processingMap.get(styleId)) {
    console.warn(`Circular dependency detected for style ID: ${styleId}. Returning style as is.`);
    // Return a clone to avoid modifying the original from stylesModel.styles array
    return cloneStyleModel(styleToResolve);
  }

  processingMap.set(styleId, true);

  // Start with a deep clone of the current style to resolve
  let mergedStyle = cloneStyleModel(styleToResolve);

  let parentStyleProperties: ParagraphStylePropertiesModel | undefined = undefined;
  let parentRunProperties: RunStylePropertiesModel | undefined = undefined;

  if (mergedStyle.based_on) {
    const parentStyleDef = stylesModel.styles.find(s => s.style_id === mergedStyle.based_on);
    if (parentStyleDef) {
      if (parentStyleDef.type && mergedStyle.type && parentStyleDef.type !== mergedStyle.type) {
        console.warn(`Style ID ${styleId} of type ${mergedStyle.type} is based on style ID ${parentStyleDef.style_id} of different type ${parentStyleDef.type}. This might lead to unexpected behavior.`);
        // Depending on strictness, one might choose to not inherit in this case.
        // For now, we'll allow it but the merge logic will only merge relevant properties.
      }
      const resolvedParentStyle = resolveSingleStyle(parentStyleDef, stylesModel, resolvedStylesMap, processingMap);
      parentStyleProperties = resolvedParentStyle.paragraph_properties;
      parentRunProperties = resolvedParentStyle.run_properties;
    } else {
      console.warn(`Parent style ID ${mergedStyle.based_on} not found for style ID ${styleId}.`);
    }
  }

  // Apply document defaults if this style is a "base" (no parent found or no based_on)
  // or if the parent itself was ultimately based on defaults.
  // The mergeProperties function handles undefined inputs gracefully.

  let basePPr = parentStyleProperties;
  let baseRPr = parentRunProperties;

  // If there's no direct parent, or the style type implies it should fall back to doc defaults.
  // A style is considered a "base" for its type if it has no parent from based_on
  // or if its `based_on` pointed to a non-existent style.
  if (!mergedStyle.based_on || (mergedStyle.based_on && !parentStyleProperties && !parentRunProperties && !stylesModel.styles.find(s => s.style_id === mergedStyle.based_on))) {
      if (mergedStyle.type === 'paragraph') {
          basePPr = mergeProperties(stylesModel.doc_defaults_ppr, parentStyleProperties);
      } else if (mergedStyle.type === 'character') {
          baseRPr = mergeProperties(stylesModel.doc_defaults_rpr, parentRunProperties);
      }
  }


  // Merge paragraph properties
  if (mergedStyle.type === 'paragraph' || (!mergedStyle.type && mergedStyle.paragraph_properties)) { // Also apply if type is undefined but has pPr
    mergedStyle.paragraph_properties = mergeProperties(basePPr, mergedStyle.paragraph_properties);
  }

  // Merge run properties
  // Run properties can be present in paragraph styles (for all runs in paragraphs of that style)
  // or in character styles.
  mergedStyle.run_properties = mergeProperties(baseRPr, mergedStyle.run_properties);


  processingMap.delete(styleId);
  resolvedStylesMap.set(styleId, mergedStyle);
  return mergedStyle;
}


/**
 * Resolves the complete style hierarchy from a StylesModel.
 * Each style in the returned map will have its properties fully resolved by merging
 * with its parent styles and document defaults.
 * @param stylesModel The parsed StylesModel from StylesParser.
 * @returns A Map where keys are style IDs and values are fully resolved StyleModel objects.
 */
export function resolveStyleHierarchy(stylesModel: StylesModel): Map<string, StyleModel> {
  const resolvedStylesMap: Map<string, StyleModel> = new Map();
  const processingMap: Map<string, boolean> = new Map(); // For detecting circular dependencies

  // Ensure document defaults are "resolved" first by cloning them, as they don't have IDs to go into the map directly
  // but are used as bases. The mergeProperties will handle them being undefined if not present.

  for (const currentStyle of stylesModel.styles) {
    if (!resolvedStylesMap.has(currentStyle.style_id)) {
      resolveSingleStyle(currentStyle, stylesModel, resolvedStylesMap, processingMap);
    }
  }

  return resolvedStylesMap;
}
