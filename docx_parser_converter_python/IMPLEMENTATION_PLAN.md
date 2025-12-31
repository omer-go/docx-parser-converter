# DOCX Parser Converter - Implementation Plan

## Overview

This document outlines the test-driven implementation plan for the `docx_parser_converter` library. We follow a strict TDD approach: write tests first, then implement the functionality.

**Key Principles:**
1. **Refactoring focus** - Goal is to refactor existing code, not add new features
2. **Existing fixtures first** - Focus on tags already covered by current fixtures
3. **Absolute imports** - All imports use absolute paths from package root
4. **Centralized constants** - XML namespaces defined once in `constants.py`
5. **Parser mapper** - Centralized routing for mixed content parsing

---

## Phase 0: Core Infrastructure

### 0.1 DOCX Reader & Extractor

Before any parsing, we need utilities to read and extract DOCX files.

**Files to implement:**
```
core/
├── __init__.py
├── constants.py        # XML namespaces and constants
├── docx_reader.py      # Read DOCX from path/bytes/file-like
├── xml_extractor.py    # Extract specific XML parts
└── exceptions.py       # Custom exceptions
```

### 0.2 Constants Module

Centralized constants to avoid duplication across files:

```python
# core/constants.py
"""XML namespaces and constants for DOCX parsing."""

# XML Namespaces (with curly braces for lxml)
WORD_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
CONTENT_TYPES_NS = "{http://schemas.openxmlformats.org/package/2006/content-types}"
DRAWING_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
WP_NS = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"
R_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# Namespace map for XPath queries (without curly braces)
NSMAP = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

# File paths within DOCX archive
DOCUMENT_XML_PATH = "word/document.xml"
STYLES_XML_PATH = "word/styles.xml"
NUMBERING_XML_PATH = "word/numbering.xml"
RELS_XML_PATH = "word/_rels/document.xml.rels"
CONTENT_TYPES_PATH = "[Content_Types].xml"

# Logger name
LOGGER_NAME = "docx_parser_converter"
```

**Core Functions:**

```python
# docx_reader.py
def open_docx(source: str | Path | bytes | BinaryIO) -> ZipFile:
    """Open DOCX and return ZipFile handle."""

def validate_docx(zip_file: ZipFile) -> None:
    """Validate DOCX structure (required parts, content types)."""

# xml_extractor.py
def extract_document_xml(zip_file: ZipFile) -> Element:
    """Extract and parse word/document.xml."""

def extract_styles_xml(zip_file: ZipFile) -> Element | None:
    """Extract and parse word/styles.xml (optional)."""

def extract_numbering_xml(zip_file: ZipFile) -> Element | None:
    """Extract and parse word/numbering.xml (optional)."""

def extract_relationships(zip_file: ZipFile) -> dict[str, str]:
    """Extract document relationships for hyperlinks etc."""
```

### 0.3 Parser Mapper (Router)

A centralized mapper to route XML tags to their appropriate parsers. This is especially useful for mixed content where multiple element types can appear.

**Files to implement:**
```
parsers/
├── mapper.py           # Tag-to-parser routing
└── ...
```

**Implementation:**

```python
# parsers/mapper.py
"""Centralized mapper for routing XML tags to parsers."""
from typing import Callable, Any
from lxml.etree import _Element as Element

from core.constants import WORD_NS

# Type alias for parser functions
ParserFunc = Callable[[Element], Any]


class ParserMapper:
    """Maps XML tag names to their parser functions.

    Use for mixed content parsing where multiple element types
    can appear (e.g., run children, body children).
    """

    def __init__(self) -> None:
        self._parsers: dict[str, ParserFunc] = {}

    def register(self, tag_name: str, parser: ParserFunc) -> None:
        """Register a parser for a tag name.

        Args:
            tag_name: Tag name without namespace (e.g., "t", "br", "tab")
            parser: Parser function that takes Element and returns model
        """
        full_tag = f"{WORD_NS}{tag_name}"
        self._parsers[full_tag] = parser

    def get_parser(self, element: Element) -> ParserFunc | None:
        """Get parser for an element.

        Args:
            element: XML element to find parser for

        Returns:
            Parser function or None if not registered
        """
        return self._parsers.get(element.tag)

    def parse(self, element: Element) -> Any:
        """Parse element using registered parser.

        Args:
            element: XML element to parse

        Returns:
            Parsed model or None if no parser registered
        """
        parser = self.get_parser(element)
        if parser is None:
            return None
        return parser(element)

    def is_registered(self, tag_name: str) -> bool:
        """Check if a tag has a registered parser."""
        full_tag = f"{WORD_NS}{tag_name}"
        return full_tag in self._parsers

    @property
    def registered_tags(self) -> list[str]:
        """Get list of registered tag names (without namespace)."""
        prefix_len = len(WORD_NS)
        return [tag[prefix_len:] for tag in self._parsers.keys()]


# Pre-configured mappers for common use cases

def create_run_content_mapper() -> ParserMapper:
    """Create mapper for run content elements (<w:r> children).

    Maps: t, br, tab, cr, softHyphen, noBreakHyphen, sym, etc.
    """
    from parsers.document.text_parser import parse_text
    from parsers.document.break_parser import parse_break
    from parsers.document.tab_parser import parse_tab

    mapper = ParserMapper()
    mapper.register("t", parse_text)
    mapper.register("br", parse_break)
    mapper.register("tab", parse_tab)
    # Add more as implemented...
    return mapper


def create_body_content_mapper() -> ParserMapper:
    """Create mapper for body content elements (<w:body> children).

    Maps: p, tbl, sdt, etc.
    """
    from parsers.document.paragraph_parser import parse_paragraph
    from parsers.document.table_parser import parse_table

    mapper = ParserMapper()
    mapper.register("p", parse_paragraph)
    mapper.register("tbl", parse_table)
    # Add more as implemented...
    return mapper


def create_paragraph_content_mapper() -> ParserMapper:
    """Create mapper for paragraph content elements (<w:p> children).

    Maps: r, hyperlink, bookmarkStart, bookmarkEnd, etc.
    """
    from parsers.document.run_parser import parse_run
    # from parsers.document.hyperlink_parser import parse_hyperlink

    mapper = ParserMapper()
    mapper.register("r", parse_run)
    # mapper.register("hyperlink", parse_hyperlink)
    # Add more as implemented...
    return mapper
```

**Usage in parsers:**

```python
# parsers/document/run_parser.py
from parsers.mapper import create_run_content_mapper
from core.constants import WORD_NS

# Create mapper once at module level
_content_mapper = create_run_content_mapper()


def parse_run(element: Element | None) -> Run | None:
    if element is None:
        return None

    # Parse properties
    r_pr_elem = element.find(f"{WORD_NS}rPr")
    r_pr = parse_run_properties(r_pr_elem)

    # Parse content using mapper
    content = []
    for child in element:
        parsed = _content_mapper.parse(child)
        if parsed is not None:
            content.append(parsed)

    return Run(r_pr=r_pr, content=content)
```

---

## Phase 1: Fixture Reorganization

### 1.1 Current Fixtures

The existing fixtures in `/fixtures/test_docx_files/` contain the vast majority of tags we need. These will be reorganized into logical groups.

### 1.2 Proposed Fixture Structure

```
fixtures/
├── text_formatting/
│   ├── bold_italic.docx           # Basic text formatting (b, i, u, strike)
│   ├── fonts_sizes.docx           # Font families, sizes (rFonts, sz, szCs)
│   ├── colors.docx                # Text colors (color, highlight)
│   ├── text_effects.docx          # Underlines, strikethrough variants
│   └── subscript_superscript.docx # Vertical alignment (vertAlign)
│
├── paragraph_formatting/
│   ├── alignment.docx             # Justification (jc: left, center, right, both)
│   ├── indentation.docx           # Indents (ind: left, right, hanging, firstLine)
│   ├── spacing.docx               # Line/paragraph spacing (spacing: before, after, line)
│   ├── borders_shading.docx       # Paragraph borders and shading (pBdr, shd)
│   └── tabs.docx                  # Tab stops (tabs, tab)
│
├── lists_numbering/
│   ├── bullets.docx               # Bullet lists (numPr, abstractNum)
│   ├── numbered.docx              # Numbered lists (numFmt: decimal, lowerLetter, etc.)
│   ├── multilevel.docx            # Multi-level lists (ilvl, nested levels)
│   └── restart_continue.docx      # List restart/continue scenarios
│
├── tables/
│   ├── simple_table.docx          # Basic table (tbl, tr, tc)
│   ├── merged_cells.docx          # Cell merging (gridSpan, vMerge)
│   ├── borders_styles.docx        # Table borders (tblBorders, tcBorders)
│   ├── widths_layout.docx         # Column widths, layout (tblW, tcW, tblLayout)
│   ├── cell_formatting.docx       # Cell properties (vAlign, shd, tcMar)
│   └── nested_tables.docx         # Tables within tables
│
├── styles/
│   ├── paragraph_styles.docx      # Paragraph styles (pStyle, basedOn)
│   ├── character_styles.docx      # Character/run styles (rStyle)
│   ├── table_styles.docx          # Table styles (tblStyle)
│   ├── style_inheritance.docx     # Style chain (basedOn hierarchy)
│   └── document_defaults.docx     # Default styles (docDefaults)
│
├── special_content/
│   ├── breaks.docx                # Line/page/column breaks (br, sectPr)
│   ├── whitespace.docx            # Whitespace preservation (xml:space)
│   └── empty_paragraphs.docx      # Empty paragraph handling
│
└── comprehensive/
    ├── mixed_content.docx         # Complex document with all features
    └── edge_cases.docx            # Edge cases and unusual combinations
```

### 1.3 Fixture Creation Tasks

| Group | From Existing | New Fixtures Needed |
|-------|---------------|---------------------|
| text_formatting | Extract from existing | None (well covered) |
| paragraph_formatting | Extract from existing | tabs.docx |
| lists_numbering | Extract from existing | restart_continue.docx |
| tables | Extract from existing | nested_tables.docx |
| styles | Extract from existing | style_inheritance.docx |
| special_content | Extract from existing | whitespace.docx |

### 1.4 Current Fixture Coverage

Based on analysis of `/fixtures/test_docx_files/`, we have **~45-50% coverage** of documented XML elements.

### 1.5 XML Tags NOT Covered by Fixtures (Future Phase)

> **Note**: These are documented for completeness but NOT the current focus.
> The refactoring phase focuses on existing fixtures only.

The following tags are documented in our schemas but **missing from test fixtures**:

#### Document Structure (Critical)
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:hyperlink>` | External hyperlinks | HIGH |
| `<w:sectPr>` | Section properties | HIGH |
| `<w:headerReference>` | Header reference | MEDIUM |
| `<w:footerReference>` | Footer reference | MEDIUM |
| `<w:footnoteReference>` | Footnote reference | LOW |
| `<w:endnoteReference>` | Endnote reference | LOW |

#### Run Content Elements (Critical)
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:softHyphen>` | Soft hyphen character | HIGH |
| `<w:noBreakHyphen>` | Non-breaking hyphen | HIGH |
| `<w:sym>` | Symbol character | MEDIUM |
| `<w:cr>` | Carriage return | MEDIUM |
| `<w:fldChar>` | Field character (begin/separate/end) | LOW |
| `<w:instrText>` | Field instruction text | LOW |
| `<w:object>` | Embedded OLE object | LOW |
| `<w:drawing>` | Drawing/image container | LOW |

#### Paragraph Properties
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:keepNext>` | Keep with next paragraph | HIGH |
| `<w:keepLines>` | Keep lines together | HIGH |
| `<w:pageBreakBefore>` | Page break before | HIGH |
| `<w:widowControl>` | Widow/orphan control | MEDIUM |
| `<w:suppressLineNumbers>` | Suppress line numbers | LOW |
| `<w:suppressAutoHyphens>` | Suppress auto hyphenation | LOW |
| `<w:wordWrap>` | Word wrap | LOW |
| `<w:overflowPunct>` | Overflow punctuation | LOW |
| `<w:topLinePunct>` | Top line punctuation | LOW |
| `<w:autoSpaceDE>` | Auto space DE | LOW |
| `<w:autoSpaceDN>` | Auto space DN | LOW |
| `<w:adjustRightInd>` | Adjust right indent | LOW |
| `<w:snapToGrid>` | Snap to grid | LOW |
| `<w:contextualSpacing>` | Contextual spacing | MEDIUM |
| `<w:mirrorIndents>` | Mirror indents | LOW |
| `<w:textboxTightWrap>` | Textbox tight wrap | LOW |
| `<w:outlineLvl>` | Outline level | MEDIUM |
| `<w:divId>` | HTML div ID | LOW |

#### Run Properties
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:caps>` | All caps | HIGH |
| `<w:smallCaps>` | Small caps | HIGH |
| `<w:dstrike>` | Double strikethrough | HIGH |
| `<w:outline>` | Outline effect | MEDIUM |
| `<w:shadow>` | Shadow effect | MEDIUM |
| `<w:emboss>` | Emboss effect | LOW |
| `<w:imprint>` | Imprint/engrave effect | LOW |
| `<w:snapToGrid>` | Snap to grid | LOW |
| `<w:vanish>` | Hidden text | MEDIUM |
| `<w:webHidden>` | Web hidden | LOW |
| `<w:spacing>` | Character spacing | HIGH |
| `<w:w>` | Character width scaling | MEDIUM |
| `<w:kern>` | Kerning | LOW |
| `<w:position>` | Text position | MEDIUM |
| `<w:effect>` | Text animation effect | LOW |
| `<w:bdr>` | Character border | MEDIUM |
| `<w:fitText>` | Fit text | LOW |
| `<w:noProof>` | No proofing | LOW |
| `<w:oMath>` | Office Math | LOW |
| `<w:rStyle>` | Run style reference | HIGH |
| `<w:specVanish>` | Special vanish | LOW |
| `<w:em>` | Emphasis mark | LOW |
| `<w:lang>` | Language | MEDIUM |
| `<w:eastAsianLayout>` | East Asian layout | LOW |

#### Table Properties
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:tblCaption>` | Table caption | MEDIUM |
| `<w:tblDescription>` | Table description | MEDIUM |
| `<w:tblOverlap>` | Table overlap | LOW |
| `<w:bidiVisual>` | Bidirectional visual | LOW |
| `<w:tblStyleRowBandSize>` | Row band size | LOW |
| `<w:tblStyleColBandSize>` | Column band size | LOW |

#### Table Cell Properties
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:cnfStyle>` | Conditional formatting flags | MEDIUM |
| `<w:tcFitText>` | Fit text in cell | LOW |
| `<w:noWrap>` | No wrap | MEDIUM |
| `<w:hideMark>` | Hide cell marker | LOW |
| `<w:cellDel>` | Cell deletion | LOW |
| `<w:cellIns>` | Cell insertion | LOW |
| `<w:cellMerge>` | Cell merge | HIGH |

#### Table Row Properties
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:divId>` | HTML div ID | LOW |
| `<w:gridBefore>` | Grid columns before | MEDIUM |
| `<w:gridAfter>` | Grid columns after | MEDIUM |
| `<w:wBefore>` | Width before | MEDIUM |
| `<w:wAfter>` | Width after | MEDIUM |
| `<w:cantSplit>` | Can't split row | HIGH |
| `<w:hidden>` | Hidden row | MEDIUM |
| `<w:jc>` | Row justification | HIGH |
| `<w:ins>` | Row insertion | LOW |
| `<w:del>` | Row deletion | LOW |
| `<w:trPrChange>` | Row property change | LOW |

#### Styles Elements
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:latentStyles>` | Latent styles container | LOW |
| `<w:lsdException>` | Latent style exception | LOW |
| `<w:tblStylePr>` | Table style conditional formatting | HIGH |
| `<w:aliases>` | Style aliases | LOW |
| `<w:autoRedefine>` | Auto-redefine style | LOW |
| `<w:hidden>` | Hidden style | LOW |
| `<w:semiHidden>` | Semi-hidden style | LOW |
| `<w:unhideWhenUsed>` | Unhide when used | LOW |
| `<w:locked>` | Locked style | LOW |
| `<w:personal>` | Personal style | LOW |
| `<w:personalCompose>` | Personal compose | LOW |
| `<w:personalReply>` | Personal reply | LOW |

#### Numbering Elements
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:multiLevelType>` | Multi-level list type | HIGH |
| `<w:numStyleLink>` | Numbering style link | MEDIUM |
| `<w:styleLink>` | Style link | MEDIUM |
| `<w:isLgl>` | Legal numbering style | LOW |
| `<w:legacy>` | Legacy numbering | LOW |
| `<w:lvlRestart>` | Level restart | HIGH |
| `<w:pStyle>` | Paragraph style for level | HIGH |
| `<w:lvlPicBulletId>` | Picture bullet ID | LOW |
| `<w:lvlOverride>` | Level override in num | HIGH |
| `<w:startOverride>` | Start value override | HIGH |

#### Section Properties
| Tag | Description | Priority |
|-----|-------------|----------|
| `<w:type>` | Section type (continuous, nextPage, etc.) | HIGH |
| `<w:pgSz>` | Page size | MEDIUM |
| `<w:pgMar>` | Page margins | MEDIUM |
| `<w:paperSrc>` | Paper source | LOW |
| `<w:pgBorders>` | Page borders | LOW |
| `<w:lnNumType>` | Line numbering | LOW |
| `<w:pgNumType>` | Page numbering | LOW |
| `<w:cols>` | Column settings | MEDIUM |
| `<w:formProt>` | Form protection | LOW |
| `<w:vAlign>` | Vertical alignment | MEDIUM |
| `<w:noEndnote>` | No endnotes | LOW |
| `<w:titlePg>` | Title page | LOW |
| `<w:textDirection>` | Text direction | MEDIUM |
| `<w:bidi>` | Bidirectional section | MEDIUM |
| `<w:rtlGutter>` | RTL gutter | LOW |
| `<w:docGrid>` | Document grid | LOW |

---

## Phase 2: Test-Driven Development Phases

### 2.1 Test Structure

```
tests/
├── conftest.py                    # Shared fixtures
├── fixtures/                      # Test DOCX files (symlink to main fixtures)
├── unit/
│   ├── core/
│   │   ├── test_docx_reader.py
│   │   └── test_xml_extractor.py
│   ├── parsers/
│   │   ├── common/
│   │   │   ├── test_border_parser.py
│   │   │   ├── test_color_parser.py
│   │   │   ├── test_spacing_parser.py
│   │   │   ├── test_width_parser.py
│   │   │   └── test_indentation_parser.py
│   │   ├── document/
│   │   │   ├── test_paragraph_parser.py
│   │   │   ├── test_run_parser.py
│   │   │   ├── test_table_parser.py
│   │   │   └── ... (all document parsers)
│   │   ├── styles/
│   │   │   └── test_styles_parser.py
│   │   └── numbering/
│   │       └── test_numbering_parser.py
│   ├── converters/
│   │   ├── html/
│   │   │   ├── test_paragraph_converter.py
│   │   │   ├── test_run_converter.py
│   │   │   ├── test_table_converter.py
│   │   │   └── test_numbering_converter.py
│   │   └── text/
│   │       ├── test_paragraph_converter.py
│   │       └── test_table_converter.py
│   └── models/
│       └── test_model_validation.py
└── integration/
    ├── test_docx_to_html.py
    └── test_docx_to_text.py
```

### 2.2 Development Iterations

#### Iteration 1: Core Infrastructure (Week 1)
1. Write tests for `docx_reader.py`
2. Implement `docx_reader.py`
3. Write tests for `xml_extractor.py`
4. Implement `xml_extractor.py`
5. Write tests for `exceptions.py`
6. Implement `exceptions.py`

#### Iteration 2: Common Models & Parsers (Week 2)
1. Implement all common models (Border, Color, Spacing, Width, Indentation, Shading)
2. Write tests for each common parser
3. Implement each common parser

#### Iteration 3: Document Parsers (Weeks 3-4)
1. Run properties parser (simplest)
2. Paragraph properties parser
3. Run parser (text content)
4. Paragraph parser
5. Table cell parser
6. Table row parser
7. Table parser
8. Document body parser

#### Iteration 4: Styles & Numbering Parsers (Week 5)
1. Style parser
2. Styles parser (collection)
3. Level parser
4. Abstract numbering parser
5. Numbering instance parser
6. Numbering parser (collection)

#### Iteration 5: Style Resolution (Week 6)
1. Style inheritance resolver
2. Style merger (defaults → styles → direct)
3. Numbering counter manager

#### Iteration 6: HTML Converter (Weeks 7-8)
1. Run converter
2. Paragraph converter
3. Numbering converter
4. Table converter
5. Document converter
6. Style generator (CSS)

#### Iteration 7: Text Converter (Week 9)
1. Run converter
2. Paragraph converter
3. Table converter (ASCII, tabs, plain)
4. Document converter

#### Iteration 8: Integration & Polish (Week 10)
1. Public API (`docx_to_html`, `docx_to_text`)
2. Configuration handling
3. End-to-end integration tests
4. Documentation

---

## Phase 3: Script Templates

### 3.1 Parser Template - Simple Element with Attributes

For elements that have attributes only (no child elements):

```python
"""Parser for simple element with attributes only.

Example XML:
    <w:color w:val="FF0000" w:themeColor="accent1"/>
"""
from lxml.etree import _Element as Element

from core.constants import WORD_NS
from models.common.color import Color
from parsers.utils import get_attribute, get_bool_attribute, get_int_attribute


def parse_color(element: Element | None) -> Color | None:
    """Parse <w:color> element.

    Args:
        element: The <w:color> element or None

    Returns:
        Color model or None if element is None
    """
    if element is None:
        return None

    return Color(
        val=get_attribute(element, "val"),
        theme_color=get_attribute(element, "themeColor"),
        theme_tint=get_attribute(element, "themeTint"),
        theme_shade=get_attribute(element, "themeShade"),
    )
```

### 3.2 Parser Template - Element with Child Elements

For elements that contain other elements:

```python
"""Parser for element with child elements.

Example XML:
    <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="240" w:after="120"/>
        <w:ind w:left="720"/>
    </w:pPr>
"""
from lxml.etree import _Element as Element

from core.constants import WORD_NS
from models.document.paragraph_properties import ParagraphProperties
from parsers.common.spacing_parser import parse_spacing
from parsers.common.indentation_parser import parse_indentation
from parsers.utils import get_attribute, find_child


def parse_paragraph_properties(element: Element | None) -> ParagraphProperties | None:
    """Parse <w:pPr> element.

    Args:
        element: The <w:pPr> element or None

    Returns:
        ParagraphProperties model or None if element is None
    """
    if element is None:
        return None

    # Find child elements
    jc_elem = find_child(element, "jc")
    spacing_elem = find_child(element, "spacing")
    ind_elem = find_child(element, "ind")

    return ParagraphProperties(
        jc=get_attribute(jc_elem, "val") if jc_elem is not None else None,
        spacing=parse_spacing(spacing_elem),
        ind=parse_indentation(ind_elem),
    )
```

### 3.3 Parser Template - Collection Element

For elements that contain a list of items:

```python
"""Parser for collection element.

Example XML:
    <w:tbl>
        <w:tr>...</w:tr>
        <w:tr>...</w:tr>
        <w:tr>...</w:tr>
    </w:tbl>
"""
from lxml.etree import _Element as Element

from core.constants import WORD_NS
from models.document.table import Table
from parsers.document.table_row_parser import parse_table_row
from parsers.document.table_properties_parser import parse_table_properties
from parsers.utils import find_child, find_all_children


def parse_table(element: Element | None) -> Table | None:
    """Parse <w:tbl> element.

    Args:
        element: The <w:tbl> element or None

    Returns:
        Table model or None if element is None
    """
    if element is None:
        return None

    # Parse table properties
    tbl_pr_elem = find_child(element, "tblPr")
    tbl_pr = parse_table_properties(tbl_pr_elem)

    # Parse all rows
    row_elements = find_all_children(element, "tr")
    rows = [parse_table_row(row) for row in row_elements]

    return Table(
        tbl_pr=tbl_pr,
        rows=rows,
    )
```

### 3.4 Parser Template - Boolean Toggle Element

For elements that are boolean toggles (presence = True):

```python
"""Parser for boolean toggle elements.

Example XML:
    <w:b/>           <!-- bold = True -->
    <w:b w:val="0"/> <!-- bold = False (explicit) -->
    <w:b w:val="1"/> <!-- bold = True (explicit) -->
"""
from lxml.etree import _Element as Element

from core.constants import WORD_NS


def parse_toggle(element: Element | None) -> bool | None:
    """Parse boolean toggle element.

    In OOXML, toggle properties work as follows:
    - Element absent: property is not set (None)
    - Element present with no val: property is True
    - Element present with val="0" or val="false": property is False
    - Element present with val="1" or val="true": property is True

    Args:
        element: The toggle element or None

    Returns:
        True, False, or None if not set
    """
    if element is None:
        return None

    val = element.get(f"{WORD_NS}val")
    if val is None:
        return True  # Presence without val means True

    return val.lower() not in ("0", "false", "off")
```

### 3.5 Parser Template - Enumerated Value Element

For elements with constrained literal values:

```python
"""Parser for enumerated value elements.

Example XML:
    <w:jc w:val="center"/>
"""
import logging
from typing import Literal

from lxml.etree import _Element as Element

from core.constants import WORD_NS, LOGGER_NAME

logger = logging.getLogger(LOGGER_NAME)

JustificationType = Literal[
    "left", "center", "right", "both", "distribute",
    "mediumKashida", "highKashida", "lowKashida", "thaiDistribute"
]

VALID_JUSTIFICATION_VALUES = {
    "left", "center", "right", "both", "distribute",
    "mediumKashida", "highKashida", "lowKashida", "thaiDistribute"
}


def parse_justification(element: Element | None) -> JustificationType | None:
    """Parse <w:jc> element.

    Args:
        element: The <w:jc> element or None

    Returns:
        Justification value or None if not set/invalid
    """
    if element is None:
        return None

    val = element.get(f"{WORD_NS}val")
    if val is None:
        return None

    if val not in VALID_JUSTIFICATION_VALUES:
        logger.warning(f"Unknown justification value: {val}")
        return None

    return val  # type: ignore
```

### 3.6 Utility Functions Template

Common utilities used across all parsers. Located in `parsers/utils.py`:

```python
"""Shared parsing utilities."""
from lxml.etree import _Element as Element

from core.constants import WORD_NS


def get_attribute(element: Element | None, attr_name: str) -> str | None:
    """Get attribute value from element.

    Args:
        element: XML element or None
        attr_name: Attribute name without namespace prefix

    Returns:
        Attribute value or None
    """
    if element is None:
        return None
    return element.get(f"{WORD_NS}{attr_name}")


def get_int_attribute(element: Element | None, attr_name: str) -> int | None:
    """Get integer attribute value from element.

    Args:
        element: XML element or None
        attr_name: Attribute name without namespace prefix

    Returns:
        Integer value or None
    """
    val = get_attribute(element, attr_name)
    if val is None:
        return None
    try:
        return int(val)
    except ValueError:
        return None


def get_bool_attribute(element: Element | None, attr_name: str) -> bool | None:
    """Get boolean attribute value from element.

    Args:
        element: XML element or None
        attr_name: Attribute name without namespace prefix

    Returns:
        Boolean value or None
    """
    val = get_attribute(element, attr_name)
    if val is None:
        return None
    return val.lower() not in ("0", "false", "off")


def find_child(element: Element, tag_name: str) -> Element | None:
    """Find first child element with given tag.

    Args:
        element: Parent element
        tag_name: Tag name without namespace prefix

    Returns:
        Child element or None
    """
    return element.find(f"{WORD_NS}{tag_name}")


def find_all_children(element: Element, tag_name: str) -> list[Element]:
    """Find all child elements with given tag.

    Args:
        element: Parent element
        tag_name: Tag name without namespace prefix

    Returns:
        List of child elements
    """
    return element.findall(f"{WORD_NS}{tag_name}")


def get_text_content(element: Element | None) -> str:
    """Get text content from element, preserving whitespace.

    Args:
        element: XML element or None

    Returns:
        Text content or empty string
    """
    if element is None:
        return ""
    return element.text or ""
```

### 3.7 Model Template

Standard Pydantic model structure:

```python
"""Paragraph properties model."""
from typing import Literal

from pydantic import BaseModel

from models.common.spacing import Spacing
from models.common.indentation import Indentation
from models.common.border import Borders

JustificationType = Literal[
    "left", "center", "right", "both", "distribute",
    "mediumKashida", "highKashida", "lowKashida", "thaiDistribute"
]


class ParagraphProperties(BaseModel):
    """Properties for a paragraph (<w:pPr>).

    Stores raw XML values. Unit conversion happens during output.
    """

    # Style reference
    p_style: str | None = None

    # Justification
    jc: JustificationType | None = None

    # Spacing
    spacing: Spacing | None = None

    # Indentation
    ind: Indentation | None = None

    # Borders
    p_bdr: Borders | None = None

    # Boolean toggles
    keep_next: bool | None = None
    keep_lines: bool | None = None
    page_break_before: bool | None = None
    widow_control: bool | None = None

    # Numbering reference
    num_pr: "NumberingProperties | None" = None

    # Outline level (0-8 for headings)
    outline_lvl: int | None = None

    class Config:
        frozen = True
```

### 3.8 Test Template

Standard test structure:

```python
"""Tests for paragraph parser."""
import pytest
from lxml import etree

from core.constants import WORD_NS, NSMAP
from parsers.document.paragraph_parser import parse_paragraph
from models.document.paragraph import Paragraph


def make_element(xml_string: str) -> etree._Element:
    """Create element from XML string."""
    return etree.fromstring(xml_string)


class TestParseParagraph:
    """Tests for parse_paragraph function."""

    def test_none_element_returns_none(self):
        """Parsing None should return None."""
        result = parse_paragraph(None)
        assert result is None

    def test_empty_paragraph(self):
        """Empty paragraph should have no properties or runs."""
        xml = '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'
        element = make_element(xml)

        result = parse_paragraph(element)

        assert result is not None
        assert result.p_pr is None
        assert result.runs == []

    def test_paragraph_with_text(self):
        """Paragraph with single run containing text."""
        xml = '''
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:r>
                <w:t>Hello World</w:t>
            </w:r>
        </w:p>
        '''
        element = make_element(xml)

        result = parse_paragraph(element)

        assert result is not None
        assert len(result.runs) == 1
        assert result.runs[0].text == "Hello World"

    def test_paragraph_with_properties(self):
        """Paragraph with formatting properties."""
        xml = '''
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:pPr>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:t>Centered text</w:t>
            </w:r>
        </w:p>
        '''
        element = make_element(xml)

        result = parse_paragraph(element)

        assert result is not None
        assert result.p_pr is not None
        assert result.p_pr.jc == "center"


class TestParseParagraphFromFixtures:
    """Integration tests using real DOCX fixtures."""

    @pytest.fixture
    def sample_docx(self, fixtures_path):
        """Load sample DOCX file."""
        fromcore import open_docx, extract_document_xml
        docx_path = fixtures_path / "sample.docx"
        with open_docx(docx_path) as zf:
            return extract_document_xml(zf)

    def test_real_paragraph_parsing(self, sample_docx):
        """Parse real paragraphs from fixture file."""
        paragraphs = sample_docx.findall(f".//{{{WORD_NS}}}p")

        for p_elem in paragraphs:
            result = parse_paragraph(p_elem)
            assert result is not None
```

---

## Phase 4: Code Style Guidelines

### 4.1 General Principles

1. **Single Responsibility**: Each parser handles one element type
2. **Null Safety**: All parsers accept `None` and return `None` gracefully
3. **Type Hints**: Full typing on all public functions
4. **Docstrings**: Google-style docstrings on all public functions
5. **Logging**: Use `logger.warning()` for skipped/unknown elements

### 4.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Model class | PascalCase, full name | `ParagraphProperties` |
| Parser function | `parse_<element_name>` | `parse_paragraph` |
| Converter function | `convert_<element>_to_<format>` | `convert_paragraph_to_html` |
| Test class | `Test<FunctionName>` | `TestParseParagraph` |
| Test method | `test_<scenario>` | `test_empty_paragraph` |

### 4.3 Import Order

All imports use **absolute paths** from the package root:

```python
# Standard library
import logging
from pathlib import Path
from typing import Literal

# Third-party
from lxml.etree import _Element as Element
from pydantic import BaseModel

# Local - constants (always first)
from core.constants import WORD_NS, LOGGER_NAME

# Local - models
from models.document.paragraph import Paragraph
from models.document.run import Run

# Local - parsers
from parsers.document.run_parser import parse_run
from parsers.utils import find_child, get_attribute
```

**Important**: Never use relative imports (`from ..models import X`). Always use the full package path.

### 4.4 Error Handling

```python
import logging

from core.constants import LOGGER_NAME

logger = logging.getLogger(LOGGER_NAME)


def parse_something(element: Element | None) -> Something | None:
    if element is None:
        return None

    try:
        # Normal parsing logic
        return Something(...)
    except (ValueError, KeyError) as e:
        logger.warning(f"Failed to parse <w:something>: {e}")
        return None
```

### 4.5 Testing Requirements

1. **Unit tests**: Test each parser in isolation with constructed XML
2. **Fixture tests**: Verify parsing works on real DOCX files
3. **Edge cases**: Test None inputs, empty elements, invalid values
4. **Coverage**: Aim for 90%+ line coverage on parsers

---

## Phase 5: Implementation Milestones

### Milestone 1: Foundation ✓ Core Ready
- [ ] Core infrastructure (reader, extractor, exceptions)
- [ ] All common models implemented
- [ ] All common parsers implemented
- [ ] Tests passing for all core components

### Milestone 2: Parsing ✓ Parsers Ready
- [ ] All document parsers implemented
- [ ] All styles parsers implemented
- [ ] All numbering parsers implemented
- [ ] Style resolution working
- [ ] Numbering counter management working

### Milestone 3: HTML Output ✓ HTML Ready
- [ ] All HTML converters implemented
- [ ] CSS generation working (inline + classes)
- [ ] Table colspan/rowspan working
- [ ] Numbered list rendering working

### Milestone 4: Text Output ✓ Text Ready
- [ ] All text converters implemented
- [ ] ASCII table rendering working
- [ ] Markdown formatting option working

### Milestone 5: Release ✓ v1.0 Ready
- [ ] Public API finalized
- [ ] Configuration options working
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Package ready for PyPI

---

## Appendix A: File Dependencies

```
# Parsing order (dependencies shown)

# Level 0: No dependencies
models/common/border.py
models/common/color.py
models/common/shading.py
models/common/spacing.py
models/common/width.py
models/common/indentation.py

# Level 1: Depends on common models
parsers/common/border_parser.py      → models/common/border.py
parsers/common/color_parser.py       → models/common/color.py
parsers/common/shading_parser.py     → models/common/shading.py
parsers/common/spacing_parser.py     → models/common/spacing.py
parsers/common/width_parser.py       → models/common/width.py
parsers/common/indentation_parser.py → models/common/indentation.py

# Level 2: Depends on common parsers
models/document/run_properties.py    → uses common models
parsers/document/run_properties_parser.py → common parsers

# Level 3: Depends on run properties
models/document/run.py               → run_properties
parsers/document/run_parser.py       → run_properties_parser

# Level 4: Depends on run
models/document/paragraph.py         → run, paragraph_properties
parsers/document/paragraph_parser.py → run_parser, paragraph_properties_parser

# Level 5: Depends on paragraph
models/document/table_cell.py        → paragraph
parsers/document/table_cell_parser.py → paragraph_parser

# And so on...
```

---

## Appendix B: Fixture Checklist

Use this checklist to track which fixtures have been added:

### High Priority (Required for core functionality)
- [ ] External hyperlinks (`<w:hyperlink>`)
- [ ] Section breaks (`<w:sectPr>` with type)
- [ ] keepNext/keepLines (`<w:keepNext>`, `<w:keepLines>`)
- [ ] Page break before (`<w:pageBreakBefore>`)
- [ ] Soft hyphen (`<w:softHyphen>`)
- [ ] Non-breaking hyphen (`<w:noBreakHyphen>`)
- [ ] All caps / small caps (`<w:caps>`, `<w:smallCaps>`)
- [ ] Double strikethrough (`<w:dstrike>`)
- [ ] Character spacing (`<w:spacing>` in rPr)
- [ ] Run style reference (`<w:rStyle>`)
- [ ] Cell merge (`<w:cellMerge>`)
- [ ] Can't split row (`<w:cantSplit>`)
- [ ] Row justification (`<w:jc>` in trPr)
- [ ] Table style conditional formatting (`<w:tblStylePr>`)
- [ ] Multi-level type (`<w:multiLevelType>`)
- [ ] Level restart (`<w:lvlRestart>`)
- [ ] Level paragraph style (`<w:pStyle>` in lvl)
- [ ] Level override (`<w:lvlOverride>`)
- [ ] Start override (`<w:startOverride>`)

### Medium Priority (Enhanced functionality)
- [ ] Header/footer references
- [ ] Outline/shadow effects
- [ ] Character width scaling (`<w:w>`)
- [ ] Text position (`<w:position>`)
- [ ] Character border (`<w:bdr>`)
- [ ] Table caption/description
- [ ] Conditional formatting flags (`<w:cnfStyle>`)
- [ ] No wrap cell (`<w:noWrap>`)
- [ ] Grid before/after in rows
- [ ] Hidden row
- [ ] Style links (numStyleLink, styleLink)
- [ ] Contextual spacing
- [ ] Section page size/margins
- [ ] Section columns

### Low Priority (Edge cases)
- [ ] Footnote/endnote references
- [ ] Symbol character (`<w:sym>`)
- [ ] Field characters (fldChar, instrText)
- [ ] Embedded objects
- [ ] Drawings/images
- [ ] Emboss/imprint effects
- [ ] Kerning
- [ ] East Asian layout
- [ ] Legacy numbering
- [ ] Picture bullets
- [ ] Form protection
- [ ] RTL gutter
- [ ] Document grid

---

## Next Steps

1. **Review this plan** and confirm the priorities
2. **Add missing fixtures** based on the checklist above
3. **Begin Phase 0** - Implement core infrastructure with tests
4. **Iterate** through each phase following TDD

Ready to begin implementation when you give the go-ahead!
