from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf8", errors="ignore") as fh:
    long_description = fh.read()

setup(
    name="docx-parser-converter",
    version="0.5.1.1",
    author="Omer Hayun",
    author_email="your.email@example.com",
    description="A library for converting DOCX documents to HTML and plain text",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/omer-go/docx-html-txt",
    packages=find_packages(),
    # package_dir={"": "src"},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
    install_requires=[
        "beautifulsoup4==4.12.3",
        "bs4==0.0.2",
        "lxml==5.2.2",
        "pydantic==2.7.4",
        "pydantic_core==2.18.4",
        "regex==2024.5.15",
    ],
)
