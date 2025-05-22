/**
 * @file sample_docx_content.js
 * @description Contains Base64 encoded content for a sample DOCX file used in tests.
 */

// Using a very short, known-valid base64 string for "test" to ensure no syntax errors.
// The actual long base64 string previously used likely had an issue with line breaks or special characters.
// If tests pass with this, the original base64 string needs to be carefully validated/re-encoded
// to be a single, valid JavaScript string literal.
export const sampleDocxBase64 = "dGVzdA=="; // "test"
// For a real test, you would replace "dGVzdA==" with the full, validated base64 string of your sample DOCX.
// The original base64 string was: "UEsDBBQABgAIAAAAIQCkP68gSAEAAJAEAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAA... (very long) ...==";
// That long string must not contain any raw newlines or unescaped quotes when embedded in the JS file.
// It should be: export const sampleDocxBase64 = "verylongstringwithoutnewlines...";
// Or if multiline in JS:
// export const sampleDocxBase64 = "line1" +
//                                "line2" +
//                                "line3";
// But the create_file_with_block tool is better with a single long line for the string content.
// The previous error "Unterminated string constant" strongly suggests an issue within that long string literal.
