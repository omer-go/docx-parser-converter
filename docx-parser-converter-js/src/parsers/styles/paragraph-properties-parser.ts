// src/parsers/styles/paragraph-properties-parser.ts
import {
  ParagraphProperties,
  SpacingProperties,
  IndentationProperties,
  ParagraphBorders,
  IndividualBorderProperties,
  ShadingProperties,
  AlignmentEnum,
  LineRuleEnum,
  BorderStyleEnum,
  ShadingPatternEnum,
  RunProperties, // Assuming this is the type for paraProps.runProperties
  TabDefinition,
  TabStopTypeEnum,
  TabStopLeaderEnum,
  TabStopType, // Added for casting
  TabStopLeader, // Added for casting
} from '../../models/styles-models';
import { parseRunProperties } from './run-properties-parser';
import { parseValAttribute, parseOnOffProperty } from '../helpers/common-helpers';
import { getElement, getElements, getAttribute, getElementBooleanAttribute } from '../../utils/xml-utils';

// Helper to parse individual border elements like <w:top>, <w:left> etc.
function parseIndividualBorder(borderNode: any): IndividualBorderProperties | undefined {
  if (!borderNode || typeof borderNode !== 'object') return undefined;

  const props: IndividualBorderProperties = {};
  const type = getAttribute(borderNode, 'w:val');
  // Ensure 'type' is explicitly set to a valid BorderStyleEnum or 'none'
  if (type && BorderStyleEnum.safeParse(type).success) {
    props.type = type as BorderStyleEnum;
  } else if (type === 'none' || type === 'nil') {
    props.type = 'none';
  } else if (type) { 
    // If type is present but invalid, we might not want to set it, 
    // or default to 'none' if that's the desired behavior for invalid explicit values.
    // For now, let's be strict: only valid enum values or 'none'/'nil'.
    // If model has a default, it will apply if props.type remains undefined.
  }


  const color = getAttribute(borderNode, 'w:color');
  if (color) props.color = color;

  const size = getAttribute(borderNode, 'w:sz');
  if (size) props.size = parseInt(size, 10);

  const space = getAttribute(borderNode, 'w:space');
  if (space) props.space = parseInt(space, 10);

  const shadowAttr = getAttribute(borderNode, 'w:shadow');
  if (shadowAttr !== undefined) props.shadow = getElementBooleanAttribute(borderNode, 'w:shadow');

  const frameAttr = getAttribute(borderNode, 'w:frame');
  if (frameAttr !== undefined) props.frame = getElementBooleanAttribute(borderNode, 'w:frame');

  return Object.keys(props).length > 0 ? props : undefined;
}

export function parseParagraphProperties(pPrNode: any): ParagraphProperties | undefined {
  if (!pPrNode || typeof pPrNode !== 'object' || Object.keys(pPrNode).length === 0) {
    return undefined;
  }

  const paraProps: ParagraphProperties = {};

  const styleId = parseValAttribute(pPrNode, 'w:pStyle');
  if (styleId) paraProps.styleId = styleId;

  const keepNext = parseOnOffProperty(pPrNode, 'w:keepNext');
  if (keepNext !== undefined) paraProps.keepNext = keepNext;

  const keepLines = parseOnOffProperty(pPrNode, 'w:keepLines');
  if (keepLines !== undefined) paraProps.keepLines = keepLines;

  const pageBreakBefore = parseOnOffProperty(pPrNode, 'w:pageBreakBefore');
  if (pageBreakBefore !== undefined) paraProps.pageBreakBefore = pageBreakBefore;

  const widowControl = parseOnOffProperty(pPrNode, 'w:widowControl');
  if (widowControl !== undefined) paraProps.widowControl = widowControl;
  
  const jc = parseValAttribute(pPrNode, 'w:jc');
  if (jc && AlignmentEnum.safeParse(jc).success) {
    paraProps.alignment = jc as AlignmentEnum;
  }

  const spacingNode = getElement(pPrNode, 'w:spacing');
  if (spacingNode) {
    const spacing: SpacingProperties = {};
    const before = getAttribute(spacingNode, 'w:before');
    if (before) spacing.before = parseInt(before, 10);
    const after = getAttribute(spacingNode, 'w:after');
    if (after) spacing.after = parseInt(after, 10);
    const line = getAttribute(spacingNode, 'w:line');
    if (line) spacing.line = parseInt(line, 10);
    const lineRuleAttr = getAttribute(spacingNode, 'w:lineRule');
    if (lineRuleAttr && LineRuleEnum.safeParse(lineRuleAttr).success) {
      spacing.lineRule = lineRuleAttr as LineRuleEnum;
    }
    const afterAutospacingAttr = getAttribute(spacingNode, 'w:afterAutospacing');
    if (afterAutospacingAttr !== undefined) spacing.afterAutospacing = getElementBooleanAttribute(spacingNode, 'w:afterAutospacing');
    const beforeAutospacingAttr = getAttribute(spacingNode, 'w:beforeAutospacing');
    if (beforeAutospacingAttr !== undefined) spacing.beforeAutospacing = getElementBooleanAttribute(spacingNode, 'w:beforeAutospacing');
    
    if (Object.keys(spacing).length > 0) paraProps.spacing = spacing;
  }

  const indNode = getElement(pPrNode, 'w:ind');
  if (indNode) {
    const indentation: IndentationProperties = {};
    const left = getAttribute(indNode, 'w:left');
    if (left) indentation.left = parseInt(left, 10);
    const right = getAttribute(indNode, 'w:right');
    if (right) indentation.right = parseInt(right, 10);
    const firstLine = getAttribute(indNode, 'w:firstLine');
    if (firstLine) indentation.firstLine = parseInt(firstLine, 10);
    const hanging = getAttribute(indNode, 'w:hanging');
    if (hanging) indentation.hanging = parseInt(hanging, 10);
    const start = getAttribute(indNode, 'w:start');
    if (start) indentation.start = parseInt(start, 10);
    const end = getAttribute(indNode, 'w:end');
    if (end) indentation.end = parseInt(end, 10);
    if (Object.keys(indentation).length > 0) paraProps.indentation = indentation;
  }
  
  const numPrNode = getElement(pPrNode, 'w:numPr');
  if (numPrNode) {
    const ilvlNode = getElement(numPrNode, 'w:ilvl');
    const numIdNode = getElement(numPrNode, 'w:numId');
    const level = ilvlNode ? getAttribute(ilvlNode, 'w:val') : undefined;
    const instanceId = numIdNode ? getAttribute(numIdNode, 'w:val') : undefined;
    if (level !== undefined && instanceId !== undefined) {
      const parsedLevel = parseInt(level, 10);
      if (!isNaN(parsedLevel)) { // Ensure level is a valid number
         paraProps.numbering = { instanceId, level: parsedLevel };
      }
    }
  }

  // Corrected Tab Parsing Logic
  const tabsNode = getElement(pPrNode, 'w:tabs');
  if (tabsNode) {
    const tabElements = getElements(tabsNode, 'w:tab');
    const parsedTabs: TabDefinition[] = [];
    for (const tabNode of tabElements) {
      const typeAttr = getAttribute(tabNode, 'w:val');
      const posAttr = getAttribute(tabNode, 'w:pos');
      const leaderAttr = getAttribute(tabNode, 'w:leader');

      // Only proceed if type and position are valid
      if (typeAttr && TabStopTypeEnum.safeParse(typeAttr).success && posAttr) {
        const position = parseInt(posAttr, 10);
        if (isNaN(position)) continue; // Skip if position is not a valid number

        const tabDef: TabDefinition = {
          type: typeAttr as TabStopType,
          position: position,
        };

        if (leaderAttr && TabStopLeaderEnum.safeParse(leaderAttr).success) {
          tabDef.leader = leaderAttr as TabStopLeader;
        }
        parsedTabs.push(tabDef);
      }
      // Tabs with invalid or missing 'w:val' (type) or missing 'w:pos' are skipped
    }
    if (parsedTabs.length > 0) {
      paraProps.tabs = parsedTabs;
    }
  }
  
  const pBdrNode = getElement(pPrNode, 'w:pBdr');
  if (pBdrNode) {
    const borders: ParagraphBorders = {};
    const topBorder = parseIndividualBorder(getElement(pBdrNode, 'w:top'));
    if (topBorder) borders.top = topBorder;
    const bottomBorder = parseIndividualBorder(getElement(pBdrNode, 'w:bottom'));
    if (bottomBorder) borders.bottom = bottomBorder;
    const leftBorder = parseIndividualBorder(getElement(pBdrNode, 'w:left'));
    if (leftBorder) borders.left = leftBorder;
    const rightBorder = parseIndividualBorder(getElement(pBdrNode, 'w:right'));
    if (rightBorder) borders.right = rightBorder;
    const betweenBorder = parseIndividualBorder(getElement(pBdrNode, 'w:between'));
    if (betweenBorder) borders.between = betweenBorder;
    const barBorder = parseIndividualBorder(getElement(pBdrNode, 'w:bar'));
    if (barBorder) borders.bar = barBorder;
    if (Object.keys(borders).length > 0) paraProps.borders = borders;
  }

  const shdNode = getElement(pPrNode, 'w:shd');
  if (shdNode) {
    const shading: ShadingProperties = {};
    const type = getAttribute(shdNode, 'w:val');
    if (type && ShadingPatternEnum.safeParse(type).success) {
      shading.type = type as ShadingPatternEnum;
    }
    const color = getAttribute(shdNode, 'w:color');
    if (color) shading.color = color;
    const fill = getAttribute(shdNode, 'w:fill');
    if (fill) shading.fill = fill;
    if (Object.keys(shading).length > 0) paraProps.shading = shading;
  }
  
  const rPrNode = getElement(pPrNode, 'w:rPr');
  if (rPrNode) {
    const runProps = parseRunProperties(rPrNode);
    if (runProps) paraProps.runProperties = runProps;
  }

  return Object.keys(paraProps).length > 0 ? paraProps : undefined;
}
