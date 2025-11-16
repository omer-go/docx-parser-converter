from typing import Optional
from html import escape

from docx_parser_converter.docx_parsers.models.paragraph_models import (
    Run,
    Paragraph,
    TextContent,
    TabContent,
    BreakContent,
)
from docx_parser_converter.docx_parsers.models.styles_models import RunStyleProperties
from docx_parser_converter.docx_to_html.converters.style_converter import StyleConverter


class RunConverter:
    """
    A converter class for converting DOCX runs to HTML.
    """

    @staticmethod
    def convert_run(run: Run, paragraph: Paragraph) -> str:
        """
        Converts a run to its HTML representation.

        Args:
            run (Run): The run to convert.
            paragraph (Paragraph): The paragraph containing the run.

        Returns:
            str: The HTML representation of the run.

        Example:
            Given a run with bold text and a tab, the output HTML string might look like:

            .. code-block:: html

                <span style="font-weight:bold;">This is bold text</span>
                <span style="display:inline-block; width:36pt;"></span>
        """
        style_attr = RunConverter.convert_run_properties(run.properties)
        if RunConverter._run_requires_whitespace_preservation(run):
            style_attr = RunConverter._append_style_attribute(style_attr, "white-space:pre-wrap;")

        run_html = f"<span{style_attr}>"
        for content in run.contents:
            if isinstance(content.run, TabContent):
                tab_width = RunConverter.get_next_tab_width(paragraph)
                run_html += f'<span style="display:inline-block; width:{tab_width}pt;"></span>'
            elif isinstance(content.run, TextContent):
                run_html += escape(content.run.text, quote=False)
            elif isinstance(content.run, BreakContent):
                run_html += "<br/>"
        run_html += "</span>"
        return run_html

    @staticmethod
    def get_next_tab_width(paragraph: Paragraph) -> float:
        """
        Gets the width of the next tab stop for the paragraph.

        Args:
            paragraph (Paragraph): The paragraph containing the tab stop.

        Returns:
            float: The width of the next tab stop in points.

        Example:
            The following gets the next tab width:

            .. code-block:: python

                tab_width = RunConverter.get_next_tab_width(paragraph)
                print(tab_width)  # Output: 36.0
        """
        if paragraph.properties.tabs:
            for tab in paragraph.properties.tabs:
                return tab.pos
        return 36.0

    @staticmethod
    def convert_run_properties(properties: Optional[RunStyleProperties]) -> str:
        """
        Converts run properties to an HTML style attribute.

        Args:
            properties (RunStyleProperties): The run style properties to convert.

        Returns:
            str: The HTML style attribute representing the run properties.

        Example:
            The output style attribute might look like:

            .. code-block:: html

                ' style="font-weight:bold;font-style:italic;color:#FF0000;font-family:Arial;font-size:12pt;"'
        """
        if not properties:
            return ""

        style = ""
        if properties.bold:
            style += StyleConverter.convert_bold(properties.bold)
        if properties.italic:
            style += StyleConverter.convert_italic(properties.italic)
        decoration = StyleConverter.convert_underline(
            properties.underline,
            bool(properties.strikethrough),
            bool(properties.double_strikethrough),
        )
        if decoration:
            style += decoration
        if properties.color:
            style += StyleConverter.convert_color(properties.color)
        if properties.underline_color:
            style += StyleConverter.convert_underline_color(properties.underline_color)
        if properties.highlight:
            style += StyleConverter.convert_highlight(properties.highlight)
        if properties.font:
            style += StyleConverter.convert_font(properties.font)
        if properties.size_pt:
            style += StyleConverter.convert_size(properties.size_pt)
        if properties.vertical_align or properties.text_position_pt is not None:
            style += StyleConverter.convert_vertical_align(
                properties.vertical_align,
                properties.text_position_pt,
            )
        if properties.all_caps:
            style += StyleConverter.convert_all_caps(properties.all_caps)
        elif properties.small_caps:
            style += StyleConverter.convert_small_caps(properties.small_caps)
        return f' style="{style}"' if style else ""

    @staticmethod
    def _append_style_attribute(style_attr: str, addition: str) -> str:
        """
        Ensures the provided style string contains the additional declaration.
        """
        if style_attr:
            return f'{style_attr[:-1]}{addition}"'
        return f' style="{addition}"'

    @staticmethod
    def _run_requires_whitespace_preservation(run: Run) -> bool:
        """
        Determines if any text content inside the run requires preserving whitespace.
        """
        for content in run.contents:
            if isinstance(content.run, TextContent):
                if RunConverter._text_requires_whitespace_preservation(content.run.text):
                    return True
        return False

    @staticmethod
    def _text_requires_whitespace_preservation(text: str) -> bool:
        """
        Returns True if the text contains whitespace that should be preserved.
        """
        if not text:
            return False

        normalized = text.replace("\r\n", "\n")
        if "\n" in normalized or "\r" in text or "\t" in text:
            return True
        if text.startswith(" ") or text.endswith(" ") or "  " in text:
            return True
        if "\n " in normalized or "\n\t" in normalized:
            return True
        return False
