# run_parser.py

from lxml import etree
from typing import List
from docx_parsers.helpers.common_helpers import extract_element, NAMESPACE_URI
from docx_parsers.models.document_models import Run, RunContent, TextContent, TabContent
from docx_parsers.models.styles_models import RunStyleProperties
from docx_parsers.styles.run_properties_parser import RunPropertiesParser

class RunParser:
    def parse(self, r: etree.Element) -> Run:
        """
        Parses a run from the given XML element.

        Args:
            r (etree.Element): The run XML element.

        Returns:
            Run: The parsed run.
        """
        rPr = extract_element(r, ".//w:rPr")
        # styles_parser = StylesParser()
        # run_properties = styles_parser.extract_run_properties(rPr) if rPr else RunStyleProperties()
        run_properties = RunPropertiesParser().parse(rPr) if rPr else RunStyleProperties()
        contents = self.extract_run_contents(r)
        return Run(contents=contents, properties=run_properties)

    def extract_run_contents(self, r: etree.Element) -> List[RunContent]:
        """
        Extracts run contents from the given run XML element.

        Args:
            r (etree.Element): The run XML element.

        Returns:
            List[RunContent]: The list of extracted run contents.
        """
        contents = []
        for elem in r:
            if elem.tag == f"{{{NAMESPACE_URI}}}tab":
                contents.append(RunContent(run=TabContent()))
            elif elem.tag == f"{{{NAMESPACE_URI}}}t":
                contents.append(RunContent(run=TextContent(text=elem.text)))
        return contents
