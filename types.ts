import { Type as GeminiType } from "@google/genai";

export interface ChatMessage {
  role: 'user' | 'model' | 'error';
  content: string; // Added to fix errors in Chatbot.tsx
}

export type WidgetType = 
  'Title' | 
  'Subtitle' |
  'Text' | 
  'Styled Paragraph' |
  'List' |
  'Index' |
  'Image' | 
  'Table' | 
  'QR Code' |
  'Rectangle' |
  'Circle' |
  'Triangle' |
  'Arrow' |
  'Checkbox';

export type Theme = 'theme-light' | 'theme-dark' | 'theme-night' | 'theme-forest' | 'theme-ocean';

export type WidgetBinding = {
    property: string; // e.g., 'props.content', 'style.color'
    dataPath: string; // e.g., 'user.name'
}

export type WidgetStyle = {
    // Typography
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '500' | '600' | '700'; // Added numeric font weights
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right';
    fontFamily?: string;

    // Box Model & Appearance
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
    borderRadius?: number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double'; // New border style property
    opacity?: number;

    // Margins - new properties
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;

    // Image specific
    objectFit?: 'cover' | 'contain' | 'fill';
}

export interface MergedCellInfo {
    row: number;
    col: number;
    rowspan: number;
    colspan: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    // Common
    content?: string | any[]; // Can be string for text, array for List
    link?: string;
    // Image
    src?: string;
    srcType?: 'url' | 'base64';
    // QR Code
    data?: string;
    // Checkbox
    label?: string;
    checked?: boolean;
    // Table
    tableMode?: 'static' | 'dynamic';
    tableData?: string[][] | object[];
    rowHeights?: (number | 'auto')[];
    colWidths?: number[];
    columnOrder?: string[];
    columnHeaders?: { [key: string]: string };
    repeatHeader?: boolean;
    headerStyle?: WidgetStyle;
    evenRowStyle?: WidgetStyle;
    oddRowStyle?: WidgetStyle;
    mergedCells?: MergedCellInfo[];
    // For any other dynamic props
    [key: string]: any;
  };
  style: WidgetStyle;
  bindings: { [property: string]: string }; // Map of property path to data path
}

export type PageOrientation = 'Portrait' | 'Landscape';

export interface WatermarkProperties {
    enabled: boolean;
    type: 'Text' | 'Image';
    text: string;
    src?: string;
    color: string;
    opacity: number;
    fontSize: number;
    angle: number;
}

export interface HeaderProperties {
    enabled: boolean;
    text: string;
}

export interface PaginationProperties {
    enabled: boolean;
}

export interface PageProperties {
    orientation: PageOrientation;
    backgroundColor: string;
    watermark: WatermarkProperties;
    header: HeaderProperties;
    pagination: PaginationProperties;
}


export interface PageData {
    id: string;
    widgets: WidgetInstance[];
    properties: PageProperties;
}

export interface Template {
  id: string;
  name: string;
  pages: PageData[];
  jsonData: string;
  status: 'active' | 'archived';
}

export interface User {
  name: string;
  email: string;
}

export type EditorLayout = 'paginated' | 'scroll';


// ------ AI GENERATION SCHEMAS ------

export const WIDGET_PROPS_SCHEMA = {
  type: GeminiType.OBJECT,
  properties: {
    content: { type: GeminiType.STRING, description: 'Text content for typography widgets.' },
    src: { type: GeminiType.STRING, description: 'URL or Base64 data for image widgets.' },
    srcType: { type: GeminiType.STRING, enum: ['url', 'base64'], description: "The source type for the image." },
    tableData: { type: GeminiType.ARRAY, description: 'Data for table widgets, as an array of arrays.', items: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } } },
    label: { type: GeminiType.STRING, description: 'Label for a checkbox.' },
    checked: { type: GeminiType.BOOLEAN, description: 'Checked state for a checkbox.' },
  },
};

export const WIDGET_STYLE_SCHEMA = {
  type: GeminiType.OBJECT,
  properties: {
    fontSize: { type: GeminiType.NUMBER },
    fontWeight: { type: GeminiType.STRING, enum: ['bold', 'normal'] },
    textAlign: { type: GeminiType.STRING, enum: ['left', 'center', 'right'] },
    color: { type: GeminiType.STRING, description: 'Hex color code, e.g., #RRGGBB' },
    backgroundColor: { type: GeminiType.STRING, description: 'Hex color code' },
    // New properties
    margin: { type: GeminiType.NUMBER },
    marginTop: { type: GeminiType.NUMBER },
    marginBottom: { type: GeminiType.NUMBER },
    marginLeft: { type: GeminiType.NUMBER },
    marginRight: { type: GeminiType.NUMBER },
    borderColor: { type: GeminiType.STRING, description: 'Hex color code' },
    borderWidth: { type: GeminiType.NUMBER },
    borderRadius: { type: GeminiType.NUMBER },
    borderStyle: { type: GeminiType.STRING, enum: ['none', 'solid', 'dashed', 'dotted', 'double'] },
    opacity: { type: GeminiType.NUMBER },
  },
};

export const WIDGET_SCHEMA = {
  type: GeminiType.OBJECT,
  properties: {
    type: {
      type: GeminiType.STRING,
      enum: ['Title', 'Subtitle', 'Text', 'Image', 'Table', 'Rectangle', 'Circle', 'Triangle', 'Arrow', 'List', 'Checkbox', 'Index', 'Styled Paragraph'],
      description: 'The type of UI widget to represent the content.',
    },
    props: WIDGET_PROPS_SCHEMA,
    style: WIDGET_STYLE_SCHEMA,
    // For template generation
    x: { type: GeminiType.NUMBER, description: 'The horizontal position (left) of the widget in pixels.' },
    y: { type: GeminiType.NUMBER, description: 'The vertical position (top) of the widget in pixels.' },
    width: { type: GeminiType.NUMBER, description: 'The width of the widget in pixels.' },
    height: { type: GeminiType.NUMBER, description: 'The height of the widget in pixels.' },
    bindings: { 
        type: GeminiType.OBJECT, 
        description: 'A map of widget properties to JSON data paths, e.g., {"props.content": "user.name"}.',
        properties: {
            "props.content": { type: GeminiType.STRING, description: 'Path to data for content, e.g. invoice.customer.name' }
        }
    }
  },
  required: ['type'],
};

export const WIDGET_ARRAY_SCHEMA = {
  type: GeminiType.ARRAY,
  items: WIDGET_SCHEMA,
};

// The final type for the AI response
export type AiWidgetGenerationResponse = Partial<WidgetInstance>[];

export interface ColorPalette {
    name: string;
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
}

export interface DocGenConfig {
  verbosity: 'Concise' | 'Normal' | 'Detailed';
  maxWordsPerFile: number;
  includeIndex: boolean;
  language: string;
  allowedWidgets: WidgetType[];
  colorPalette: ColorPalette;
}

export interface ProjectDocumentation {
  config: DocGenConfig;
  widgets: AiWidgetGenerationResponse;
}