import type { Run } from '../../docx_parsers/models/paragraphModels';

/**
 * Converts a run to plain text for TXT output, preserving the logic of the Python implementation.
 */
export class RunConverter {
    /**
     * Convert a run to plain text.
     * @param run The run object.
     * @returns Plain text representation of the run.
     */
    public static convertRun(run: Run): string {
        let runText = '';
        for (const content of run.contents) {
            if (content.type === 'tab') {
                runText += '\t';
            } else if (content.type === 'text') {
                runText += content.text;
            }
        }
        return runText;
    }
} 