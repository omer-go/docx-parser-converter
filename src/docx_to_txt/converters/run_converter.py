from docx_parsers.models.paragraph_models import Run, TextContent, TabContent

class RunConverter:
    """
    Class to convert runs to plain text.
    """

    @staticmethod
    def convert_run(run: Run) -> str:
        """
        Convert a run to plain text.

        Args:
            run (Run): The run object.

        Returns:
            str: Plain text representation of the run.

        Example:
            .. code-block:: python

                run = Run(
                    contents=[
                        RunContent(run=TextContent(text="Hello")),
                        RunContent(run=TabContent(type="tab")),
                        RunContent(run=TextContent(text="world"))
                    ],
                    properties=RunStyleProperties()
                )
                run_text = RunConverter.convert_run(run)
                print(run_text)  # Output: "Hello\tworld"
        """
        run_text = ""
        for content in run.contents:
            if isinstance(content.run, TabContent):
                run_text += "\t"
            elif isinstance(content.run, TextContent):
                run_text += content.run.text
        return run_text
