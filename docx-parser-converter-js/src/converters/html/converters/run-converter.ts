/**
 * Run Converter for HTML Output - Python-Compatible Version
 * 
 * Converts DOCX run elements to HTML spans with inline styles
 * that exactly match the Python DOCX converter output format.
 */

import type { Run, TextContent, TabContent } from '@/models/paragraph-models.js';
import type { HtmlElement, ConversionContext } from './index.js';
import { StyleConverter } from './style-converter.js';

/**
 * Converter for DOCX run elements to HTML - Python compatible
 */
export class RunConverter {
  /**
   * Convert a DOCX run to HTML span element with inline styles - Python compatible
   * @param run - DOCX run element
   * @param context - Conversion context
   * @returns HTML element representing the run
   */
  static convertRun(run: Run, context: ConversionContext): HtmlElement {
    // Get text content from run
    const textContent = this.extractTextContent(run);
    
    // If no text content, return empty span
    if (!textContent.trim()) {
      return {
        tag: 'span',
        content: ''
      };
    }

    // Create inline styles from run properties
    let inlineStyle = '';
    if (run.properties) {
      inlineStyle = StyleConverter.convertRunStyles(run.properties, context);
    } else {
      // Use default run style if no properties
      inlineStyle = StyleConverter.getDefaultRunStyle();
    }

    // Create span element with inline styles
    const attributes: Record<string, string> = {};
    if (inlineStyle && !StyleConverter.areStylesEmpty(inlineStyle)) {
      attributes.style = inlineStyle;
    }

    return {
      tag: 'span',
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      content: textContent
    };
  }

  /**
   * Extract text content from run contents - Python compatible
   * @param run - DOCX run element
   * @returns Plain text content
   */
  private static extractTextContent(run: Run): string {
    let textContent = '';
    
    for (const content of run.contents) {
      if (this.isTextContent(content.run)) {
        textContent += this.convertTextContent(content.run as TextContent);
      } else if (this.isTabContent(content.run)) {
        textContent += '\t'; // Convert tabs to tab characters
      }
    }
    
    return textContent;
  }

  /**
   * Convert text content to string - Python compatible
   * @param textContent - DOCX text content
   * @returns HTML text string
   */
  private static convertTextContent(textContent: TextContent): string {
    // Python output doesn't escape text content in the same way
    return textContent.text;
  }

  /**
   * Check if run content is text content
   * @param runContent - Run content to check
   * @returns True if text content
   */
  private static isTextContent(runContent: TextContent | TabContent): runContent is TextContent {
    return 'text' in runContent;
  }

  /**
   * Check if run content is tab content
   * @param runContent - Run content to check
   * @returns True if tab content
   */
  private static isTabContent(runContent: TextContent | TabContent): runContent is TabContent {
    return 'type' in runContent && runContent.type === 'tab';
  }

  /**
   * Get text content from a run (for utility purposes)
   * @param run - DOCX run element
   * @returns Plain text content
   */
  static getTextContent(run: Run): string {
    return this.extractTextContent(run);
  }

  /**
   * Check if a run is empty (no text content)
   * @param run - DOCX run element
   * @returns True if run has no meaningful content
   */
  static isEmpty(run: Run): boolean {
    const textContent = this.getTextContent(run).trim();
    return textContent.length === 0;
  }

  /**
   * Merge adjacent runs with the same properties - utility function
   * @param runs - Array of runs to merge
   * @returns Merged runs array
   */
  static mergeAdjacentRuns(runs: Run[]): Run[] {
    if (runs.length <= 1) {
      return runs;
    }

    const merged: Run[] = [];
    let currentRun = runs[0];

    if (!currentRun) {
      return runs;
    }

    for (let i = 1; i < runs.length; i++) {
      const nextRun = runs[i];
      
      if (!nextRun) {
        continue;
      }
      
      if (this.haveSameProperties(currentRun, nextRun)) {
        // Merge the runs by combining their contents
        currentRun = {
          ...currentRun,
          contents: [...currentRun.contents, ...nextRun.contents],
        };
      } else {
        merged.push(currentRun);
        currentRun = nextRun;
      }
    }

    merged.push(currentRun);
    return merged;
  }

  /**
   * Check if two runs have the same properties
   * @param run1 - First run
   * @param run2 - Second run
   * @returns True if properties are the same
   */
  private static haveSameProperties(run1: Run, run2: Run): boolean {
    // Simple comparison - in a more robust implementation,
    // this would do deep comparison of properties
    return JSON.stringify(run1.properties) === JSON.stringify(run2.properties);
  }

  /**
   * Get run statistics
   * @param run - DOCX run element
   * @returns Statistics about the run
   */
  static getStatistics(run: Run): {
    contentCount: number;
    textLength: number;
    hasProperties: boolean;
    isEmpty: boolean;
  } {
    return {
      contentCount: run.contents.length,
      textLength: this.getTextContent(run).length,
      hasProperties: !!run.properties,
      isEmpty: this.isEmpty(run)
    };
  }
} 