/**
 * XML Namespaces used in DOCX documents
 * These constants define the XML namespaces required for parsing DOCX files
 */

export const XML_NAMESPACES = {
  // Main document namespace
  W: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',

  // Relationships namespace
  R: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',

  // Package relationships namespace
  PR: 'http://schemas.openxmlformats.org/package/2006/relationships',

  // Content types namespace
  CT: 'http://schemas.openxmlformats.org/package/2006/content-types',

  // Drawing namespace
  WP: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',

  // Picture namespace
  PIC: 'http://schemas.openxmlformats.org/drawingml/2006/picture',

  // Drawing main namespace
  A: 'http://schemas.openxmlformats.org/drawingml/2006/main',

  // Math namespace
  M: 'http://schemas.openxmlformats.org/officeDocument/2006/math',

  // VML namespace
  V: 'urn:schemas-microsoft-com:vml',

  // Office namespace
  O: 'urn:schemas-microsoft-com:office:office',

  // Word VML namespace
  W10: 'urn:schemas-microsoft-com:office:word',

  // XML namespace
  XML: 'http://www.w3.org/XML/1998/namespace',
} as const;

/**
 * Common XML namespace prefixes used in DOCX parsing
 */
export const NAMESPACE_PREFIXES = {
  w: XML_NAMESPACES.W,
  r: XML_NAMESPACES.R,
  pr: XML_NAMESPACES.PR,
  ct: XML_NAMESPACES.CT,
  wp: XML_NAMESPACES.WP,
  pic: XML_NAMESPACES.PIC,
  a: XML_NAMESPACES.A,
  m: XML_NAMESPACES.M,
  v: XML_NAMESPACES.V,
  o: XML_NAMESPACES.O,
  w10: XML_NAMESPACES.W10,
  xml: XML_NAMESPACES.XML,
} as const;

/**
 * Relationship types used in DOCX documents
 */
export const RELATIONSHIP_TYPES = {
  DOCUMENT: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
  STYLES: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
  NUMBERING: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering',
  THEME: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
  FONT_TABLE: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable',
  WEB_SETTINGS: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings',
  SETTINGS: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings',
  HYPERLINK: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
  IMAGE: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
  HEADER: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header',
  FOOTER: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer',
} as const;

/**
 * Content types used in DOCX documents
 */
export const CONTENT_TYPES = {
  DOCUMENT: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
  STYLES: 'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml',
  NUMBERING: 'application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml',
  THEME: 'application/vnd.openxmlformats-officedocument.theme+xml',
  FONT_TABLE: 'application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml',
  WEB_SETTINGS: 'application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml',
  SETTINGS: 'application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml',
  HEADER: 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml',
  FOOTER: 'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  BMP: 'image/bmp',
  TIFF: 'image/tiff',
} as const;

export type XmlNamespace = keyof typeof XML_NAMESPACES;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[keyof typeof RELATIONSHIP_TYPES];
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];
