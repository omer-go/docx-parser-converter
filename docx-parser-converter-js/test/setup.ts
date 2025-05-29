/**
 * Test setup file for Vitest
 * Configures global test environment and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

/**
 * Global test setup
 */
beforeAll(() => {
  // Setup global test environment
  console.log('Setting up test environment...');
});

/**
 * Global test cleanup
 */
afterAll(() => {
  // Cleanup global test environment
  console.log('Cleaning up test environment...');
});

/**
 * Setup before each test
 */
beforeEach(() => {
  // Reset any global state before each test
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  // Cleanup after each test
});

/**
 * Mock DOM APIs for testing
 */
if (typeof global !== 'undefined') {
  // Mock File API
  global.File = class MockFile {
    public name: string;
    public type: string;
    public size: number;
    public lastModified: number;
    public webkitRelativePath: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(_bits: any[], name: string, options?: any) {
      this.name = name;
      this.type = options?.type || '';
      this.size = 0;
      this.lastModified = options?.lastModified || Date.now();
      this.webkitRelativePath = '';
    }

    slice(): Blob {
      return new Blob([]);
    }

    stream(): ReadableStream {
      return new ReadableStream();
    }

    text(): Promise<string> {
      return Promise.resolve('');
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new ArrayBuffer(0));
    }
  } as any;

  // Mock FileReader
  global.FileReader = class MockFileReader {
    public result: string | ArrayBuffer | null = null;
    public error: DOMException | null = null;
    public readyState: number = 0;
    public onload: ((_event: ProgressEvent) => void) | null = null;
    public onerror: ((_event: ProgressEvent) => void) | null = null;
    public onprogress: ((_event: ProgressEvent) => void) | null = null;

    readAsText(): void {
      setTimeout(() => {
        this.result = '';
        this.readyState = 2;
        if (this.onload) {
          this.onload({} as ProgressEvent);
        }
      }, 0);
    }

    readAsArrayBuffer(): void {
      setTimeout(() => {
        this.result = new ArrayBuffer(0);
        this.readyState = 2;
        if (this.onload) {
          this.onload({} as ProgressEvent);
        }
      }, 0);
    }

    abort(): void {
      this.readyState = 2;
    }
  } as any;

  // Mock Blob
  global.Blob = class MockBlob {
    public size: number = 0;
    public type: string = '';
    public bytes: () => Promise<Uint8Array> = async () => new Uint8Array();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(_blobParts?: any[], options?: any) {
      this.type = options?.type || '';
    }

    slice(): Blob {
      return new MockBlob();
    }

    stream(): ReadableStream {
      return new ReadableStream();
    }

    text(): Promise<string> {
      return Promise.resolve('');
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new ArrayBuffer(0));
    }
  } as any;

  // Mock URL
  global.URL = {
    createObjectURL: (): string => 'blob:mock-url',
    revokeObjectURL: (): void => {},
  } as any;

  // Mock btoa/atob
  global.btoa = (str: string): string => Buffer.from(str, 'binary').toString('base64');
  global.atob = (str: string): string => Buffer.from(str, 'base64').toString('binary');
}
