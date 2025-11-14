from __future__ import annotations

from pathlib import Path

import pytest

from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter
from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

FIXTURES_ROOT = Path(__file__).resolve().parents[2] / "fixtures"
DOCX_INPUT_DIR = FIXTURES_ROOT / "test_docx_files"
OUTPUT_DIR = FIXTURES_ROOT / "outputs-python"

if not DOCX_INPUT_DIR.exists():
    pytest.skip(
        f"DOCX fixtures directory not found: {DOCX_INPUT_DIR}", allow_module_level=True
    )

DOCX_FILES = sorted(DOCX_INPUT_DIR.glob("*.docx"))
if not DOCX_FILES:
    pytest.skip(
        f"No DOCX files found in {DOCX_INPUT_DIR}", allow_module_level=True
    )


def _prepare_output_file(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    return path


@pytest.mark.parametrize("docx_path", DOCX_FILES, ids=lambda path: path.stem)
def test_docx_to_html_and_txt_converters(docx_path: Path) -> None:
    docx_bytes = read_binary_from_file_path(str(docx_path))

    html_converter = DocxToHtmlConverter(docx_bytes)
    html_content = html_converter.convert_to_html()
    html_output_path = _prepare_output_file(OUTPUT_DIR / f"{docx_path.stem}.html")
    html_converter.save_html_to_file(html_content, str(html_output_path))

    assert html_content.strip(), "Expected non-empty HTML content"
    assert html_output_path.exists(), f"HTML file not created: {html_output_path}"

    txt_converter = DocxToTxtConverter(docx_bytes)
    txt_content = txt_converter.convert_to_txt()
    txt_output_path = _prepare_output_file(OUTPUT_DIR / f"{docx_path.stem}.txt")
    txt_converter.save_txt_to_file(txt_content, str(txt_output_path))

    assert txt_content.strip(), "Expected non-empty TXT content"
    assert txt_output_path.exists(), f"TXT file not created: {txt_output_path}"
