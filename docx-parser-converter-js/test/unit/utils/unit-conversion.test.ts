import { describe, it, expect } from 'vitest';
import {
  twipsToInches,
  inchesToTwips,
  twipsToPoints,
  pointsToTwips,
  pointsToInches,
  inchesToPoints,
  parseMeasurement,
  formatCssMeasurement,
  toPixels,
  fromPixels,
} from '@/utils/unit-conversion.js';

describe('Unit Conversion Utilities', () => {
  describe('Twips conversions', () => {
    it('should convert twips to inches correctly', () => {
      expect(twipsToInches(1440)).toBe(1);
      expect(twipsToInches(720)).toBe(0.5);
      expect(twipsToInches(0)).toBe(0);
    });

    it('should convert inches to twips correctly', () => {
      expect(inchesToTwips(1)).toBe(1440);
      expect(inchesToTwips(0.5)).toBe(720);
      expect(inchesToTwips(0)).toBe(0);
    });

    it('should convert twips to points correctly', () => {
      expect(twipsToPoints(20)).toBe(1);
      expect(twipsToPoints(240)).toBe(12);
      expect(twipsToPoints(0)).toBe(0);
    });

    it('should convert points to twips correctly', () => {
      expect(pointsToTwips(1)).toBe(20);
      expect(pointsToTwips(12)).toBe(240);
      expect(pointsToTwips(0)).toBe(0);
    });
  });

  describe('Points conversions', () => {
    it('should convert points to inches correctly', () => {
      expect(pointsToInches(72)).toBe(1);
      expect(pointsToInches(36)).toBe(0.5);
      expect(pointsToInches(0)).toBe(0);
    });

    it('should convert inches to points correctly', () => {
      expect(inchesToPoints(1)).toBe(72);
      expect(inchesToPoints(0.5)).toBe(36);
      expect(inchesToPoints(0)).toBe(0);
    });
  });

  describe('Pixel conversions', () => {
    it('should convert points to pixels correctly', () => {
      expect(toPixels(72, 'points')).toBe(96); // 1 inch = 96px at 96 DPI
      expect(toPixels(36, 'points')).toBe(48); // 0.5 inch = 48px
    });

    it('should convert pixels to points correctly', () => {
      expect(fromPixels(96, 'points')).toBe(72); // 96px = 1 inch = 72pt
      expect(fromPixels(48, 'points')).toBe(36); // 48px = 0.5 inch = 36pt
    });

    it('should handle different units for pixel conversion', () => {
      expect(toPixels(1, 'inches')).toBe(96);
      expect(toPixels(1440, 'twips')).toBe(96);
      expect(fromPixels(96, 'inches')).toBe(1);
      expect(fromPixels(96, 'twips')).toBe(1440);
    });

    it('should throw error for unknown units', () => {
      expect(() => toPixels(10, 'unknown')).toThrow('Unknown unit: unknown');
      expect(() => fromPixels(10, 'unknown')).toThrow('Unknown unit: unknown');
    });
  });

  describe('Measurement parsing', () => {
    it('should parse measurement strings correctly', () => {
      expect(parseMeasurement('12pt')).toBe(12);
      expect(parseMeasurement('1in')).toBe(72);
      expect(parseMeasurement('36pt')).toBe(36);
      expect(parseMeasurement('0.5in')).toBe(36);
    });

    it('should handle measurements without units', () => {
      expect(parseMeasurement('12')).toBe(12);
      expect(parseMeasurement('24')).toBe(24);
    });

    it('should handle invalid measurements', () => {
      expect(parseMeasurement('invalid')).toBe(0);
      expect(parseMeasurement('')).toBe(0);
    });

    it('should handle non-string inputs', () => {
      expect(parseMeasurement(null as any)).toBe(0);
      expect(parseMeasurement(undefined as any)).toBe(0);
      expect(parseMeasurement(123 as any)).toBe(0);
    });
  });

  describe('CSS measurement formatting', () => {
    it('should format measurements as CSS values', () => {
      expect(formatCssMeasurement(12, 'pt')).toBe('12pt');
      expect(formatCssMeasurement(72, 'px')).toBe('96px'); // 72pt = 96px at 96 DPI
      expect(formatCssMeasurement(72, 'in')).toBe('1in');
    });

    it('should use default unit when not specified', () => {
      expect(formatCssMeasurement(12)).toBe('12pt');
    });

    it('should handle em/rem units', () => {
      const result = formatCssMeasurement(16, 'em');
      expect(result).toMatch(/^[\d.]+em$/);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle zero values correctly', () => {
      expect(twipsToInches(0)).toBe(0);
      expect(pointsToInches(0)).toBe(0);
      expect(toPixels(0, 'points')).toBe(0);
      expect(parseMeasurement('0pt')).toBe(0);
    });

    it('should handle negative values correctly', () => {
      expect(twipsToInches(-1440)).toBe(-1);
      expect(pointsToInches(-72)).toBe(-1);
      expect(parseMeasurement('-12pt')).toBe(-12);
    });

    it('should handle decimal values correctly', () => {
      expect(twipsToInches(720)).toBe(0.5);
      expect(pointsToInches(36)).toBe(0.5);
      expect(parseMeasurement('12.5pt')).toBe(12.5);
    });
  });
});
