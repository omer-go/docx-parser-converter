/**
 * Run Converter for TXT Output
 * 
 * Converts DOCX run elements to plain text with proper
 * text content extraction and basic formatting preservation.
 */

import type { Run, RunContent, TextContent, TabContent } from '@/models/paragraph-models.js';
import type { TxtElement, ConversionContext } from './index.js';

/**
 * Converter for DOCX run elements to plain text
 */
export class RunConverter {
  /**
   * Convert a DOCX run to plain text
   * @param run - DOCX run element
   * @param context - Conversion context
   * @returns TXT element containing the run text
   */
  static convertRun(run: Run, context: ConversionContext): TxtElement {
    // Convert run contents to text
    const content = this.convertRunContents(run.contents, context);

    // Add debug comment if enabled
    if (context.includeDebugComments && content.length > 0) {
      return {
        content: `[Run: ${run.contents.length} content(s)] ${content}`,
        lineBreak: false,
      };
    }

    return {
      content,
      lineBreak: false,
    };
  }

  /**
   * Convert run contents to plain text
   * @param contents - Array of run contents
   * @param context - Conversion context
   * @returns Plain text string
   */
  private static convertRunContents(
    contents: RunContent[],
    context: ConversionContext
  ): string {
    if (contents.length === 0) {
      return '';
    }

    const textParts: string[] = [];
    
    for (const content of contents) {
      if (this.isTextContent(content.run)) {
        const text = this.convertTextContent(content.run as TextContent);
        if (text) {
          textParts.push(text);
        }
      } else if (this.isTabContent(content.run)) {
        const tabText = this.convertTabContent(content.run as TabContent, context);
        textParts.push(tabText);
      } else {
        context.warnings.push(`Unknown run content type: ${JSON.stringify(content.run)}`);
      }
    }

    return textParts.join('');
  }

  /**
   * Convert text content to string
   * @param textContent - DOCX text content
   * @returns Plain text string
   */
  private static convertTextContent(textContent: TextContent): string {
    // Return text as-is, preserving whitespace and special characters
    return textContent.text;
  }

  /**
   * Convert tab content to text representation
   * @param _tabContent - DOCX tab content (unused for now)
   * @param context - Conversion context
   * @returns Tab representation as spaces
   */
  private static convertTabContent(
    _tabContent: TabContent,
    context: ConversionContext
  ): string {
    // Convert tab to spaces based on indent size
    return ' '.repeat(context.indentSize);
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
    const textParts: string[] = [];
    
    for (const content of run.contents) {
      if (this.isTextContent(content.run)) {
        textParts.push((content.run as TextContent).text);
      } else if (this.isTabContent(content.run)) {
        textParts.push('\t'); // Use tab character for extraction
      }
    }
    
    return textParts.join('');
  }

  /**
   * Check if a run is empty (no text content)
   * @param run - DOCX run element
   * @returns True if run has no meaningful text content
   */
  static isEmpty(run: Run): boolean {
    return this.getTextContent(run).trim().length === 0;
  }

  /**
   * Merge adjacent runs with same properties for optimization
   * @param runs - Array of runs to merge
   * @returns Array of merged runs
   */
  static mergeAdjacentRuns(runs: Run[]): Run[] {
    if (runs.length <= 1) {
      return runs;
    }

    const mergedRuns: Run[] = [];
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
        mergedRuns.push(currentRun);
        currentRun = nextRun;
      }
    }
    
    mergedRuns.push(currentRun);
    return mergedRuns;
  }

  /**
   * Check if two runs have the same properties
   * @param run1 - First run
   * @param run2 - Second run
   * @returns True if runs have identical properties
   */
  private static haveSameProperties(run1: Run, run2: Run): boolean {
    // Simple comparison - in real implementation might need deeper comparison
    return JSON.stringify(run1.properties) === JSON.stringify(run2.properties);
  }
} 