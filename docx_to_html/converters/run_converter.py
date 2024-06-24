from docx_parsers.models.document_models import Run, Paragraph, TextContent, TabContent
from docx_parsers.models.styles_models import RunStyleProperties
from docx_to_html.converters.style_converter import StyleConverter


class RunConverter:
    @staticmethod
    def convert_run(run: Run, paragraph: Paragraph) -> str:
        run_html = f"<span{RunConverter.convert_run_properties(run.properties)}>"
        for content in run.contents:
            if isinstance(content.run, TabContent):
                tab_width = RunConverter.get_next_tab_width(paragraph)
                run_html += f'<span style="display:inline-block; width:{tab_width}pt;"></span>'
            elif isinstance(content.run, TextContent):
                run_html += content.run.text
        run_html += "</span>"
        return run_html

    @staticmethod
    def get_next_tab_width(paragraph: Paragraph) -> float:
        if paragraph.properties.tabs:
            for tab in paragraph.properties.tabs:
                return tab.pos
        return 36.0

    @staticmethod
    def convert_run_properties(properties: RunStyleProperties) -> str:
        style = ""
        if properties.bold:
            style += StyleConverter.convert_bold(properties.bold)
        if properties.italic:
            style += StyleConverter.convert_italic(properties.italic)
        if properties.underline:
            style += StyleConverter.convert_underline(properties.underline)
        if properties.color:
            style += StyleConverter.convert_color(properties.color)
        if properties.font:
            style += StyleConverter.convert_font(properties.font)
        if properties.size_pt:
            style += StyleConverter.convert_size(properties.size_pt)
        return f' style="{style}"' if style else ""
