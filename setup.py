from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf8", errors="ignore") as fh:
    long_description = fh.read()

setup(
    name="docx-parser-converter",
    version="0.5",
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
        "alabaster==0.7.16",
        "annotated-types==0.7.0",
        "Babel==2.15.0",
        "beautifulsoup4==4.12.3",
        "bs4==0.0.2",
        "certifi==2024.7.4",
        "charset-normalizer==3.3.2",
        "colorama==0.4.6",
        "docutils==0.20.1",
        "idna==3.7",
        "imagesize==1.4.1",
        "Jinja2==3.1.4",
        "lxml==5.2.2",
        "MarkupSafe==2.1.5",
        "packaging==24.1",
        "pydantic==2.7.4",
        "pydantic_core==2.18.4",
        "Pygments==2.18.0",
        "regex==2024.5.15",
        "requests==2.32.3",
        "snowballstemmer==2.2.0",
        "soupsieve==2.5",
        "Sphinx==7.3.7",
        "sphinx-autodoc-typehints==2.2.2",
        "sphinx-rtd-theme==2.0.0",
        "sphinxcontrib-applehelp==1.0.8",
        "sphinxcontrib-devhelp==1.0.6",
        "sphinxcontrib-htmlhelp==2.0.5",
        "sphinxcontrib-jquery==4.1",
        "sphinxcontrib-jsmath==1.0.1",
        "sphinxcontrib-qthelp==1.0.7",
        "sphinxcontrib-serializinghtml==1.1.10",
        "typing_extensions==4.12.2",
        "urllib3==2.2.2",
    ],
)
