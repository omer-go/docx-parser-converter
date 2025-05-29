/**
 * File handling utilities for DOCX documents in browser environment
 * Provides functions for reading, extracting, and processing DOCX files
 */

import JSZip from 'jszip';

/**
 * DOCX file structure interface
 */
export interface DocxFileStructure {
  '[Content_Types].xml': string;
  '_rels/.rels': string;
  'word/document.xml': string;
  'word/_rels/document.xml.rels'?: string;
  'word/styles.xml'?: string;
  'word/numbering.xml'?: string;
  'word/theme/theme1.xml'?: string;
  'word/fontTable.xml'?: string;
  'word/webSettings.xml'?: string;
  'word/settings.xml'?: string;
  [key: string]: string | undefined;
}

/**
 * Read a file as ArrayBuffer
 * @param file - File object to read
 * @returns Promise that resolves to ArrayBuffer
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = (): void => {
      reject(new Error('Error reading file'));
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file as text
 * @param file - File object to read
 * @param encoding - Text encoding (default: 'utf-8')
 * @returns Promise that resolves to text content
 */
export async function readFileAsText(file: File, encoding: string = 'utf-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = (): void => {
      reject(new Error('Error reading file'));
    };
    reader.readAsText(file, encoding);
  });
}

/**
 * Extract ZIP contents from DOCX file (placeholder)
 * @param arrayBuffer - ArrayBuffer containing DOCX file data
 * @returns Promise resolving to DOCX file structure
 */
export async function extractZipContents(_arrayBuffer: ArrayBuffer): Promise<DocxFileStructure> {
  // TODO: Implement ZIP extraction using a browser-compatible ZIP library
  // This will be implemented in Phase 3
  throw new Error('ZIP extraction not yet implemented. This will be available in Phase 3.');
}

/**
 * Validate if a file is a valid DOCX file
 * @param file - File to validate
 * @returns Promise that resolves to true if valid DOCX, false otherwise
 */
export async function isValidDocxFile(file: File): Promise<boolean> {
  try {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return false;
    }

    // Check MIME type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream', // Some browsers may report this
      'application/zip', // DOCX is essentially a ZIP file
    ];

    if (!validMimeTypes.includes(file.type)) {
      return false;
    }

    // Read first few bytes to check ZIP signature
    const fileSlice = file.slice(0, 4);
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (): void => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file slice as ArrayBuffer'));
        }
      };
      reader.onerror = (): void => {
        reject(new Error('Error reading file slice'));
      };
      reader.readAsArrayBuffer(fileSlice);
    });

    const view = new Uint8Array(buffer);

    // ZIP file signature: 0x504B0304 (PK..)
    return view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04;
  } catch {
    return false;
  }
}

/**
 * Get file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Create download URL for converted content
 * @param content - Content to download (string or Blob)
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type for the content
 * @returns Download URL
 */
export function createDownloadUrl(
  content: string | Blob,
  _filename: string,
  mimeType: string
): string {
  let blob: Blob;

  if (typeof content === 'string') {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = content;
  }

  return URL.createObjectURL(blob);
}

/**
 * Trigger a file download in the browser
 * @param content - File content as string or Blob
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type of the file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const url = createDownloadUrl(content, filename, mimeType);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 encoded string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param base64 - Base64 encoded string
 * @returns ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Extract file extension from filename
 * @param filename - Name of the file
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Get filename without extension
 * @param filename - Name of the file
 * @returns Filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
}

/**
 * Sanitize filename for safe usage
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Check if the current environment supports File API
 * @returns True if File API is supported, false otherwise
 */
export function isFileApiSupported(): boolean {
  return (
    typeof File !== 'undefined' && typeof FileReader !== 'undefined' && typeof Blob !== 'undefined'
  );
}

/**
 * Check if the current environment supports drag and drop
 * @returns True if drag and drop is supported, false otherwise
 */
export function isDragDropSupported(): boolean {
  const div = document.createElement('div');
  return 'draggable' in div || ('ondragstart' in div && 'ondrop' in div);
}

/**
 * Create a file input element for file selection
 * @param accept - Accepted file types (e.g., '.docx')
 * @param multiple - Whether to allow multiple file selection
 * @returns File input element
 */
export function createFileInput(
  accept: string = '.docx',
  multiple: boolean = false
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  input.style.display = 'none';
  return input;
}

/**
 * Open file selection dialog
 * @param accept - Accepted file types (e.g., '.docx')
 * @param multiple - Whether to allow multiple file selection
 * @returns Promise that resolves to selected files
 */
export function selectFiles(
  accept: string = '.docx',
  multiple: boolean = false
): Promise<FileList | null> {
  return new Promise(resolve => {
    const input = createFileInput(accept, multiple);
    input.onchange = (): void => {
      resolve(input.files);
    };
    input.oncancel = (): void => {
      resolve(null);
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

/**
 * File utility functions for DOCX processing
 * Provides browser-compatible file and ZIP processing capabilities
 */

/**
 * Error thrown when file processing fails
 */
export class FileProcessingError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'FileProcessingError';
  }
}

/**
 * Extract XML content from DOCX file
 * @param docxFile - DOCX file as ArrayBuffer or Uint8Array
 * @param xmlFileName - Name of XML file to extract (e.g., 'document.xml')
 * @returns Promise resolving to XML content as string
 * @throws FileProcessingError if extraction fails
 */
export async function extractXMLFromDocx(
  docxFile: ArrayBuffer | Uint8Array,
  xmlFileName: string
): Promise<string> {
  try {
    // Dynamic import of JSZip for browser compatibility
    const JSZip = (await import('jszip')).default;
    
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(docxFile);

    // Try to find the file in the word/ directory
    const xmlPath = `word/${xmlFileName}`;
    const xmlFile = loadedZip.file(xmlPath);

    if (!xmlFile) {
      throw new Error(`XML file '${xmlPath}' not found in DOCX archive`);
    }

    const xmlContent = await xmlFile.async('string');
    return xmlContent;
  } catch (error) {
    throw new FileProcessingError(
      `Failed to extract XML '${xmlFileName}' from DOCX: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Extract multiple XML files from DOCX
 * @param docxFile - DOCX file as ArrayBuffer or Uint8Array
 * @param xmlFileNames - Array of XML file names to extract
 * @returns Promise resolving to map of filename -> XML content
 */
export async function extractMultipleXMLFromDocx(
  docxFile: ArrayBuffer | Uint8Array,
  xmlFileNames: string[]
): Promise<Map<string, string>> {
  try {
    const JSZip = (await import('jszip')).default;

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(docxFile);

    const xmlContents = new Map<string, string>();

    for (const xmlFileName of xmlFileNames) {
      const xmlPath = `word/${xmlFileName}`;
      const xmlFile = loadedZip.file(xmlPath);

      if (xmlFile) {
        const xmlContent = await xmlFile.async('string');
        xmlContents.set(xmlFileName, xmlContent);
      }
    }

    return xmlContents;
  } catch (error) {
    throw new FileProcessingError(
      `Failed to extract XML files from DOCX: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Check if DOCX file contains specific XML file
 * @param docxFile - DOCX file as ArrayBuffer or Uint8Array
 * @param xmlFileName - Name of XML file to check
 * @returns Promise resolving to boolean indicating if file exists
 */
export async function hasXMLFile(
  docxFile: ArrayBuffer | Uint8Array,
  xmlFileName: string
): Promise<boolean> {
  try {
    const JSZip = (await import('jszip')).default;

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(docxFile);

    const xmlPath = `word/${xmlFileName}`;
    return loadedZip.file(xmlPath) !== null;
  } catch {
    return false;
  }
}

/**
 * List all XML files in DOCX word/ directory
 * @param docxFile - DOCX file as ArrayBuffer or Uint8Array
 * @returns Promise resolving to array of XML file names
 */
export async function listXMLFiles(docxFile: ArrayBuffer | Uint8Array): Promise<string[]> {
  try {
    const JSZip = (await import('jszip')).default;

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(docxFile);

    const xmlFiles: string[] = [];

    loadedZip.forEach((relativePath, file) => {
      if (!file.dir && relativePath.startsWith('word/') && relativePath.endsWith('.xml')) {
        const fileName = relativePath.replace('word/', '');
        xmlFiles.push(fileName);
      }
    });

    return xmlFiles;
  } catch (error) {
    throw new FileProcessingError(
      `Failed to list XML files in DOCX: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Extracts the content of word/document.xml from a DOCX file.
 * @param file - The DOCX file (File object, or a mock with an async arrayBuffer() method).
 * @returns A promise that resolves with the string content of word/document.xml.
 * @throws Error if the file is not a valid DOCX or word/document.xml is not found.
 */
export async function extractMainDocumentXml(file: File | { arrayBuffer: () => Promise<ArrayBuffer | Buffer> }): Promise<string> {
  try {
    // Get the ArrayBuffer content from the file object or mock
    const bufferContent = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(bufferContent);
    const docXmlFile = zip.file('word/document.xml');

    if (docXmlFile) {
      return docXmlFile.async('string');
    }
    // Try alternative path for some DOCX generators (e.g., WPS Office)
    const altDocXmlFile = zip.file('word/document2.xml');
    if (altDocXmlFile) {
      console.warn('Using alternative path word/document2.xml');
      return altDocXmlFile.async('string');
    }

    throw new Error('word/document.xml (or word/document2.xml) not found in DOCX file.');
  } catch (error) {
    console.error('Error reading DOCX file:', error);
    throw new Error(`Failed to read or process DOCX file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Utility to convert a File object to an ArrayBuffer.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the ArrayBuffer.
 */
export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate DOCX file structure
 * @param docxFile - DOCX file as ArrayBuffer or Uint8Array
 * @returns Promise resolving to validation result
 */
export async function validateDocxStructure(
  docxFile: ArrayBuffer | Uint8Array
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const JSZip = (await import('jszip')).default;

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(docxFile);

    // Check for required files
    const requiredFiles = ['word/document.xml', '[Content_Types].xml'];

    for (const requiredFile of requiredFiles) {
      if (!loadedZip.file(requiredFile)) {
        errors.push(`Missing required file: ${requiredFile}`);
      }
    }

    // Check for word/document.xml specifically
    const documentXml = loadedZip.file('word/document.xml');
    if (documentXml) {
      try {
        const content = await documentXml.async('string');
        if (!content.includes('<w:document')) {
          errors.push('Invalid document.xml structure');
        }
      } catch {
        errors.push('Failed to read document.xml content');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(
      `Failed to validate DOCX structure: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );

    return {
      isValid: false,
      errors,
    };
  }
}
