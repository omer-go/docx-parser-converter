import os
import sys
sys.path.insert(0, os.path.abspath('../../'))

project = 'Docx Parser and Converter'
copyright = '2024, Omer Hayun'
author = 'Omer Hayun'
release = '0.1'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.napoleon',
]

templates_path = ['source/_templates']
exclude_patterns = []


html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_theme_options = {
    'collapse_navigation': False,
    'sticky_navigation': True,
    'navigation_depth': 4,
    'includehidden': True,
    'titles_only': True
}

autosummary_generate = True