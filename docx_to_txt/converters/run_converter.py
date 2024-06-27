from docx_parsers.models.document_models import Run, TextContent, TabContent


class RunConverter:
    """
    Class to convert runs to plain text.
    """

    @staticmethod
    def convert_run(run: Run) -> str:
        """
        Convert a run to plain text.
        :param run: The run object.
        :param paragraph: The parent paragraph.
        :return: Plain text representation of the run.
        """
        run_text = ""
        for content in run.contents:
            if isinstance(content.run, TabContent):
                run_text += "\t"
            elif isinstance(content.run, TextContent):
                run_text += content.run.text
        return run_text
