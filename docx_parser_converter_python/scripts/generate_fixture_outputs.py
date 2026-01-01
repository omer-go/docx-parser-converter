#!/usr/bin/env python3
"""Generate HTML and TXT outputs for all DOCX fixtures.

This script converts all fixture DOCX files to HTML and TXT formats
for smoke testing and visual comparison.
"""

import sys
from pathlib import Path

# Add package to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api import ConversionConfig, docx_to_html, docx_to_text


def main() -> None:
    """Generate outputs for all fixtures."""
    fixtures_dir = Path(__file__).parent.parent / "tests" / "fixtures"
    output_dir = fixtures_dir / "outputs"

    # Create output directory
    output_dir.mkdir(exist_ok=True)

    # Find all DOCX files
    docx_files = list(fixtures_dir.rglob("*.docx"))
    print(f"Found {len(docx_files)} DOCX fixtures\n")

    success_count = 0
    error_count = 0

    for docx_path in sorted(docx_files):
        # Get relative path for naming
        rel_path = docx_path.relative_to(fixtures_dir)
        category = rel_path.parts[0] if len(rel_path.parts) > 1 else "root"
        name = docx_path.stem

        # Create category subdirectory
        category_dir = output_dir / category
        category_dir.mkdir(exist_ok=True)

        html_path = category_dir / f"{name}.html"
        txt_path = category_dir / f"{name}.txt"
        md_path = category_dir / f"{name}.md"

        print(f"Processing: {rel_path}")

        try:
            # Generate HTML
            config = ConversionConfig(title=name)
            html = docx_to_html(docx_path, config=config)
            html_path.write_text(html, encoding="utf-8")
            print(f"  ✓ HTML: {html_path.relative_to(fixtures_dir)}")

            # Generate plain text
            text = docx_to_text(docx_path)
            txt_path.write_text(text, encoding="utf-8")
            print(f"  ✓ TXT: {txt_path.relative_to(fixtures_dir)}")

            # Generate markdown text
            config_md = ConversionConfig(text_formatting="markdown")
            markdown = docx_to_text(docx_path, config=config_md)
            md_path.write_text(markdown, encoding="utf-8")
            print(f"  ✓ MD: {md_path.relative_to(fixtures_dir)}")

            success_count += 1

        except Exception as e:
            print(f"  ✗ Error: {e}")
            error_count += 1

        print()

    print("=" * 60)
    print(f"Summary: {success_count} successful, {error_count} failed")
    print(f"Outputs saved to: {output_dir}")


if __name__ == "__main__":
    main()
