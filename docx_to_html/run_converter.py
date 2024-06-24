from docx_parsers.models.document_models import Run, Paragraph, TextContent, TabContent
from docx_parsers.models.styles_models import RunStyleProperties, FontProperties

class RunConverter:
    def convert_run(self, run: Run, paragraph: Paragraph) -> str:
        run_html = f"<span{self.convert_run_properties(run.properties)}>"
        for content in run.contents:
            if isinstance(content.run, TabContent):
                tab_width = self.get_next_tab_width(paragraph)
                run_html += f'<span style="display:inline-block; width:{tab_width}pt;"></span>'
            elif isinstance(content.run, TextContent):
                run_html += content.run.text
        run_html += "</span>"
        return run_html

    def convert_run_properties(self, properties: RunStyleProperties) -> str:
        style = ""
        if properties.bold:
            style += "font-weight:bold;"
        if properties.italic:
            style += "font-style:italic;"
        if properties.underline:
            style += "text-decoration:underline;"
        if properties.color:
            style += f"color:{properties.color};"
        if properties.font:
            style += self.convert_font(properties.font)
        if properties.size_pt:
            style += f"font-size:{properties.size_pt}pt;"
        return f' style="{style}"' if style else ""

    def convert_font(self, font: FontProperties) -> str:
        style = ""
        if font.ascii:
            style += f"font-family:{font.ascii};"
        return style

    def get_next_tab_width(self, paragraph: Paragraph) -> float:
        if paragraph.properties.tabs:
            for tab in paragraph.properties.tabs:
                return tab.pos
        return 36.0
