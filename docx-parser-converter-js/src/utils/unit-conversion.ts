import { UNITS } from '@/constants/defaults.js';

/**
 * Unit conversion utilities for DOCX document measurements
 * Provides functions to convert between different units used in DOCX files
 */

/**
 * Convert twips to inches
 * @param twips - Value in twips
 * @returns Value in inches
 */
export function twipsToInches(twips: number): number {
  return twips / UNITS.TWIPS_PER_INCH;
}

/**
 * Convert inches to twips
 * @param inches - Value in inches
 * @returns Value in twips
 */
export function inchesToTwips(inches: number): number {
  return inches * UNITS.TWIPS_PER_INCH;
}

/**
 * Convert twips to points
 * @param twips - Value in twips
 * @returns Value in points
 */
export function twipsToPoints(twips: number): number {
  return twips / UNITS.TWIPS_PER_POINT;
}

/**
 * Convert points to twips
 * @param points - Value in points
 * @returns Value in twips
 */
export function pointsToTwips(points: number): number {
  return points * UNITS.TWIPS_PER_POINT;
}

/**
 * Convert twips to centimeters
 * @param twips - Value in twips
 * @returns Value in centimeters
 */
export function twipsToCm(twips: number): number {
  return twips / UNITS.TWIPS_PER_CM;
}

/**
 * Convert centimeters to twips
 * @param cm - Value in centimeters
 * @returns Value in twips
 */
export function cmToTwips(cm: number): number {
  return cm * UNITS.TWIPS_PER_CM;
}

/**
 * Convert twips to millimeters
 * @param twips - Value in twips
 * @returns Value in millimeters
 */
export function twipsToMm(twips: number): number {
  return twips / UNITS.TWIPS_PER_MM;
}

/**
 * Convert millimeters to twips
 * @param mm - Value in millimeters
 * @returns Value in twips
 */
export function mmToTwips(mm: number): number {
  return mm * UNITS.TWIPS_PER_MM;
}

/**
 * Convert points to inches
 * @param points - Value in points
 * @returns Value in inches
 */
export function pointsToInches(points: number): number {
  return points / UNITS.POINTS_PER_INCH;
}

/**
 * Convert inches to points
 * @param inches - Value in inches
 * @returns Value in points
 */
export function inchesToPoints(inches: number): number {
  return inches * UNITS.POINTS_PER_INCH;
}

/**
 * Convert points to centimeters
 * @param points - Value in points
 * @returns Value in centimeters
 */
export function pointsToCm(points: number): number {
  return points / UNITS.POINTS_PER_CM;
}

/**
 * Convert centimeters to points
 * @param cm - Value in centimeters
 * @returns Value in points
 */
export function cmToPoints(cm: number): number {
  return cm * UNITS.POINTS_PER_CM;
}

/**
 * Convert points to millimeters
 * @param points - Value in points
 * @returns Value in millimeters
 */
export function pointsToMm(points: number): number {
  return points / UNITS.POINTS_PER_MM;
}

/**
 * Convert millimeters to points
 * @param mm - Value in millimeters
 * @returns Value in points
 */
export function mmToPoints(mm: number): number {
  return mm * UNITS.POINTS_PER_MM;
}

/**
 * Convert EMU (English Metric Units) to inches
 * @param emu - Value in EMU
 * @returns Value in inches
 */
export function emuToInches(emu: number): number {
  return emu / UNITS.EMU_PER_INCH;
}

/**
 * Convert inches to EMU
 * @param inches - Value in inches
 * @returns Value in EMU
 */
export function inchesToEmu(inches: number): number {
  return inches * UNITS.EMU_PER_INCH;
}

/**
 * Convert EMU to points
 * @param emu - Value in EMU
 * @returns Value in points
 */
export function emuToPoints(emu: number): number {
  return emu / UNITS.EMU_PER_POINT;
}

/**
 * Convert points to EMU
 * @param points - Value in points
 * @returns Value in EMU
 */
export function pointsToEmu(points: number): number {
  return points * UNITS.EMU_PER_POINT;
}

/**
 * Convert EMU to centimeters
 * @param emu - Value in EMU
 * @returns Value in centimeters
 */
export function emuToCm(emu: number): number {
  return emu / UNITS.EMU_PER_CM;
}

/**
 * Convert centimeters to EMU
 * @param cm - Value in centimeters
 * @returns Value in EMU
 */
export function cmToEmu(cm: number): number {
  return cm * UNITS.EMU_PER_CM;
}

/**
 * Convert DXA (Twentieths of a point) to points
 * @param dxa - Value in DXA
 * @returns Value in points
 */
export function dxaToPoints(dxa: number): number {
  return dxa / UNITS.DXA_PER_POINT;
}

/**
 * Convert points to DXA
 * @param points - Value in points
 * @returns Value in DXA
 */
export function pointsToDxa(points: number): number {
  return points * UNITS.DXA_PER_POINT;
}

/**
 * Convert DXA to inches
 * @param dxa - Value in DXA
 * @returns Value in inches
 */
export function dxaToInches(dxa: number): number {
  return dxa / UNITS.DXA_PER_INCH;
}

/**
 * Convert inches to DXA
 * @param inches - Value in inches
 * @returns Value in DXA
 */
export function inchesToDxa(inches: number): number {
  return inches * UNITS.DXA_PER_INCH;
}

/**
 * Convert any unit to pixels (assuming 96 DPI)
 * @param value - Value to convert
 * @param unit - Source unit ('twips', 'points', 'inches', 'cm', 'mm', 'emu', 'dxa')
 * @returns Value in pixels
 */
export function toPixels(value: number, unit: string): number {
  const DPI = 96; // Standard web DPI

  switch (unit.toLowerCase()) {
    case 'twips':
      return (value / UNITS.TWIPS_PER_INCH) * DPI;
    case 'points':
    case 'pt':
      return (value / UNITS.POINTS_PER_INCH) * DPI;
    case 'inches':
    case 'in':
      return value * DPI;
    case 'cm':
      return (value / 2.54) * DPI;
    case 'mm':
      return (value / 25.4) * DPI;
    case 'emu':
      return (value / UNITS.EMU_PER_INCH) * DPI;
    case 'dxa':
      return (value / UNITS.DXA_PER_INCH) * DPI;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Convert pixels to any unit (assuming 96 DPI)
 * @param pixels - Value in pixels
 * @param unit - Target unit ('twips', 'points', 'inches', 'cm', 'mm', 'emu', 'dxa')
 * @returns Value in target unit
 */
export function fromPixels(pixels: number, unit: string): number {
  const DPI = 96; // Standard web DPI
  const inches = pixels / DPI;

  switch (unit.toLowerCase()) {
    case 'twips':
      return inches * UNITS.TWIPS_PER_INCH;
    case 'points':
    case 'pt':
      return inches * UNITS.POINTS_PER_INCH;
    case 'inches':
    case 'in':
      return inches;
    case 'cm':
      return inches * 2.54;
    case 'mm':
      return inches * 25.4;
    case 'emu':
      return inches * UNITS.EMU_PER_INCH;
    case 'dxa':
      return inches * UNITS.DXA_PER_INCH;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Parse a measurement string and convert to points
 * @param measurement - Measurement string (e.g., "12pt", "1in", "2.5cm")
 * @returns Value in points
 */
export function parseMeasurement(measurement: string): number {
  if (typeof measurement !== 'string') {
    return 0;
  }

  const match = measurement.match(/^(-?\d*\.?\d+)([a-zA-Z%]*)$/);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]!);
  const unit = match[2] || 'pt';

  switch (unit.toLowerCase()) {
    case 'pt':
    case 'points':
      return value;
    case 'in':
    case 'inches':
      return inchesToPoints(value);
    case 'cm':
      return cmToPoints(value);
    case 'mm':
      return mmToPoints(value);
    case 'twips':
      return twipsToPoints(value);
    case 'emu':
      return emuToPoints(value);
    case 'dxa':
      return dxaToPoints(value);
    case 'px':
    case 'pixels':
      return fromPixels(value, 'points');
    default:
      return value; // Assume points if unknown unit
  }
}

/**
 * Format a value in points as a CSS measurement
 * @param points - Value in points
 * @param unit - Target CSS unit ('pt', 'px', 'em', 'rem', 'in', 'cm', 'mm')
 * @returns Formatted CSS measurement string
 */
export function formatCssMeasurement(points: number, unit: string = 'pt'): string {
  switch (unit.toLowerCase()) {
    case 'pt':
      return `${points}pt`;
    case 'px':
      return `${Math.round(toPixels(points, 'points'))}px`;
    case 'in':
      return `${pointsToInches(points)}in`;
    case 'cm':
      return `${pointsToCm(points)}cm`;
    case 'mm':
      return `${pointsToMm(points)}mm`;
    case 'em':
    case 'rem':
      // Assume 16px base font size for em/rem conversion
      return `${(toPixels(points, 'points') / 16).toFixed(3)}${unit}`;
    default:
      return `${points}pt`;
  }
}

/**
 * Convert twips to points (alias for twipsToPoints)
 * @param twips - Value in twips
 * @returns Value in points
 */
export function convertTwipsToPoints(twips: number): number {
  return twipsToPoints(twips);
}

/**
 * Convert half-points to points
 * @param halfPoints - Value in half-points
 * @returns Value in points
 */
export function convertHalfPointsToPoints(halfPoints: number): number {
  return halfPoints / 2.0;
}
