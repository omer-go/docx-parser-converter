# table_properties_parser.py

from lxml import etree
from typing import Optional
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, safe_int
from docx_parsers.models.table_models import (
    TableProperties, TableWidth, TableIndent, TableLook, 
    TableCellBorders, ShadingProperties, MarginProperties, BorderProperties
)
from docx_parsers.utils import convert_twips_to_points, convert_half_points_to_points

class TablePropertiesParser:
    @staticmethod
    def parse(tblPr_element: etree.Element) -> TableProperties:
        """
        Parses table properties from the given XML element.

        Args:
            tblPr_element (etree.Element): The table properties XML element.

        Returns:
            TableProperties: The parsed table properties.
        """
        tblStyle = TablePropertiesParser.extract_table_style(tblPr_element)
        tblW = TablePropertiesParser.extract_table_width(tblPr_element)
        justification = TablePropertiesParser.extract_justification(tblPr_element)
        tblInd = TablePropertiesParser.extract_table_indent(tblPr_element)
        tblCellMar = TablePropertiesParser.extract_table_cell_margins(tblPr_element)
        tblBorders = TablePropertiesParser.extract_table_cell_borders(extract_element(tblPr_element, ".//w:tblBorders"))
        shd = TablePropertiesParser.extract_shading(extract_element(tblPr_element, ".//w:shd"))
        tblLayout = TablePropertiesParser.extract_table_layout(tblPr_element)
        tblLook = TablePropertiesParser.extract_table_look(tblPr_element)

        return TableProperties(
            tblStyle=tblStyle,
            tblW=tblW,
            justification=justification,
            tblInd=tblInd,
            tblCellMar=tblCellMar,
            tblBorders=tblBorders,
            shd=shd,
            tblLayout=tblLayout,
            tblLook=tblLook
        )

    @staticmethod
    def extract_table_indent(element: etree.Element) -> Optional[TableIndent]:
        """
        Extracts table indent properties from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[TableIndent]: The parsed table indent properties, or None if not found.
        """
        indent_element = extract_element(element, ".//w:tblInd")
        if indent_element is not None:
            indent_value = safe_int(extract_attribute(indent_element, 'w'))
            return TableIndent(
                type=extract_attribute(indent_element, 'type'),
                width=convert_twips_to_points(indent_value) if indent_value is not None else None
            )
        return None

    @staticmethod
    def extract_table_width(element: etree.Element) -> Optional[TableWidth]:
        """
        Extracts table width properties from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[TableWidth]: The parsed table width properties, or None if not found.
        """
        width_element = extract_element(element, ".//w:tblW")
        if width_element is not None:
            width_value = safe_int(extract_attribute(width_element, 'w'))
            return TableWidth(
                type=extract_attribute(width_element, 'type'),
                width=convert_twips_to_points(width_value) if width_value is not None else None
            )
        return None

    @staticmethod
    def extract_justification(element: etree.Element) -> Optional[str]:
        """
        Extracts table justification from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[str]: The justification, or None if not found.
        """
        jc_element = extract_element(element, ".//w:jc")
        return extract_attribute(jc_element, 'val')

    @staticmethod
    def extract_table_style(element: etree.Element) -> Optional[str]:
        """
        Extracts table style from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[str]: The table style, or None if not found.
        """
        style_element = extract_element(element, ".//w:tblStyle")
        return extract_attribute(style_element, 'val')

    @staticmethod
    def extract_table_cell_margins(element: etree.Element) -> Optional[MarginProperties]:
        """
        Extracts table cell margins from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[MarginProperties]: The parsed table cell margins, or None if not found.
        """
        margin_element = extract_element(element, ".//w:tblCellMar")
        if margin_element is not None:
            return MarginProperties(
                top=TablePropertiesParser.extract_margin_value(margin_element, "top"),
                left=TablePropertiesParser.extract_margin_value(margin_element, "left"),
                bottom=TablePropertiesParser.extract_margin_value(margin_element, "bottom"),
                right=TablePropertiesParser.extract_margin_value(margin_element, "right")
            )
        return None

    @staticmethod
    def extract_margin_value(margin_element: etree.Element, side: str) -> Optional[float]:
        """
        Extracts a specific margin value from the given XML element.

        Args:
            margin_element (etree.Element): The margin XML element.
            side (str): The side of the margin (e.g., "top", "left").

        Returns:
            Optional[float]: The margin value in points, or None if not found.
        """
        side_element = extract_element(margin_element, f".//w:{side}")
        margin_value = safe_int(extract_attribute(side_element, 'w'))
        return convert_twips_to_points(margin_value) if margin_value is not None else None

    @staticmethod
    def extract_table_layout(element: etree.Element) -> Optional[str]:
        """
        Extracts table layout from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[str]: The table layout, or None if not found.
        """
        layout_element = extract_element(element, ".//w:tblLayout")
        return extract_attribute(layout_element, 'type')

    @staticmethod
    def extract_table_look(element: etree.Element) -> Optional[TableLook]:
        """
        Extracts table look properties from the given XML element.

        Args:
            element (etree.Element): The XML element.

        Returns:
            Optional[TableLook]: The parsed table look properties, or None if not found.
        """
        look_element = extract_element(element, ".//w:tblLook")
        if look_element is not None:
            return TableLook(
                firstRow=extract_attribute(look_element, 'firstRow') == "1",
                lastRow=extract_attribute(look_element, 'lastRow') == "1",
                firstColumn=extract_attribute(look_element, 'firstColumn') == "1",
                lastColumn=extract_attribute(look_element, 'lastColumn') == "1",
                noHBand=extract_attribute(look_element, 'noHBand') == "1",
                noVBand=extract_attribute(look_element, 'noVBand') == "1"
            )
        return None

    @staticmethod
    def extract_table_cell_borders(borders_element: Optional[etree.Element]) -> Optional[TableCellBorders]:
        """
        Extracts table cell border properties from the given XML element.

        Args:
            borders_element (Optional[etree.Element]): The borders XML element.

        Returns:
            Optional[TableCellBorders]: The parsed table cell border properties, or None if not found.
        """
        if borders_element is not None:
            return TableCellBorders(
                top=TablePropertiesParser.extract_border(extract_element(borders_element, ".//w:top")),
                left=TablePropertiesParser.extract_border(extract_element(borders_element, ".//w:left")),
                bottom=TablePropertiesParser.extract_border(extract_element(borders_element, ".//w:bottom")),
                right=TablePropertiesParser.extract_border(extract_element(borders_element, ".//w:right")),
                insideH=TablePropertiesParser.extract_border(extract_element(borders_element, ".//w:insideH")),
                insideV=TablePropertiesParser.extract_border(extract_element(borders_element, ".//w:insideV"))
            )
        return None

    @staticmethod
    def extract_border(border_element: Optional[etree.Element]) -> Optional[BorderProperties]:
        """
        Extracts border properties from the given XML element.

        Args:
            border_element (Optional[etree.Element]): The border XML element.

        Returns:
            Optional[BorderProperties]: The parsed border properties, or None if not found.
        """
        if border_element is not None:
            size_value = safe_int(extract_attribute(border_element, 'sz'))
            return BorderProperties(
                color=extract_attribute(border_element, 'color'),
                size=convert_half_points_to_points(size_value) if size_value is not None else None,
                space=safe_int(extract_attribute(border_element, 'space')),
                val=extract_attribute(border_element, 'val')
            )
        return None

    @staticmethod
    def extract_shading(shd_element: Optional[etree.Element]) -> Optional[ShadingProperties]:
        """
        Extracts shading properties from the given XML element.

        Args:
            shd_element (Optional[etree.Element]): The shading XML element.

        Returns:
            Optional[ShadingProperties]: The parsed shading properties, or None if not found.
        """
        if shd_element is not None:
            return ShadingProperties(
                fill=extract_attribute(shd_element, 'fill'),
                val=extract_attribute(shd_element, 'val'),
                color=extract_attribute(shd_element, 'color')
            )
        return None
