/**
 * Styles merger for DOCX documents
 * Handles style inheritance and property merging logic
 */

import {
  type Style,
  type StylesSchema,
  type ParagraphStyleProperties,
  ParagraphStylePropertiesModel,
  type RunStyleProperties,
  RunStylePropertiesModel,
  type SpacingProperties,
  SpacingPropertiesModel,
  type IndentationProperties,
  IndentationPropertiesModel,
  type FontProperties,
  FontPropertiesModel,
} from '@/models/styles-models.js';

/**
 * Merged style result containing resolved properties
 */
export interface MergedStyle {
  /** The final style ID */
  styleId: string;
  /** The final style name */
  name: string;
  /** Merged paragraph properties */
  paragraphProperties?: ParagraphStyleProperties;
  /** Merged run properties */
  runProperties?: RunStyleProperties;
  /** Style inheritance chain used for merging */
  inheritanceChain: Style[];
}

/**
 * Style merger class for handling inheritance and property merging
 */
export class StylesMerger {
  private stylesSchema: StylesSchema;
  private mergedStylesCache = new Map<string, MergedStyle>();

  constructor(stylesSchema: StylesSchema) {
    this.stylesSchema = stylesSchema;
  }

  /**
   * Get merged style with full inheritance resolution
   * @param styleId - Style ID to resolve
   * @returns Merged style or undefined if not found
   */
  public getMergedStyle(styleId: string): MergedStyle | undefined {
    // Check cache first
    if (this.mergedStylesCache.has(styleId)) {
      return this.mergedStylesCache.get(styleId);
    }

    // Find the style
    const style = this.stylesSchema.styles.find(s => s.style_id === styleId);
    if (!style) {
      return undefined;
    }

    // Build inheritance chain
    const inheritanceChain = this.buildInheritanceChain(styleId);
    if (inheritanceChain.length === 0) {
      return undefined;
    }

    // Merge properties from base to derived
    const mergedStyle = this.mergeStyleChain(inheritanceChain);
    
    // Cache the result
    this.mergedStylesCache.set(styleId, mergedStyle);
    
    return mergedStyle;
  }

  /**
   * Build inheritance chain for a style
   * @param styleId - Starting style ID
   * @returns Array of styles from base to derived
   */
  private buildInheritanceChain(styleId: string): Style[] {
    const chain: Style[] = [];
    let currentStyleId: string | undefined = styleId;
    const visited = new Set<string>();

    while (currentStyleId && !visited.has(currentStyleId)) {
      visited.add(currentStyleId);
      
      const style = this.stylesSchema.styles.find(s => s.style_id === currentStyleId);
      if (!style) break;
      
      chain.unshift(style); // Add to beginning to maintain base-to-derived order
      currentStyleId = style.based_on || undefined;
    }

    return chain;
  }

  /**
   * Merge style chain from base to derived
   * @param inheritanceChain - Array of styles from base to derived
   * @returns Merged style
   */
  private mergeStyleChain(inheritanceChain: Style[]): MergedStyle {
    if (inheritanceChain.length === 0) {
      throw new Error('Cannot merge empty inheritance chain');
    }

    // Start with the most derived style (last in chain)
    const derivedStyle = inheritanceChain[inheritanceChain.length - 1];
    if (!derivedStyle) {
      throw new Error('Invalid inheritance chain: missing derived style');
    }
    
    // Merge paragraph properties
    const paragraphProperties = this.mergeParagraphProperties(inheritanceChain);
    
    // Merge run properties
    const runProperties = this.mergeRunProperties(inheritanceChain);

    return {
      styleId: derivedStyle.style_id,
      name: derivedStyle.name,
      ...(paragraphProperties && { paragraphProperties }),
      ...(runProperties && { runProperties }),
      inheritanceChain,
    };
  }

  /**
   * Merge paragraph properties from inheritance chain
   * @param inheritanceChain - Array of styles from base to derived
   * @returns Merged paragraph properties or undefined
   */
  private mergeParagraphProperties(inheritanceChain: Style[]): ParagraphStyleProperties | undefined {
    const mergedProps: Partial<ParagraphStyleProperties> = {};
    let hasProperties = false;

    // Apply properties from base to derived (later properties override earlier ones)
    for (const style of inheritanceChain) {
      if (style.paragraph_properties) {
        hasProperties = true;
        
        // Merge each property, with later styles taking precedence
        if (style.paragraph_properties.style_id !== undefined) {
          mergedProps.style_id = style.paragraph_properties.style_id;
        }
        
        if (style.paragraph_properties.spacing) {
          mergedProps.spacing = this.mergeSpacingProperties(
            mergedProps.spacing || undefined,
            style.paragraph_properties.spacing
          );
        }
        
        if (style.paragraph_properties.indent) {
          mergedProps.indent = this.mergeIndentationProperties(
            mergedProps.indent || undefined,
            style.paragraph_properties.indent
          );
        }
        
        // Simple property overrides
        const simpleProps = [
          'outline_level', 'widow_control', 'suppress_auto_hyphens', 'bidi',
          'justification', 'keep_next', 'suppress_line_numbers', 'tabs'
        ] as const;
        
        for (const prop of simpleProps) {
          if (style.paragraph_properties[prop] !== undefined) {
            (mergedProps as Record<string, unknown>)[prop] = style.paragraph_properties[prop];
          }
        }
      }
    }

    return hasProperties ? ParagraphStylePropertiesModel.create(mergedProps) : undefined;
  }

  /**
   * Merge run properties from inheritance chain
   * @param inheritanceChain - Array of styles from base to derived
   * @returns Merged run properties or undefined
   */
  private mergeRunProperties(inheritanceChain: Style[]): RunStyleProperties | undefined {
    const mergedProps: Partial<RunStyleProperties> = {};
    let hasProperties = false;

    // Apply properties from base to derived (later properties override earlier ones)
    for (const style of inheritanceChain) {
      if (style.run_properties) {
        hasProperties = true;
        
        // Merge font properties
        if (style.run_properties.font) {
          mergedProps.font = this.mergeFontProperties(
            mergedProps.font || undefined,
            style.run_properties.font
          );
        }
        
        // Simple property overrides
        const simpleProps = [
          'size_pt', 'color', 'bold', 'italic', 'underline', 'strikethrough',
          'hidden', 'lang', 'highlight', 'shading', 'text_position_pt',
          'kerning', 'character_spacing_pt', 'emboss', 'outline', 'shadow',
          'all_caps', 'small_caps'
        ] as const;
        
        for (const prop of simpleProps) {
          if (style.run_properties[prop] !== undefined) {
            (mergedProps as Record<string, unknown>)[prop] = style.run_properties[prop];
          }
        }
      }
    }

    return hasProperties ? RunStylePropertiesModel.create(mergedProps) : undefined;
  }

  /**
   * Merge spacing properties
   * @param base - Base spacing properties
   * @param override - Override spacing properties
   * @returns Merged spacing properties
   */
  private mergeSpacingProperties(
    base?: SpacingProperties,
    override?: SpacingProperties
  ): SpacingProperties {
    return SpacingPropertiesModel.create({
      before_pt: override?.before_pt ?? base?.before_pt,
      after_pt: override?.after_pt ?? base?.after_pt,
      line_pt: override?.line_pt ?? base?.line_pt,
    });
  }

  /**
   * Merge indentation properties
   * @param base - Base indentation properties
   * @param override - Override indentation properties
   * @returns Merged indentation properties
   */
  private mergeIndentationProperties(
    base?: IndentationProperties,
    override?: IndentationProperties
  ): IndentationProperties {
    return IndentationPropertiesModel.create({
      left_pt: override?.left_pt ?? base?.left_pt,
      right_pt: override?.right_pt ?? base?.right_pt,
      firstline_pt: override?.firstline_pt ?? base?.firstline_pt,
    });
  }

  /**
   * Merge font properties
   * @param base - Base font properties
   * @param override - Override font properties
   * @returns Merged font properties
   */
  private mergeFontProperties(
    base?: FontProperties,
    override?: FontProperties
  ): FontProperties {
    return FontPropertiesModel.create({
      ascii: override?.ascii ?? base?.ascii,
      hAnsi: override?.hAnsi ?? base?.hAnsi,
      eastAsia: override?.eastAsia ?? base?.eastAsia,
      cs: override?.cs ?? base?.cs,
    });
  }

  /**
   * Apply document defaults to a style
   * @param style - Style to apply defaults to
   * @returns Style with defaults applied
   */
  public applyDocumentDefaults(style: MergedStyle): MergedStyle {
    const paragraphProperties = this.applyDocumentDefaultsToParagraph(style.paragraphProperties);
    const runProperties = this.applyDocumentDefaultsToRun(style.runProperties);

    return {
      ...style,
      ...(paragraphProperties && { paragraphProperties }),
      ...(runProperties && { runProperties }),
    };
  }

  /**
   * Apply document defaults to paragraph properties
   * @param paragraphProperties - Paragraph properties to apply defaults to
   * @returns Paragraph properties with defaults applied
   */
  private applyDocumentDefaultsToParagraph(
    paragraphProperties?: ParagraphStyleProperties
  ): ParagraphStyleProperties | undefined {
    if (!this.stylesSchema.doc_defaults_ppr && !paragraphProperties) {
      return undefined;
    }

    const defaults = this.stylesSchema.doc_defaults_ppr;
    if (!defaults) {
      return paragraphProperties;
    }

    // Merge with document defaults as base
    const mergedProps: Partial<ParagraphStyleProperties> = { ...defaults };
    
    if (paragraphProperties) {
      // Override with style properties
      Object.assign(mergedProps, paragraphProperties);
      
      // Special handling for nested properties
      if (paragraphProperties.spacing || defaults.spacing) {
        mergedProps.spacing = this.mergeSpacingProperties(defaults.spacing || undefined, paragraphProperties.spacing || undefined);
      }
      
      if (paragraphProperties.indent || defaults.indent) {
        mergedProps.indent = this.mergeIndentationProperties(defaults.indent || undefined, paragraphProperties.indent || undefined);
      }
    }

    return ParagraphStylePropertiesModel.create(mergedProps);
  }

  /**
   * Apply document defaults to run properties
   * @param runProperties - Run properties to apply defaults to
   * @returns Run properties with defaults applied
   */
  private applyDocumentDefaultsToRun(
    runProperties?: RunStyleProperties
  ): RunStyleProperties | undefined {
    if (!this.stylesSchema.doc_defaults_rpr && !runProperties) {
      return undefined;
    }

    const defaults = this.stylesSchema.doc_defaults_rpr;
    if (!defaults) {
      return runProperties;
    }

    // Merge with document defaults as base
    const mergedProps: Partial<RunStyleProperties> = { ...defaults };
    
    if (runProperties) {
      // Override with style properties
      Object.assign(mergedProps, runProperties);
      
      // Special handling for font properties
      if (runProperties.font || defaults.font) {
        mergedProps.font = this.mergeFontProperties(defaults.font || undefined, runProperties.font || undefined);
      }
    }

    return RunStylePropertiesModel.create(mergedProps);
  }

  /**
   * Clear the merged styles cache
   */
  public clearCache(): void {
    this.mergedStylesCache.clear();
  }

  /**
   * Get all available style IDs
   * @returns Array of style IDs
   */
  public getAvailableStyleIds(): string[] {
    return this.stylesSchema.styles.map(style => style.style_id);
  }

  /**
   * Check if a style exists
   * @param styleId - Style ID to check
   * @returns True if style exists
   */
  public hasStyle(styleId: string): boolean {
    return this.stylesSchema.styles.some(style => style.style_id === styleId);
  }
} 