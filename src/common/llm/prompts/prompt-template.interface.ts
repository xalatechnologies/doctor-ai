/**
 * Variable definition for a prompt template.
 */
export interface IPromptVariable {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly required: boolean;
}

/**
 * Output format definition for a prompt template.
 */
export interface IOutputFormat {
  readonly type: string;
  readonly schema: {
    readonly type: string;
    readonly properties: Readonly<Record<string, unknown>>;
    readonly required: readonly string[];
  };
}

/**
 * Example for a prompt template.
 */
export interface IPromptExample {
  readonly variables: Readonly<Record<string, unknown>>;
  readonly output: string;
}

/**
 * Template for generating prompts.
 */
export interface IPromptTemplate {
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly template: string;
  readonly variables: readonly IPromptVariable[];
  readonly outputFormat: IOutputFormat;
  readonly examples: readonly IPromptExample[];
}

/**
 * Provider for managing prompt templates.
 */
export interface IPromptTemplateProvider {
  getTemplate(name: string): IPromptTemplate | undefined;
  renderTemplate(template: IPromptTemplate, variables: Readonly<Record<string, unknown>>): string;
  validateOutput(template: IPromptTemplate, output: string): boolean;
}

// Type aliases for backward compatibility
export type PromptVariable = IPromptVariable;
export type OutputFormat = IOutputFormat;
export type PromptExample = IPromptExample;
export type PromptTemplate = IPromptTemplate;
export type PromptTemplateProvider = IPromptTemplateProvider; 