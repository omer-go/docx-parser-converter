#!/usr/bin/env python3
"""Generate HTML and TXT outputs for all DOCX fixtures.

This script converts all fixture DOCX files to HTML and TXT formats
for smoke testing and visual comparison.

All DOCX files and their outputs are placed in a single flat folder
for easy browsing and comparison.
"""

import shutil
import sys
from pathlib import Path

# Add package to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api import ConversionConfig, docx_to_html, docx_to_text


def main() -> None:
    """Generate outputs for all fixtures."""
    fixtures_dir = Path(__file__).parent.parent / "tests" / "fixtures"
    output_dir = fixtures_dir / "outputs"

    # Clean and recreate output directory
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(exist_ok=True)

    # Find all DOCX files (exclude outputs directory)
    docx_files = [f for f in fixtures_dir.rglob("*.docx") if "outputs" not in f.parts]
    print(f"Found {len(docx_files)} DOCX fixtures\n")

    success_count = 0
    error_count = 0

    for docx_path in sorted(docx_files):
        # Get relative path for naming
        rel_path = docx_path.relative_to(fixtures_dir)
        name = docx_path.stem

        # All files go directly in output_dir (flat structure)
        docx_copy_path = output_dir / f"{name}.docx"
        html_path = output_dir / f"{name}.html"
        txt_path = output_dir / f"{name}.txt"
        md_path = output_dir / f"{name}.md"

        print(f"Processing: {rel_path}")

        try:
            # Copy source DOCX
            shutil.copy2(docx_path, docx_copy_path)
            print(f"  ✓ DOCX: {name}.docx")

            # Generate HTML
            config = ConversionConfig(title=name)
            html = docx_to_html(docx_path, config=config)
            html_path.write_text(html, encoding="utf-8")
            print(f"  ✓ HTML: {name}.html")

            # Generate plain text
            text = docx_to_text(docx_path)
            txt_path.write_text(text, encoding="utf-8")
            print(f"  ✓ TXT: {name}.txt")

            # Generate markdown text
            config_md = ConversionConfig(text_formatting="markdown")
            markdown = docx_to_text(docx_path, config=config_md)
            md_path.write_text(markdown, encoding="utf-8")
            print(f"  ✓ MD: {name}.md")

            success_count += 1

        except Exception as e:
            print(f"  ✗ Error: {e}")
            error_count += 1

        print()

    print("=" * 60)
    print(f"Summary: {success_count} successful, {error_count} failed")
    print(f"Outputs saved to: {output_dir}")
    print(f"\nAll {success_count * 4} files in a single folder:")
    print("  - 13 DOCX source files")
    print("  - 13 HTML outputs")
    print("  - 13 TXT outputs (plain text)")
    print("  - 13 MD outputs (markdown)")


if __name__ == "__main__":
    main()
