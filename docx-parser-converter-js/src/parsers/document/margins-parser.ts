// src/parsers/document/margins-parser.ts
import { PageMargins } from '../../models/document-models';
import { getAttribute } from '../../utils/xml-utils'; // Using getAttribute directly for attributes of pgMar

export function parsePageMargins(pgMarNode: any): PageMargins | undefined {
  if (!pgMarNode || typeof pgMarNode !== 'object' || Object.keys(pgMarNode).length === 0) {
    return undefined;
  }

  const margins: PageMargins = {};

  const top = getAttribute(pgMarNode, 'w:top');
  if (top !== undefined) margins.top = parseInt(top, 10);

  const right = getAttribute(pgMarNode, 'w:right');
  if (right !== undefined) margins.right = parseInt(right, 10);

  const bottom = getAttribute(pgMarNode, 'w:bottom');
  if (bottom !== undefined) margins.bottom = parseInt(bottom, 10);

  const left = getAttribute(pgMarNode, 'w:left');
  if (left !== undefined) margins.left = parseInt(left, 10);

  const header = getAttribute(pgMarNode, 'w:header');
  if (header !== undefined) margins.header = parseInt(header, 10);

  const footer = getAttribute(pgMarNode, 'w:footer');
  if (footer !== undefined) margins.footer = parseInt(footer, 10);

  const gutter = getAttribute(pgMarNode, 'w:gutter');
  if (gutter !== undefined) margins.gutter = parseInt(gutter, 10);
  
  // Validate that at least one margin was parsed correctly (not NaN)
  // and that the resulting object is not empty.
  // parseInt will return NaN for non-numeric strings, which might not be caught by '!= undefined' alone.
  // The PageMargins model uses NonNegativeIntSchema, so Zod validation would catch NaNs later.
  // For now, we ensure the object isn't empty.
  let hasValidMargin = false;
  for (const key in margins) {
    if (margins[key as keyof PageMargins] !== undefined && !isNaN(margins[key as keyof PageMargins] as number) ) {
      hasValidMargin = true;
      break;
    }
  }

  return hasValidMargin ? margins : undefined;
}
