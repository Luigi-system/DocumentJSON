

import { GoogleGenAI, Type as GeminiType } from "@google/genai";
import { WIDGET_ARRAY_SCHEMA, AiWidgetGenerationResponse, DocGenConfig, WidgetType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getChatResponse(prompt: string, isThinkingMode: boolean): Promise<string> {
  try {
    const model = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const config = isThinkingMode ? {
      thinkingConfig: { thinkingBudget: 32768 }
    } : {};
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    throw new Error("Failed to get response from AI model.");
  }
}

export async function generateJson(prompt: string, useProModel: boolean = false): Promise<string> {
    try {
        const model = useProModel ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful assistant that generates JSON data based on user descriptions. Only output valid JSON. Do not include any introductory text or markdown formatting like ```json.",
                responseMimeType: "application/json",
            },
        });

        const jsonObject = JSON.parse(response.text);
        return JSON.stringify(jsonObject, null, 2);

    } catch (error) {
        console.error("Error generating JSON from Gemini:", error);
        throw new Error("Failed to generate JSON from AI model.");
    }
}

export async function extractWidgetsFromText(text: string): Promise<AiWidgetGenerationResponse> {
    try {
        const prompt = `Analyze the following text content and convert it into a structured array of UI widgets. Identify titles, subtitles, paragraphs, and lists.

        Text to analyze:
        ---
        ${text}
        ---
        
        Return a JSON array of widget objects.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: WIDGET_ARRAY_SCHEMA,
            }
        });

        const result = JSON.parse(response.text);
        return result as AiWidgetGenerationResponse;

    } catch(error) {
        console.error("Error extracting widgets from text:", error);
        throw new Error("Failed to extract widgets using AI.");
    }
}


export async function generateTemplate(prompt: string): Promise<AiWidgetGenerationResponse> {
     try {
        const fullPrompt = `Design a document template based on the following description: "${prompt}".

        Your task is to generate a complete layout as a JSON array of widget objects. Each object must include 'type', 'x', 'y', 'width', 'height', and any relevant 'props', 'style', or 'bindings' to placeholder data.
        
        - Use standard coordinates for an 8.5x11 inch page (approx 816x1056 pixels).
        - Create a clean, professional, and well-aligned layout.
        - Use placeholders in bindings where dynamic data is expected (e.g., "invoice.number", "customer.name").

        For example, a request for "an invoice" should result in widgets for a title, company logo, customer details, a table for items, and totals, all positioned correctly on the page with appropriate placeholder bindings.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Use pro model for better layout generation
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: WIDGET_ARRAY_SCHEMA,
            }
        });

        const result = JSON.parse(response.text);
        return result as AiWidgetGenerationResponse;

    } catch(error) {
        console.error("Error generating template:", error);
        throw new Error("Failed to generate template using AI.");
    }
}

const DOC_ANALYSIS_SCHEMA = {
  type: GeminiType.OBJECT,
  properties: {
    explanation: {
      type: GeminiType.STRING,
      description: "The detailed explanation for the file.",
    },
    diagramBase64: {
      type: GeminiType.STRING,
      description: "A base64 encoded PNG image string for a diagram, or null if not needed.",
      nullable: true,
    }
  },
  required: ['explanation']
};

const DOC_FILE_ANALYSIS_SCHEMA = {
    type: GeminiType.OBJECT,
    properties: {
        filePath: {
            type: GeminiType.STRING,
            description: "The full path of the file being analyzed."
        },
        analysis: DOC_ANALYSIS_SCHEMA,
    },
    required: ['filePath', 'analysis']
};

const DOC_EXPLANATION_ARRAY_SCHEMA = {
    type: GeminiType.ARRAY,
    items: DOC_FILE_ANALYSIS_SCHEMA
};


export async function generateProjectDocumentation(
    files: { path: string; content: string }[],
    config: DocGenConfig
): Promise<AiWidgetGenerationResponse> {
    try {
        const fileManifest = files.map(f => `- ${f.path}`).join('\n');
        const fileContents = files.map(f => `--- FILE: ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');

        const verbosityMap = {
            'Concise': 'brief and to the point',
            'Normal': 'with a standard level of detail',
            'Detailed': 'in-depth and comprehensive'
        };

        const prompt = `
        You are an expert software developer and technical writer. Your task is to generate explanations for a given project's files in ${config.language}.

        Here is the project file manifest:
        ${fileManifest}

        Here are the contents of the files:
        ${fileContents}

        Please analyze the files and provide an explanation for each one. Structure your response as a JSON array where each object in the array represents a single file and contains its path and analysis.

        1.  **Response Format**: The output MUST be a valid JSON array of objects, matching the provided schema. Each object must contain 'filePath' and 'analysis' keys.
        2.  **Explanations**: For each file, provide an explanation of its purpose, key functions, and overall logic. The explanation should be ${verbosityMap[config.verbosity]}. Crucially, each explanation must be **no more than ${config.maxWordsPerFile} words**.
        3.  **Visuals (VERY IMPORTANT)**: If a file's code contains complex logic, data flow, or component architecture, you MUST generate a simple, clear diagram (like a flowchart or component diagram) to visually explain it.
            - Provide this diagram as a Base64-encoded PNG string in the 'diagramBase64' field for that file's analysis.
            - If no diagram is necessary for a file, set 'diagramBase64' to null.

        Your final output must be only the JSON array. Do not include any other text or markdown formatting.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: DOC_EXPLANATION_ARRAY_SCHEMA,
            }
        });

        type FileAnalysis = {
            filePath: string;
            analysis: {
                explanation: string;
                diagramBase64?: string | null;
            }
        };

        const aiResponseArray = JSON.parse(response.text) as FileAnalysis[];
        const aiResponseMap = new Map<string, FileAnalysis['analysis']>();
        aiResponseArray.forEach(item => {
            aiResponseMap.set(item.filePath, item.analysis);
        });
        
        const generatedWidgets: AiWidgetGenerationResponse = [];

        const titleStyle = { color: config.colorPalette.primary, fontWeight: 'bold' as const };
        const subtitleStyle = { color: config.colorPalette.secondary, fontWeight: 'bold' as const };
        const textStyle = { color: config.colorPalette.text };

        generatedWidgets.push({ type: 'Title', props: { content: 'Project Documentation' }, style: titleStyle });

        if (config.includeIndex) {
            const indexContent = files.map(f => `- ${f.path}`).join('\n');
            generatedWidgets.push({ type: 'Index', props: { content: indexContent }, style: textStyle });
        }

        for (const file of files) {
            generatedWidgets.push({ type: 'Subtitle', props: { content: file.path }, style: subtitleStyle });

            generatedWidgets.push({
                type: 'Text',
                props: { content: `\`\`\`\n${file.content}\n\`\`\`` },
                style: { ...textStyle, fontFamily: 'monospace' }
            });

            const fileAnalysis = aiResponseMap.get(file.path);
            if (fileAnalysis) {
                if (fileAnalysis.diagramBase64) {
                    generatedWidgets.push({
                        type: 'Image',
                        props: {
                            src: `data:image/png;base64,${fileAnalysis.diagramBase64}`,
                            srcType: 'base64'
                        },
                        style: {}
                    });
                }
                generatedWidgets.push({
                    type: 'Text',
                    props: { content: fileAnalysis.explanation },
                    style: textStyle
                });
            }
        }

        return generatedWidgets;

    } catch (error) {
        console.error("Error generating project documentation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate documentation using AI. Details: ${errorMessage}`);
    }
}

export async function generatePageContentFromFiles(
    files: { path: string; content: string }[],
    config: { allowedWidgets: WidgetType[] }
): Promise<AiWidgetGenerationResponse> {
    try {
        const fileContents = files.map(f => `--- FILE: ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');

        const prompt = `
        You are a fast and efficient technical writing assistant. Your task is to analyze the provided file(s) and generate a concise summary and key points to be placed on a single document page.

        Here are the file contents:
        ${fileContents}

        Instructions:
        1.  **Analyze**: Briefly analyze the code to understand its purpose.
        2.  **Summarize**: Create a short summary of the file(s).
        3.  **Output Widgets**: Structure your entire output as a JSON array of UI widget objects.
        4.  **Widget Constraint**: You may ONLY use the following widget types: ${config.allowedWidgets.join(', ')}.
        5.  **Be Quick**: Keep explanations very brief and to the point. The goal is speed.

        Your final output must be only the JSON array. Do not include any other text or markdown formatting.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: WIDGET_ARRAY_SCHEMA,
            }
        });

        return JSON.parse(response.text) as AiWidgetGenerationResponse;

    } catch (error) {
        console.error("Error generating page content:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate page content using AI. Details: ${errorMessage}`);
    }
}


export async function regenerateFileExplanation(
    filePath: string,
    fileContent: string,
    config: DocGenConfig
): Promise<string> {
    try {
        const verbosityMap = {
            'Concise': 'brief and to the point',
            'Normal': 'with a standard level of detail',
            'Detailed': 'in-depth and comprehensive'
        };

        const prompt = `
        You are an expert technical writer. Your task is to regenerate an explanation for a single code file.
        The file is named: ${filePath}
        The language for the output should be ${config.language}.
        The explanation should be ${verbosityMap[config.verbosity]} and must be **no more than ${config.maxWordsPerFile} words**.

        Here is the code:
        ---
        ${fileContent}
        ---

        Please provide only the new explanation text. Do not include any titles, headers, or markdown formatting like "### Explanation". Just the plain text of the explanation.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        
        return response.text;

    } catch (error) {
        console.error(`Error regenerating explanation for ${filePath}:`, error);
        throw new Error("Failed to regenerate explanation from AI.");
    }
}

interface Context {
    type: 'image' | 'file' | 'projectFile';
    data: any;
}

export async function generateTextFromContext(prompt: string, context: Context): Promise<string> {
    try {
        let model = 'gemini-2.5-flash';
        let contents: any;

        switch (context.type) {
            case 'image':
                const imagePart = {
                    inlineData: {
                        mimeType: context.data.mimeType,
                        data: context.data.base64,
                    },
                };
                const textPart = { text: prompt };
                contents = { parts: [imagePart, textPart] };
                break;
            
            case 'file':
                contents = `CONTEXT:\n\n${context.data.content}\n\n---\n\nINSTRUCTION: ${prompt}`;
                break;

            case 'projectFile':
                model = 'gemini-2.5-pro'; // Use a more powerful model for code context
                contents = `You are an expert software developer and technical writer. You have been provided with the file manifest for an entire project to give you full context. You have also been given the content of a specific file from that project. Please follow the user's instruction, focusing on the specific file provided but using your knowledge of the whole project for context (e.g., to understand imports and relationships).

                Project Manifest:
                ---
                ${context.data.manifest}
                ---

                Selected File: ${context.data.selectedPath}
                Selected File Content:
                ---
                ${context.data.selectedFileContent}
                ---

                INSTRUCTION: ${prompt}
                `;
                break;
        }

        const response = await ai.models.generateContent({
            model,
            contents,
        });

        return response.text;

    } catch (error) {
        console.error("Error generating text from context:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate text from context. Details: ${errorMessage}`);
    }
}