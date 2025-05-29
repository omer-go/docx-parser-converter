// src/types/common.ts
import { z } from 'zod';

/**
 * Represents a measurement in twentieths of a point (twips).
 * Common unit in Open XML.
 */
export type Twips = number;

/**
 * Represents a measurement in points.
 */
export type Point = number;

/**
 * Represents a measurement in EMU (English Metric Units).
 * 1 inch = 914400 EMU
 * 1 cm = 360000 EMU
 */
export type EMU = number;

/**
 * Represents a color, typically as a hex string (e.g., "FF0000" for red) without '#'.
 * Could also be "auto" or specific theme color names.
 */
export type Color = string; 

/**
 * Represents a language code (e.g., "en-US").
 */
export type LanguageCode = string;

/**
 * Zod schema for non-negative integers.
 */
export const NonNegativeIntSchema = z.number().int().nonnegative();

/**
 *  Zod schema for strings that are not empty
 */
export const NotEmptyStringSchema = z.string().min(1);


// Add more common simple types as needed
