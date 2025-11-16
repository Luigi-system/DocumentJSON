import React, { useState, useCallback, useEffect } from 'react';
// Components
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Chatbot from './components/Chatbot';
import Widgets from './components/Widgets';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GenerateJsonModal from './components/GenerateJsonModal';
import JsonEditorModal from './components/JsonEditorModal';
import ContextMenu from './components/ContextMenu';
import AiToolsModal from './components/AiToolsModal';
import ProjectDocModal from './components/ProjectDocModal';
import ResizableHandle from './components/ResizableHandle';
import DocumentationDetailModal from './components/DocumentationDetailModal';
import AiTextGeneratorModal from './components/AiTextGeneratorModal';
import PageAiGeneratorModal from './components/PageAiGeneratorModal';
import FloatingControls from './FloatingControls'; // Import FloatingControls
// Constants & Types
import { DEFAULT_PAGE_PROPERTIES } from './constants';
import { Theme, PageData, WidgetInstance, PageProperties, WidgetBinding, Template, User, ProjectDocumentation, DocGenConfig, AiWidgetGenerationResponse, EditorLayout, WidgetType } from './types';
import { templates as PREDEFINED_TEMPLATES } from './templates';
// Utils
import { v4 as uuidv4 } from 'uuid';
import { getBindableProperties } from './components/WidgetComponent';
import { supabase } from './services/supabaseClient';


const App: React.FC = () => {
    // App state
    const [view, setView] = useState<'login' | 'dashboard' | 'editor'>('login');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
    const [webhookUrl, setWebhookUrl] = useState('https://api.your-service.com/v1/documents/render');

    // Editor state (only relevant when view is 'editor')
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [theme, setTheme] = useState<Theme>('theme-light');
    const [leftPanelWidth, setLeftPanelWidth] = useState(320);
    const [rightPanelWidth, setRightPanelWidth] = useState(288);
    const [projectDocumentation, setProjectDocumentation] = useState<ProjectDocumentation | null>(null);
    const [editorView, setEditorView] = useState<'canvas' | 'manager'>('canvas');
    const [editorZoom, setEditorZoom] = useState(1);
    const [editorLayout, setEditorLayout] = useState<EditorLayout>('paginated');
    const [copiedWidget, setCopiedWidget] = useState<WidgetInstance | null>(null);
    const [alignmentGuides, setAlignmentGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });


    // Floating Controls position state
    const [floatingControlsPosition, setFloatingControlsPosition] = useState(() => {
        try {
            const savedPos = localStorage.getItem('docugen-floatingControlsPos');
            return savedPos ? JSON.parse(savedPos) : { x: window.innerWidth - 280, y: 100 }; // Default to right side
        } catch {
            return { x: window.innerWidth - 280, y: 100 };
        }
    });


    // UI state
    const [rightPanelMode, setRightPanelMode] = useState<'widgets' | 'widgetProperties' | 'pageProperties'>('widgets');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'widget' | 'page', pageIndex?: number, widget?: WidgetInstance } | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isProjectDocModalOpen, setIsProjectDocModalOpen] = useState(false);
    const [isDocDetailModalOpen, setIsDocDetailModalOpen] = useState(false);
    const [isAiTextModalOpen, setIsAiTextModalOpen] = useState(false);
    const [targetWidgetIdForAiText, setTargetWidgetIdForAiText] = useState<string | null>(null);
    const [docDetailContent, setDocDetailContent] = useState<{ title: string; code: string; explanation: string; config: DocGenConfig; } | null>(null);
    const [isPageAiModalOpen, setIsPageAiModalOpen] = useState(false);
    const [targetPageIndexForAi, setTargetPageIndexForAi] = useState<number | null>(null);


    // --- Data Persistence ---
    useEffect(() => {
        const loadData = async () => {
            // Fetch templates from Supabase
            const { data: dbTemplates, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching templates from Supabase:", error.message, error);
                alert("Could not load templates from the database. Falling back to default templates.");
                setTemplates(PREDEFINED_TEMPLATES);
            } else if (dbTemplates && dbTemplates.length > 0) {
                // Format templates from DB (stringify JSONB)
                const formattedTemplates = dbTemplates.map(t => ({
                    ...t,
                    jsonData: t.jsonData ? JSON.stringify(t.jsonData, null, 2) : '{}'
                })) as Template[];
                setTemplates(formattedTemplates);
            } else {
                // First run, populate Supabase with predefined templates
                console.log("No templates found, seeding database with predefined templates.");
                const templatesToSeed = PREDEFINED_TEMPLATES.map(t => ({
                    ...t,
                    jsonData: JSON.parse(t.jsonData) // Convert string to object for DB
                }));

                const { error: insertError } = await supabase.from('templates').insert(templatesToSeed);

                if (insertError) {
                    console.error("Error seeding templates:", insertError.message, insertError);
                    setTemplates(PREDEFINED_TEMPLATES); // Fallback to local if seeding fails
                } else {
                    setTemplates(PREDEFINED_TEMPLATES); // Set local state with original stringified JSON
                }
            }
        };

        loadData();

        // Keep user, webhook, etc. in localStorage
        try {
            const savedUser = localStorage.getItem('docugen-user');
            const savedWebhookUrl = localStorage.getItem('docugen-webhookUrl');
            
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            } else {
                setUser({ name: 'Usuario Demo', email: 'demo@gemini-docs.com' });
            }

            if (savedWebhookUrl) {
                setWebhookUrl(JSON.parse(savedWebhookUrl));
            }
        } catch (error) {
            console.error("Failed to load non-template data from localStorage", error);
        }
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem('docugen-user', JSON.stringify(user));
        }
    }, [user]);

     useEffect(() => {
        localStorage.setItem('docugen-webhookUrl', JSON.stringify(webhookUrl));
    }, [webhookUrl]);

    // Save floating controls position
    useEffect(() => {
        localStorage.setItem('docugen-floatingControlsPos', JSON.stringify(floatingControlsPosition));
    }, [floatingControlsPosition]);


    // Derived state
    const selectedWidget = activeTemplate?.pages.flatMap(p => p.widgets).find(w => w.id === selectedWidgetId) || null;
    const selectedWidgetBindings = selectedWidget ? Object.values(selectedWidget.bindings) : [];

    // --- Utility for dynamic widget height ---
    const calculateInitialTextWidgetHeight = useCallback((
        type: WidgetType,
        content: string | any[] | undefined,
        width: number,
        fontSize: number = 16
    ): number => {
        let estimatedLineHeight = fontSize * 1.5; // Base line height
        let minHeight = 50; // Default min height for most widgets

        if (typeof content !== 'string' && type !== 'List') {
            if (type === 'Image') return Math.max(minHeight, 150);
            if (type === 'QR Code') return Math.max(minHeight, 100);
            return minHeight;
        }

        let actualContent = '';
        if (type === 'List' && Array.isArray(content)) {
            let listLineCount = 0;
            const countListItems = (items: [string, any[]][]) => {
                items.forEach(([_text, subItems]) => {
                    listLineCount++;
                    if (subItems && subItems.length > 0) {
                        countListItems(subItems);
                    }
                });
            };
            countListItems(content);
            return Math.max(minHeight, listLineCount * estimatedLineHeight + 20);
        } else if (typeof content === 'string') {
            actualContent = content;
        } else {
            return minHeight;
        }

        const lines = actualContent.split('\n').length;
        const averageCharWidth = fontSize * 0.6; 
        const estimatedCharsPerLine = Math.floor(width / averageCharWidth);
        
        let wrappingLines = 0;
        if (estimatedCharsPerLine > 0) {
            wrappingLines = Math.ceil(actualContent.length / estimatedCharsPerLine);
        }
        
        const totalLines = Math.max(lines, wrappingLines);

        switch (type) {
            case 'Title':
                estimatedLineHeight = 40;
                minHeight = 60;
                break;
            case 'Subtitle':
                estimatedLineHeight = 30;
                minHeight = 40;
                break;
            case 'Text':
            case 'Styled Paragraph':
                estimatedLineHeight = 24;
                minHeight = 50;
                break;
            case 'Index':
                minHeight = 50;
                return minHeight; // Index widget content is usually just a placeholder
            default:
                break;
        }

        return Math.max(minHeight, totalLines * estimatedLineHeight + 20);
    }, []);


    // --- App Flow Handlers ---

    const handleLogin = () => setView('dashboard');
    const handleLogout = () => setView('login');

    const handleSelectTemplate = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (template) {
            setActiveTemplate(JSON.parse(JSON.stringify(template))); // Deep copy to avoid mutation
            setActivePageIndex(0);
            setSelectedWidgetId(null);
            setProjectDocumentation(null); // Clear any previous doc results
            setView('editor');
        }
    };

    const handleCreateNewTemplate = async () => {
        const newTemplate: Template = {
            id: uuidv4(),
            name: 'Nueva Plantilla sin Título',
            pages: [{ id: uuidv4(), widgets: [], properties: DEFAULT_PAGE_PROPERTIES }],
            jsonData: '{}',
            status: 'active',
        };
        
        // Optimistic UI update
        setTemplates(t => [newTemplate, ...t]);
        handleSelectTemplate(newTemplate.id);

        // Save to Supabase
        const { error } = await supabase
            .from('templates')
            .insert([{ ...newTemplate, jsonData: JSON.parse(newTemplate.jsonData) }]);
        
        if (error) {
            console.error("Error creating template:", error.message, error);
            alert("Failed to save new template to database.");
            // Revert optimistic update
            setTemplates(t => t.filter(temp => temp.id !== newTemplate.id));
            handleReturnToDashboard();
        }
    };

    const handleReturnToDashboard = () => {
        setActiveTemplate(null);
        setProjectDocumentation(null);
        setView('dashboard');
    };

    const handleUpdateTemplate = async () => {
        if (!activeTemplate) return;

        // Optimistic UI update in local state
        setTemplates(currentTemplates =>
            currentTemplates.map(t => t.id === activeTemplate.id ? activeTemplate : t)
        );

        const { error } = await supabase
            .from('templates')
            .update({
                name: activeTemplate.name,
                pages: activeTemplate.pages,
                status: activeTemplate.status,
                jsonData: JSON.parse(activeTemplate.jsonData)
             })
            .eq('id', activeTemplate.id);

        if (error) {
            console.error("Error updating template:", error.message, error);
            alert('¡Error al actualizar la plantilla en la base de datos!');
            // Consider reverting state here if needed
        } else {
            alert('¡Plantilla actualizada!');
        }
    };
    
    // --- Template Management Handlers ---
    const handleRenameTemplate = async (id: string, newName: string) => {
        const originalName = templates.find(t => t.id === id)?.name;
        setTemplates(ts => ts.map(t => t.id === id ? { ...t, name: newName } : t)); // Optimistic

        const { error } = await supabase
            .from('templates')
            .update({ name: newName })
            .eq('id', id);

        if (error) {
            console.error("Error renaming template:", error.message, error);
            alert("Failed to rename template.");
            // Revert
            setTemplates(ts => ts.map(t => t.id === id ? { ...t, name: originalName || t.name } : t));
        }
    };

    const handleDuplicateTemplate = async (id: string) => {
        const original = templates.find(t => t.id === id);
        if (original) {
            const newTemplate: Template = { ...JSON.parse(JSON.stringify(original)), id: uuidv4(), name: `${original.name} (Copia)` };
            setTemplates(ts => [newTemplate, ...ts]); // Optimistic

            const { error } = await supabase
                .from('templates')
                .insert([{ ...newTemplate, jsonData: JSON.parse(newTemplate.jsonData) }]);

            if (error) {
                console.error("Error duplicating template:", error.message, error);
                alert("Failed to duplicate template.");
                setTemplates(ts => ts.filter(t => t.id !== newTemplate.id)); // Revert
            }
        }
    };

    const handleArchiveTemplate = async (id: string) => {
        setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'archived' } : t)); // Optimistic

        const { error } = await supabase
            .from('templates')
            .update({ status: 'archived' })
            .eq('id', id);
        
        if (error) {
            console.error("Error archiving template:", error.message, error);
            alert("Failed to archive template.");
            setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'active' } : t)); // Revert
        }
    };

    const handleRestoreTemplate = async (id: string) => {
        setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'active' } : t)); // Optimistic

        const { error } = await supabase
            .from('templates')
            .update({ status: 'active' })
            .eq('id', id);
        
        if (error) {
            console.error("Error restoring template:", error.message, error);
            alert("Failed to restore template.");
            setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'archived' } : t)); // Revert
        }
    };

    const handleDeleteTemplate = useCallback(async (id: string) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar esta plantilla permanentemente? Esta acción no se puede rehacer.')) {
            const originalTemplates = [...templates];
            setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== id)); // Optimistic

            const { error } = await supabase
                .from('templates')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Error deleting template:", error.message, error);
                alert("Failed to delete template from database.");
                setTemplates(originalTemplates); // Revert
            }
        }
    }, [templates]);


    // Fix: Moved deleteWidget useCallback definition to prevent "used before declaration" error.
    const deleteWidget = useCallback((widgetId: string | null) => {
        if (!widgetId) return;
        setActiveTemplate(template => ({
            ...template,
            pages: template.pages.map(page => ({
                ...page,
                widgets: page.widgets.filter(widget => widget.id !== widgetId)
            }))
        }));
        if (selectedWidgetId === widgetId) {
            handleDeselect();
        }
    }, [selectedWidgetId]); // Added selectedWidgetId as dependency for deleteWidget

    // Fix: Implemented missing addPage function.
    const addPage = useCallback(() => {
        setActiveTemplate(template => {
            if (!template) return template;
            const newPage: PageData = { id: uuidv4(), widgets: [], properties: DEFAULT_PAGE_PROPERTIES };
            return { ...template, pages: [...template.pages, newPage] };
        });
        setActivePageIndex(activeTemplate ? activeTemplate.pages.length : 0); // Set to new last page
    }, [activeTemplate]); // Dependency: activeTemplate to get its length for setActivePageIndex

    // Fix: Implemented missing deletePage function.
    const deletePage = useCallback((index: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta página?')) {
            return;
        }
        setActiveTemplate(template => {
            if (!template || template.pages.length <= 1) return template;
            const newPages = template.pages.filter((_, i) => i !== index);
            return { ...template, pages: newPages };
        });
        if (activePageIndex >= index && activePageIndex > 0) {
            setActivePageIndex(prevIndex => Math.max(0, prevIndex - 1));
        } else if (activePageIndex === 0 && activeTemplate && activeTemplate.pages.length > 1) {
            setActivePageIndex(0); // Stay on first page if only one left
        }
    }, [activePageIndex, activeTemplate]);


    const addWidget = (pageIndex: number, widget: Omit<WidgetInstance, 'id'>) => {
        // Assign more generous default widths/heights for text-based widgets if not provided by defaultProps
        let initialWidth = widget.width;
        let initialHeight = widget.height;

        if (!initialWidth) {
            switch (widget.type) {
                case 'Title': initialWidth = 400; break;
                case 'Subtitle': initialWidth = 350; break;
                case 'Text': initialWidth = 350; break;
                case 'Styled Paragraph': initialWidth = 400; break;
                case 'List': initialWidth = 350; break;
                default: initialWidth = widget.width || 200; break;
            }
        }
        if (!initialHeight) {
            switch (widget.type) {
                case 'Title': initialHeight = 60; break;
                case 'Subtitle': initialHeight = 50; break;
                case 'Text': initialHeight = 100; break;
                case 'Styled Paragraph': initialHeight = 120; break;
                case 'List': initialHeight = 100; break;
                case 'Image': initialHeight = 150; break;
                case 'QR Code': initialHeight = 100; break;
                default: initialHeight = 50; break;
            }
        }


        const calculatedHeight = calculateInitialTextWidgetHeight(
            widget.type, 
            widget.props?.content, 
            initialWidth, 
            widget.style?.fontSize
        );

        const newWidget: WidgetInstance = { 
            ...widget, 
            id: uuidv4(), 
            x: widget.x, 
            y: widget.y, 
            width: initialWidth, 
            height: calculatedHeight, 
            bindings: {}, 
            props: widget.props || {}, 
            style: widget.style || {},
        };
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            const newPages = [...template.pages];
            newPages[pageIndex].widgets.push(newWidget);
            return { ...template, pages: newPages };
        });
        handleSelectWidget(newWidget.id);
    };
    
    const updateWidget = (widgetId: string, newProps: Partial<WidgetInstance>) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            return {
                ...template,
                pages: template.pages.map(page => ({
                    ...page,
                    widgets: page.widgets.map(widget => 
                        widget.id === widgetId ? { ...widget, ...newProps, style: { ...widget.style, ...(newProps.style || {}) }, props: { ...widget.props, ...(newProps.props || {}) }, bindings: { ...widget.bindings, ...(newProps.bindings || {}) } } : widget
                    )
                }))
            };
        });
    };

    const handleCopyWidget = useCallback(() => {
        if (selectedWidget) {
            const widgetToCopy = JSON.parse(JSON.stringify(selectedWidget));
            setCopiedWidget(widgetToCopy);
            console.log("Widget copied:", widgetToCopy.id);
        }
    }, [selectedWidget]);

    const handlePasteWidget = useCallback(() => {
        if (copiedWidget) {
            setActiveTemplate(template => {
                if (!template) return template;
                const newPages = [...template.pages];
                const currentPage = newPages[activePageIndex];
                
                const newWidget: WidgetInstance = {
                    ...copiedWidget,
                    id: uuidv4(),
                    x: copiedWidget.x + 20,
                    y: copiedWidget.y + 20,
                };
                currentPage.widgets.push(newWidget);
                return { ...template, pages: newPages };
            });
            setSelectedWidgetId(null);
            console.log("Widget pasted.");
        }
    }, [copiedWidget, activePageIndex]);

    const handleDuplicateWidget = useCallback(() => {
        if (selectedWidget) {
            setActiveTemplate(template => {
                if (!template) return template;
                const newPages = [...template.pages];
                const currentPage = newPages[activePageIndex];
                
                const newWidget: WidgetInstance = {
                    ...selectedWidget,
                    id: uuidv4(),
                    x: selectedWidget.x + 20,
                    y: selectedWidget.y + 20,
                };
                currentPage.widgets.push(newWidget);
                return { ...template, pages: newPages };
            });
            setSelectedWidgetId(null);
            console.log("Widget duplicated.");
        }
    }, [selectedWidget, activePageIndex]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedWidgetId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    deleteWidget(selectedWidgetId);
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') { // Ctrl+C or Cmd+C
                if (selectedWidgetId) {
                    e.preventDefault();
                    handleCopyWidget();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') { // Ctrl+V or Cmd+V
                e.preventDefault();
                handlePasteWidget();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedWidgetId, deleteWidget, handleCopyWidget, handlePasteWidget]);

    const reorderWidgets = (pageIndex: number, startIndex: number, endIndex: number) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            const newPages = [...template.pages];
            const page = newPages[pageIndex];
            const [removed] = page.widgets.splice(startIndex, 1);
            page.widgets.splice(endIndex, 0, removed);
            return { ...template, pages: newPages };
        });
    };

    const updatePageProperties = (pageIndex: number, newProps: Partial<PageProperties>) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            const newPages = [...template.pages];
            const oldPage = newPages[pageIndex];
            newPages[pageIndex] = {
                ...oldPage,
                properties: {
                    ...oldPage.properties,
                    ...newProps,
                    watermark: { ...oldPage.properties.watermark, ...newProps.watermark },
                    header: { ...oldPage.properties.header, ...newProps.header },
                    pagination: { ...oldPage.properties.pagination, ...newProps.pagination },
                }
            };
            return { ...template, pages: newPages };
        });
    };
  
    const applyPropertiesToAllPages = (propertiesToApply: PageProperties) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            return {
                ...template,
                pages: template.pages.map(page => ({ ...page, properties: propertiesToApply }))
            };
        });
    };

    // --- UI Handlers ---

    const handlePageRightClick = (e: React.MouseEvent, pageIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'page', pageIndex });
    };
  
    const handleWidgetRightClick = (e: React.MouseEvent, widget: WidgetInstance) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'widget', widget });
    };

    const handleSelectWidget = (widgetId: string | null) => {
      setSelectedWidgetId(widgetId);
      setRightPanelMode(widgetId ? 'widgetProperties' : 'widgets');
    };
  
    const handleDeselect = useCallback(() => {
        setSelectedWidgetId(null);
        setRightPanelMode('widgets');
    }, []);

    const handleShowPageProperties = (pageIndex: number) => {
      setActivePageIndex(pageIndex);
      setRightPanelMode('pageProperties');
      setContextMenu(null);
    };
  
    const handleShowWidgetProperties = (widgetId: string) => {
      handleSelectWidget(widgetId);
      setContextMenu(null);
    }
    
    const handleDataBinding = (widgetId: string, binding: WidgetBinding) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            return {
                ...template,
                pages: template.pages.map(page => ({
                    ...page,
                    widgets: page.widgets.map(widget => 
                        widget.id === widgetId ? { ...widget, bindings: { ...widget.bindings, [binding.property]: binding.dataPath } } : widget
                    )
                }))
            };
        });
        setContextMenu(null);
    };

    const handleApplyExtractedWidgets = (extractedWidgets: Partial<WidgetInstance>[]) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            const newPages = [...template.pages];
            const lastPage = newPages[newPages.length - 1];
            let yOffset = lastPage.widgets.reduce((max, w) => Math.max(max, w.y + w.height), 20) + 20;

            extractedWidgets.forEach(widgetProps => {
                if (!widgetProps.type) return;

                let initialWidth = widgetProps.width;
                let initialHeight = widgetProps.height;

                if (!initialWidth) {
                    switch (widgetProps.type) {
                        case 'Title': initialWidth = 500; break;
                        case 'Subtitle': initialWidth = 400; break;
                        case 'Text': initialWidth = 350; break;
                        case 'Styled Paragraph': initialWidth = 400; break;
                        case 'List': initialWidth = 350; break;
                        default: initialWidth = widgetProps.width || 700; break;
                    }
                }
                if (!initialHeight) {
                    switch (widgetProps.type) {
                        case 'Title': initialHeight = 60; break;
                        case 'Subtitle': initialHeight = 50; break;
                        case 'Text': initialHeight = 100; break;
                        case 'Styled Paragraph': initialHeight = 120; break;
                        case 'List': initialHeight = 100; break;
                        case 'Image': initialHeight = 150; break;
                        case 'QR Code': initialHeight = 100; break;
                        default: initialHeight = 50; break;
                    }
                }

                const newWidget: WidgetInstance = {
                    id: uuidv4(), 
                    x: 20, 
                    y: yOffset, 
                    width: initialWidth, 
                    height: initialHeight, 
                    bindings: {},
                    ...widgetProps, 
                    type: widgetProps.type, 
                    props: widgetProps.props || {}, 
                    style: widgetProps.style || {},
                };
                newWidget.height = calculateInitialTextWidgetHeight(
                    newWidget.type, 
                    newWidget.props.content, 
                    newWidget.width, 
                    newWidget.style?.fontSize
                );
                
                lastPage.widgets.push(newWidget);
                yOffset += newWidget.height + 10;
            });

            return {...template, pages: newPages};
        });
        setIsAiModalOpen(false);
    };

    const handleApplyGeneratedTemplate = (templateWidgets: Partial<WidgetInstance>[]) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            const newPage: PageData = {
                id: uuidv4(),
                properties: DEFAULT_PAGE_PROPERTIES,
                widgets: templateWidgets.reduce<WidgetInstance[]>((acc, widget) => {
                    if (widget.type) {
                        let initialWidth = widget.width;
                        let initialHeight = widget.height;

                        if (!initialWidth) {
                            switch (widget.type) {
                                case 'Title': initialWidth = 500; break;
                                case 'Subtitle': initialWidth = 400; break;
                                case 'Text': initialWidth = 350; break;
                                case 'Styled Paragraph': initialWidth = 400; break;
                                case 'List': initialWidth = 350; break;
                                default: initialWidth = widget.width || 200; break;
                            }
                        }
                        if (!initialHeight) {
                            switch (widget.type) {
                                case 'Title': initialHeight = 60; break;
                                case 'Subtitle': initialHeight = 50; break;
                                case 'Text': initialHeight = 100; break;
                                case 'Styled Paragraph': initialHeight = 120; break;
                                case 'List': initialHeight = 100; break;
                            case 'Image': initialHeight = 150; break;
                            case 'QR Code': initialHeight = 100; break;
                                default: initialHeight = 50; break;
                            }
                        }

                     const newWidget: WidgetInstance = {
                        id: uuidv4(), 
                        x: widget.x || 50, 
                        y: widget.y || 50, 
                        width: initialWidth, 
                        height: initialHeight, 
                        ...widget,
                        type: widget.type,
                        bindings: widget.bindings || {},
                        props: widget.props || {},
                        style: widget.style || {},
                    };
                    newWidget.height = calculateInitialTextWidgetHeight(
                        newWidget.type, 
                        newWidget.props.content, 
                        newWidget.width, 
                        newWidget.style?.fontSize
                    );
                    acc.push(newWidget);
                }
                return acc;
            }, []),
        };
        return { ...template, pages: [...template.pages, newPage]};
    });
        setIsAiModalOpen(false);
    };
    
    const handleApplyProjectDocumentation = (docResult: ProjectDocumentation) => {
        setProjectDocumentation(docResult);
        const { widgets: docWidgets, config } = docResult;
        const PAGE_WIDTH = 816;
        const PAGE_HEIGHT_LIMIT = 1000;
        const PAGE_MARGIN = 50;
        const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);
        
        const pageProperties: PageProperties = {
            ...DEFAULT_PAGE_PROPERTIES,
            backgroundColor: config.colorPalette.background,
        };

        const newPages: PageData[] = [];
        let currentPageWidgets: WidgetInstance[] = [];
        let yOffset = 50;
    
        docWidgets.forEach(widget => {
            if (!widget.type) return;

            let initialWidth = widget.width;
            let initialHeight = widget.height;

            if (!initialWidth) {
                switch (widget.type) {
                    case 'Title': initialWidth = 500; break;
                    case 'Subtitle': initialWidth = 400; break;
                    case 'Text': initialWidth = 350; break;
                    case 'Styled Paragraph': initialWidth = 400; break;
                    case 'List': initialWidth = 350; break;
                    default: initialWidth = widget.width || CONTENT_WIDTH; break;
                }
            }
            if (!initialHeight) {
                switch (widget.type) {
                    case 'Title': initialHeight = 60; break;
                    case 'Subtitle': initialHeight = 50; break;
                    case 'Text': initialHeight = 100; break;
                    case 'Styled Paragraph': initialHeight = 120; break;
                    case 'List': initialHeight = 100; break;
                    case 'Image': initialHeight = 150; break;
                    case 'QR Code': initialHeight = 100; break;
                    default: initialHeight = 50; break;
                }
            }

            const newWidget: WidgetInstance = {
                id: uuidv4(), 
                x: widget.x || PAGE_MARGIN, 
                y: 0, 
                width: initialWidth, 
                height: initialHeight, 
                ...widget, 
                type: widget.type, 
                bindings: widget.bindings || {}, 
                props: widget.props || {}, 
                style: widget.style || {},
            };
            
            newWidget.height = calculateInitialTextWidgetHeight(
                newWidget.type, 
                newWidget.props.content, 
                newWidget.width, 
                newWidget.style?.fontSize
            );

            if (newWidget.type === 'Image') {
                newWidget.height = 300; // Give images a fixed height
            }

            if (yOffset + newWidget.height > PAGE_HEIGHT_LIMIT) {
                newPages.push({ id: uuidv4(), properties: pageProperties, widgets: currentPageWidgets });
                currentPageWidgets = [];
                yOffset = 50;
            }
    
            newWidget.y = yOffset;
            currentPageWidgets.push(newWidget);
            yOffset += newWidget.height + 20;
        });

        if (currentPageWidgets.length > 0) {
            newPages.push({ id: uuidv4(), properties: pageProperties, widgets: currentPageWidgets });
        }
    
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => ({
            ...template,
            pages: [...template.pages, ...newPages],
        }));
        setActivePageIndex(activeTemplate?.pages.length || 0);
        setIsProjectDocModalOpen(false);
    };

    const handleShowDocDetail = (title: string, code: string, explanation: string, config: DocGenConfig) => {
        setDocDetailContent({ title, code, explanation, config });
        setIsDocDetailModalOpen(true);
    };

    const handleRegenerateDocExplanation = (filePath: string, newExplanation: string) => {
        if (!projectDocumentation) return;
    
        const fileSubtitleIndex = projectDocumentation.widgets.findIndex(
            w => w.type === 'Subtitle' && w.props?.content === filePath
        );
    
        if (fileSubtitleIndex === -1 || fileSubtitleIndex + 2 >= projectDocumentation.widgets.length) {
            console.error("Could not find the widget to update for regeneration.");
            return;
        }
    
        const explanationWidgetIndex = fileSubtitleIndex + 2;
        const newWidgets = [...projectDocumentation.widgets];
        const oldWidget = newWidgets[explanationWidgetIndex];
        
        if(oldWidget && (oldWidget.type === 'Text' || oldWidget.type === 'Styled Paragraph')) {
            newWidgets[explanationWidgetIndex] = {
                ...oldWidget,
                props: { ...oldWidget.props, content: newExplanation }
            };
    
            setProjectDocumentation({ ...projectDocumentation, widgets: newWidgets });
            
            if(isDocDetailModalOpen && docDetailContent?.title === filePath) {
                setDocDetailContent(current => current ? {...current, explanation: newExplanation} : null);
            }
        } else {
            console.error("Widget structure mismatch, could not regenerate explanation.");
        }
    };
    
    // --- AI Text Generation Handlers ---
    const handleOpenAiTextModal = (widgetId: string) => {
        setTargetWidgetIdForAiText(widgetId);
        setIsAiTextModalOpen(true);
    };

    const handleApplyAiGeneratedText = (text: string) => {
        if (targetWidgetIdForAiText) {
            updateWidget(targetWidgetIdForAiText, { props: { content: text }});
        }
        setIsAiTextModalOpen(false);
        setTargetWidgetIdForAiText(null);
    };
    
    // --- Page AI Generation Handlers ---
    const handleOpenPageAiModal = (pageIndex: number) => {
        setTargetPageIndexForAi(pageIndex);
        setIsPageAiModalOpen(true);
    };

    const handleApplyAiPageContent = (pageIndex: number, widgets: AiWidgetGenerationResponse) => {
        // Fix: Replaced updateActiveTemplate with setActiveTemplate
        setActiveTemplate(template => {
            if (!template) return template;
            const newPages = [...template.pages];
            const targetPage = newPages[pageIndex];
            const PAGE_MARGIN = 50;
            const CONTENT_WIDTH = (targetPage.properties.orientation === 'Landscape' ? 1056 : 816) - (PAGE_MARGIN * 2);
            let yOffset = targetPage.widgets.reduce((max, w) => Math.max(max, w.y + w.height), 20) + 20;

            const widgetsToAdd: WidgetInstance[] = widgets.reduce<WidgetInstance[]>((acc, widget) => {
                if (widget.type) {
                    let initialWidth = widget.width;
                    let initialHeight = widget.height;

                    if (!initialWidth) {
                        switch (widget.type) {
                            case 'Title': initialWidth = 500; break;
                            case 'Subtitle': initialWidth = 400; break;
                            case 'Text': initialWidth = 350; break;
                            case 'Styled Paragraph': initialWidth = 400; break;
                            case 'List': initialWidth = 350; break;
                            default: initialWidth = widget.width || CONTENT_WIDTH; break;
                        }
                    }
                    if (!initialHeight) {
                        switch (widget.type) {
                            case 'Title': initialHeight = 60; break;
                            case 'Subtitle': initialHeight = 50; break;
                            case 'Text': initialHeight = 100; break;
                            case 'Styled Paragraph': initialHeight = 120; break;
                            case 'List': initialHeight = 100; break;
                            case 'Image': initialHeight = 150; break;
                            case 'QR Code': initialHeight = 100; break;
                            default: initialHeight = 50; break;
                        }
                    }
                    const newWidget: WidgetInstance = {
                        id: uuidv4(), 
                        x: widget.x || PAGE_MARGIN, 
                        y: yOffset, 
                        width: initialWidth, 
                        height: initialHeight, 
                        ...widget, 
                        type: widget.type, 
                        bindings: widget.bindings || {}, 
                        props: widget.props || {}, 
                        style: widget.style || {},
                    };
                    newWidget.height = calculateInitialTextWidgetHeight(
                        newWidget.type, 
                        newWidget.props.content, 
                        newWidget.width, 
                        newWidget.style?.fontSize
                    );
                    acc.push(newWidget);
                    yOffset += newWidget.height + 10;
                }
                return acc;
            }, []);
            
            targetPage.widgets.push(...widgetsToAdd);
            return { ...template, pages: newPages };
        });

        setIsPageAiModalOpen(false);
        setTargetPageIndexForAi(null);
    };

    // --- Render Logic ---
    if (view === 'login') return <Login onLogin={handleLogin} />;
    if (view === 'dashboard' || !activeTemplate) {
        return (
            <Dashboard 
                templates={templates} 
                user={user}
                onSelectTemplate={handleSelectTemplate} 
                onCreateNewTemplate={handleCreateNewTemplate}
                onRenameTemplate={handleRenameTemplate}
                onDuplicateTemplate={handleDuplicateTemplate}
                onArchiveTemplate={handleArchiveTemplate}
                onRestoreTemplate={handleRestoreTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onUpdateUser={setUser}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <div className={`flex flex-col h-screen font-sans ${theme}`} onClick={() => contextMenu && setContextMenu(null)}>
            <div className="flex flex-col h-screen bg-main text-main">
                <Header 
                    onUpdateTemplate={handleUpdateTemplate}
                    onReturnToDashboard={handleReturnToDashboard}
                    onOpenAiTools={() => setIsAiModalOpen(true)}
                    onOpenProjectDoc={() => setIsProjectDocModalOpen(true)}
                    pages={activeTemplate.pages} 
                    jsonData={activeTemplate.jsonData} 
                    currentTheme={theme} 
                    setTheme={setTheme} 
                />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar 
                        style={{ width: `${leftPanelWidth}px` }}
                        jsonData={activeTemplate.jsonData} 
                        onOpenJsonModal={() => setIsJsonModalOpen(true)}
                        pages={activeTemplate.pages}
                        activePageIndex={activePageIndex}
                        onSelectWidget={handleSelectWidget}
                        selectedWidgetId={selectedWidgetId}
                        onDeleteWidget={(id) => deleteWidget(id)}
                        onReorderWidgets={reorderWidgets}
                        widgetBindings={selectedWidgetBindings}
                        documentation={projectDocumentation}
                        onShowDocDetail={handleShowDocDetail}
                        webhookUrl={webhookUrl}
                        setWebhookUrl={setWebhookUrl}
                        activeTemplate={activeTemplate}
                    />
                    <ResizableHandle onResize={setLeftPanelWidth} />
                    <main className="flex-1 flex flex-col overflow-auto" onClick={handleDeselect}>
                        <Editor
                            pages={activeTemplate.pages}
                            jsonData={activeTemplate.jsonData}
                            onAddPage={addPage}
                            onDeletePage={deletePage}
                            onAddWidget={addWidget}
                            onUpdateWidget={updateWidget}
                            onSelectWidget={handleSelectWidget}
                            selectedWidgetId={selectedWidgetId}
                            onWidgetRightClick={handleWidgetRightClick}
                            onPageRightClick={handlePageRightClick}
                            activePageIndex={activePageIndex}
                            onSetActivePage={setActivePageIndex}
                            editorView={editorView}
                            setEditorView={setEditorView}
                            onOpenPageAiModal={handleOpenPageAiModal}
                            editorZoom={editorZoom}
                            editorLayout={editorLayout}
                            copiedWidget={copiedWidget}
                            onCopyWidget={handleCopyWidget}
                            onPasteWidget={handlePasteWidget}
                            onDuplicateWidget={handleDuplicateWidget}
                            alignmentGuides={alignmentGuides}
                            setAlignmentGuides={setAlignmentGuides}
                        />
                    </main>
                    <ResizableHandle onResize={(newWidth) => setRightPanelWidth(window.innerWidth - newWidth)} isRight />
                    <Widgets 
                        style={{ width: `${rightPanelWidth}px` }}
                        mode={rightPanelMode}
                        selectedWidget={selectedWidget} 
                        onUpdateWidget={updateWidget} 
                        onShowWidgetList={handleDeselect}
                        pages={activeTemplate.pages}
                        activePageIndex={activePageIndex}
                        onUpdatePageProperties={updatePageProperties}
                        onApplyPropertiesToAllPages={applyPropertiesToAllPages}
                        jsonData={activeTemplate.jsonData}
                        onOpenAiTextModal={handleOpenAiTextModal}
                        />
                    <Chatbot />
                </div>
            </div>
            {/* Floating Controls - now at top level, fixed */}
            <FloatingControls
                activePageIndex={activePageIndex}
                onDeletePage={deletePage}
                onGenerateAi={handleOpenPageAiModal}
                editorZoom={editorZoom}
                setEditorZoom={setEditorZoom}
                editorLayout={editorLayout}
                onSetEditorLayout={setEditorLayout}
                initialX={floatingControlsPosition.x}
                initialY={floatingControlsPosition.y}
                onPositionChange={setFloatingControlsPosition}
            />
            <GenerateJsonModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                // Fix: Replaced updateActiveTemplate with setActiveTemplate
                onJsonGenerated={(newJson) => {
                    setActiveTemplate(t => {
                        if (!t) return t;
                        return {...t, jsonData: newJson}
                    });
                    setIsGenerateModalOpen(false);
                }}
            />
            <JsonEditorModal
                isOpen={isJsonModalOpen}
                // Fix: Corrected typo 'setIsJsonModalModalOpen' to 'setIsJsonModalOpen'
                onClose={() => setIsJsonModalOpen(false)}
                jsonData={activeTemplate.jsonData}
                // Fix: Replaced updateActiveTemplate with setActiveTemplate
                setJsonData={(json) => setActiveTemplate(t => {
                    if (!t) return t;
                    return {...t, jsonData: json}
                })}
                onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
            />
            <AiToolsModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onApplyExtractedWidgets={handleApplyExtractedWidgets}
                onApplyGeneratedTemplate={handleApplyGeneratedTemplate}
            />
             <ProjectDocModal
                isOpen={isProjectDocModalOpen}
                onClose={() => setIsProjectDocModalOpen(false)}
                onApplyDocumentation={handleApplyProjectDocumentation}
            />
             <PageAiGeneratorModal
                isOpen={isPageAiModalOpen}
                onClose={() => { setIsPageAiModalOpen(false); setTargetPageIndexForAi(null); }}
                onApply={handleApplyAiPageContent}
                pageIndex={targetPageIndexForAi}
            />
            <DocumentationDetailModal 
                isOpen={isDocDetailModalOpen}
                onClose={() => setIsDocDetailModalOpen(false)}
                content={docDetailContent}
                onRegenerate={handleRegenerateDocExplanation}
            />
            <AiTextGeneratorModal
                isOpen={isAiTextModalOpen}
                onClose={() => { setIsAiTextModalOpen(false); setTargetWidgetIdForAiText(null); }}
                onApply={handleApplyAiGeneratedText}
                projectDocumentation={projectDocumentation}
            />
            {contextMenu && (
                <ContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  type={contextMenu.type}
                  bindableProperties={contextMenu.widget ? getBindableProperties(contextMenu.widget.type) : []}
                  jsonData={activeTemplate.jsonData}
                  onBind={(binding) => contextMenu.widget && handleDataBinding(contextMenu.widget.id, binding)}
                  onShowPageProperties={() => contextMenu.pageIndex !== undefined && handleShowPageProperties(contextMenu.pageIndex)}
                  onShowWidgetProperties={() => contextMenu.widget && handleShowWidgetProperties(contextMenu.widget.id)}
                  onClose={() => setContextMenu(null)}
                  copiedWidget={copiedWidget}
                  onCopyWidget={handleCopyWidget}
                  onPasteWidget={handlePasteWidget}
                  onDuplicateWidget={handleDuplicateWidget}
                  currentTheme={theme}
                />
            )}
        </div>
    );
};

export default App;