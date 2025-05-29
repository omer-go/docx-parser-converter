/**
 * Default values and constants used throughout the DOCX parsing process
 */

/**
 * Default font settings
 */
export const DEFAULT_FONT = {
  NAME: 'Calibri',
  SIZE: 11, // in points
  COLOR: '#000000',
} as const;

/**
 * Default spacing and measurement values
 */
export const DEFAULT_SPACING = {
  LINE_HEIGHT: 1.15,
  PARAGRAPH_SPACING_BEFORE: 0,
  PARAGRAPH_SPACING_AFTER: 8, // in points
  INDENT_LEFT: 0,
  INDENT_RIGHT: 0,
  INDENT_FIRST_LINE: 0,
  INDENT_HANGING: 0,
} as const;

/**
 * Default table settings
 */
export const DEFAULT_TABLE = {
  BORDER_WIDTH: 0.5, // in points
  BORDER_COLOR: '#000000',
  BORDER_STYLE: 'single',
  CELL_PADDING: 0, // in points
  CELL_SPACING: 0, // in points
} as const;

/**
 * Default page settings
 */
export const DEFAULT_PAGE = {
  WIDTH: 8.5, // in inches
  HEIGHT: 11, // in inches
  MARGIN_TOP: 1, // in inches
  MARGIN_BOTTOM: 1, // in inches
  MARGIN_LEFT: 1, // in inches
  MARGIN_RIGHT: 1, // in inches
} as const;

/**
 * Unit conversion constants
 */
export const UNITS = {
  // Twips to other units
  TWIPS_PER_INCH: 1440,
  TWIPS_PER_CM: 566.929,
  TWIPS_PER_MM: 56.6929,
  TWIPS_PER_POINT: 20,
  TWIPS_PER_PICA: 240,

  // Points to other units
  POINTS_PER_INCH: 72,
  POINTS_PER_CM: 28.3465,
  POINTS_PER_MM: 2.83465,

  // EMU (English Metric Units) conversions
  EMU_PER_INCH: 914400,
  EMU_PER_CM: 360000,
  EMU_PER_MM: 36000,
  EMU_PER_POINT: 12700,

  // DXA (Twentieths of a point) conversions
  DXA_PER_INCH: 1440,
  DXA_PER_CM: 566.929,
  DXA_PER_MM: 56.6929,
  DXA_PER_POINT: 20,
} as const;

/**
 * Default numbering settings
 */
export const DEFAULT_NUMBERING = {
  BULLET_CHAR: '•',
  INDENT_PER_LEVEL: 0.5, // in inches
  TAB_STOP_POSITION: 0.5, // in inches
} as const;

/**
 * Default style names
 */
export const DEFAULT_STYLES = {
  NORMAL: 'Normal',
  HEADING_1: 'Heading1',
  HEADING_2: 'Heading2',
  HEADING_3: 'Heading3',
  HEADING_4: 'Heading4',
  HEADING_5: 'Heading5',
  HEADING_6: 'Heading6',
  TITLE: 'Title',
  SUBTITLE: 'Subtitle',
  LIST_PARAGRAPH: 'ListParagraph',
  QUOTE: 'Quote',
  CAPTION: 'Caption',
} as const;

/**
 * HTML/CSS related defaults
 */
export const HTML_DEFAULTS = {
  FONT_FAMILY: 'Calibri, sans-serif',
  FONT_SIZE: '11pt',
  LINE_HEIGHT: '1.15',
  MARGIN: '0',
  PADDING: '0',
  COLOR: '#000000',
  BACKGROUND_COLOR: 'transparent',
} as const;

/**
 * Text formatting defaults
 */
export const TEXT_DEFAULTS = {
  BOLD: false,
  ITALIC: false,
  UNDERLINE: false,
  STRIKE: false,
  SUBSCRIPT: false,
  SUPERSCRIPT: false,
  SMALL_CAPS: false,
  ALL_CAPS: false,
  HIDDEN: false,
} as const;

/**
 * Alignment constants
 */
export const ALIGNMENT = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
  DISTRIBUTE: 'distribute',
} as const;

/**
 * Border style constants
 */
export const BORDER_STYLES = {
  NONE: 'none',
  SINGLE: 'single',
  DOUBLE: 'double',
  DOTTED: 'dotted',
  DASHED: 'dashed',
  DOT_DASH: 'dotDash',
  DOT_DOT_DASH: 'dotDotDash',
  TRIPLE: 'triple',
  THICK_THIN_SMALL_GAP: 'thickThinSmallGap',
  THIN_THICK_SMALL_GAP: 'thinThickSmallGap',
  THIN_THICK_THIN_SMALL_GAP: 'thinThickThinSmallGap',
  THICK_THIN_MEDIUM_GAP: 'thickThinMediumGap',
  THIN_THICK_MEDIUM_GAP: 'thinThickMediumGap',
  THIN_THICK_THIN_MEDIUM_GAP: 'thinThickThinMediumGap',
  THICK_THIN_LARGE_GAP: 'thickThinLargeGap',
  THIN_THICK_LARGE_GAP: 'thinThickLargeGap',
  THIN_THICK_THIN_LARGE_GAP: 'thinThickThinLargeGap',
  WAVE: 'wave',
  DOUBLE_WAVE: 'doubleWave',
  DASH_SMALL_GAP: 'dashSmallGap',
  DASH_DOT_STROKED: 'dashDotStroked',
  THREE_D_EMBOSS: 'threeDEmboss',
  THREE_D_ENGRAVE: 'threeDEngrave',
  OUTSET: 'outset',
  INSET: 'inset',
} as const;

/**
 * Numbering format constants
 */
export const NUMBERING_FORMATS = {
  DECIMAL: 'decimal',
  UPPER_ROMAN: 'upperRoman',
  LOWER_ROMAN: 'lowerRoman',
  UPPER_LETTER: 'upperLetter',
  LOWER_LETTER: 'lowerLetter',
  ORDINAL: 'ordinal',
  CARDINAL_TEXT: 'cardinalText',
  ORDINAL_TEXT: 'ordinalText',
  HEX: 'hex',
  CHICAGO: 'chicago',
  IDEOGRAPH_DIGITAL: 'ideographDigital',
  JAPANESE_COUNTING: 'japaneseCounting',
  AIUEO: 'aiueo',
  IROHA: 'iroha',
  DECIMAL_FULL_WIDTH: 'decimalFullWidth',
  DECIMAL_HALF_WIDTH: 'decimalHalfWidth',
  JAPANESE_LEGAL: 'japaneseLegal',
  JAPANESE_DIGITAL_TEN_THOUSAND: 'japaneseDigitalTenThousand',
  DECIMAL_ENCLOSED_CIRCLE: 'decimalEnclosedCircle',
  DECIMAL_FULL_WIDTH2: 'decimalFullWidth2',
  AIUEO_FULL_WIDTH: 'aiueoFullWidth',
  IROHA_FULL_WIDTH: 'irohaFullWidth',
  DECIMAL_ZERO: 'decimalZero',
  BULLET: 'bullet',
  GANADA: 'ganada',
  CHOSUNG: 'chosung',
  DECIMAL_ENCLOSED_FULLSTOP: 'decimalEnclosedFullstop',
  DECIMAL_ENCLOSED_PAREN: 'decimalEnclosedParen',
  DECIMAL_ENCLOSED_CIRCLE_CHINESE: 'decimalEnclosedCircleChinese',
  IDEOGRAPH_ENCLOSED_CIRCLE: 'ideographEnclosedCircle',
  IDEOGRAPH_TRADITIONAL: 'ideographTraditional',
  IDEOGRAPH_ZODIAC: 'ideographZodiac',
  IDEOGRAPH_ZODIAC_TRADITIONAL: 'ideographZodiacTraditional',
  TAIWANESE_COUNTING: 'taiwaneseCounting',
  IDEOGRAPH_LEGAL_TRADITIONAL: 'ideographLegalTraditional',
  TAIWANESE_COUNTING_THOUSAND: 'taiwaneseCountingThousand',
  TAIWANESE_DIGITAL: 'taiwaneseDigital',
  CHINESE_COUNTING: 'chineseCounting',
  CHINESE_LEGAL_SIMPLIFIED: 'chineseLegalSimplified',
  CHINESE_COUNTING_THOUSAND: 'chineseCountingThousand',
  KOREAN_DIGITAL: 'koreanDigital',
  KOREAN_COUNTING: 'koreanCounting',
  KOREAN_LEGAL: 'koreanLegal',
  KOREAN_DIGITAL2: 'koreanDigital2',
  VIETNAMESE_COUNTING: 'vietnameseCounting',
  RUSSIAN_LOWER: 'russianLower',
  RUSSIAN_UPPER: 'russianUpper',
  NONE: 'none',
  NUMBER_IN_DASH: 'numberInDash',
  HEBREW1: 'hebrew1',
  HEBREW2: 'hebrew2',
  ARABIC_ALPHA: 'arabicAlpha',
  ARABIC_ABJAD: 'arabicAbjad',
  HINDI_VOWELS: 'hindiVowels',
  HINDI_CONSONANTS: 'hindiConsonants',
  HINDI_NUMBERS: 'hindiNumbers',
  HINDI_COUNTING: 'hindiCounting',
  THAI_LETTERS: 'thaiLetters',
  THAI_NUMBERS: 'thaiNumbers',
  THAI_COUNTING: 'thaiCounting',
} as const;

export type AlignmentType = (typeof ALIGNMENT)[keyof typeof ALIGNMENT];
export type BorderStyleType = (typeof BORDER_STYLES)[keyof typeof BORDER_STYLES];
export type NumberingFormatType = (typeof NUMBERING_FORMATS)[keyof typeof NUMBERING_FORMATS];
