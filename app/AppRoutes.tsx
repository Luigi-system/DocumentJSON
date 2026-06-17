import React, { useState, useCallback, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
// Components
import Sidebar from '@/pages/canvas/components/Sidebar';
import Editor from '@/pages/canvas/components/Editor';
import Widgets from '@/pages/canvas/components/Widgets';
import Header from '@/pages/canvas/components/Header';
import LoginPage from '@/pages/login/LoginPage';
import PlantillasPage from '@/pages/plantillas/PlantillasPage';
import CanvasPage from '@/pages/canvas/CanvasPage';
import GenerateJsonModal from '@/pages/canvas/components/GenerateJsonModal';
import JsonEditorModal from '@/pages/canvas/components/JsonEditorModal';
import ContextMenu from '@/pages/canvas/components/ContextMenu';

import ResizableHandle from '@/pages/canvas/components/ResizableHandle';
import DocumentationDetailModal from '@/pages/canvas/components/DocumentationDetailModal';
import AiTextGeneratorModal from '@/pages/canvas/components/AiTextGeneratorModal';
import FloatingControls from '@/pages/canvas/components/FloatingControls';
// Constants & Types
import { DEFAULT_PAGE_PROPERTIES } from '@/constants';
import { Theme, PageData, WidgetInstance, PageProperties, WidgetBinding, Template, User, ProjectDocumentation, DocGenConfig, AiWidgetGenerationResponse, EditorLayout, WidgetType } from '@/types';
// Utils
import { v4 as uuidv4 } from 'uuid';
import { getBindableProperties } from '@/pages/canvas/components/WidgetComponent';
import {
    loadTemplates,
    persistTemplates,
    createTemplate,
    updateTemplate as saveTemplate,
    renameTemplate as saveTemplateName,
    duplicateTemplate as saveDuplicatedTemplate,
    setTemplateStatus,
    deleteTemplate as removeTemplate,
    TemplateSource,
} from '@/services/templateRepository';
import { io } from 'socket.io-client';
import { paginateTemplate } from '@/services/paginationService';


const AppRoutes: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // App state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templatesLoaded, setTemplatesLoaded] = useState(false);
    const [templateSource, setTemplateSource] = useState<TemplateSource>('predefined');
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

    // --- Webhook / Socket.IO Integration ---
    useEffect(() => {
        const socket = io('http://localhost:3001');

        socket.on('connect', () => {
            console.log('Connected to Webhook Server');
        });

        socket.on('webhook-update', (payload: { templateId: string, data: any }) => {
            console.log('Webhook Data Received:', payload);
            if (activeTemplate && activeTemplate.id === payload.templateId) {
                // Update current template json data
                const newDataProp = JSON.stringify(payload.data, null, 2);

                // Optimization: Only update if different
                // Optimization: Only update if different
                setActiveTemplate(prev => {
                    if (!prev) return null;
                    const updatedTemplate = {
                        ...prev,
                        jsonData: newDataProp
                    };
                    // Apply pagination logic
                    return paginateTemplate(updatedTemplate);
                });

                alert("¡Datos recibidos del Webhook! La plantilla se ha actualizado.");
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [activeTemplate?.id]);




    // --- Render Mode Logic (for Puppeteer) ---
    const [isRenderMode, setIsRenderMode] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const templateId = params.get('templateId');

        if (mode === 'render' && templateId) {
            setIsRenderMode(true);
            if (!location.pathname.startsWith('/canvas/')) {
                navigate(`/canvas/${templateId}${location.search}`, { replace: true });
            }

            // Attempt to load the template immediately from DB or wait for templates to load
            // Since templates loading is async in another useEffect, we might need to wait or rely on templates state change
            // For simplicity, we'll try to find it in the `templates` array when it updates

            // Also listen for direct data injection from Puppeteer
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'INJECT_DATA') {
                    console.log('Received injected data:', event.data.payload);
                    const injectedData = event.data.payload;
                    setActiveTemplate(prev => {
                        if (!prev) return null;
                        const updatedTemplate = {
                            ...prev,
                            jsonData: JSON.stringify(injectedData, null, 2)
                        };
                        return paginateTemplate(updatedTemplate);
                    });
                }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, [location.pathname, location.search, navigate]);

    // Effect to select template in render mode once templates are loaded
    useEffect(() => {
        if (isRenderMode && templates.length > 0 && !activeTemplate) {
            const params = new URLSearchParams(window.location.search);
            const templateId = params.get('templateId');
            if (templateId) {
                const found = templates.find(t => t.id === templateId);
                if (found) {
                    setActiveTemplate(JSON.parse(JSON.stringify(found)));
                }
            }
        }
    }, [isRenderMode, templates, activeTemplate]);

    useEffect(() => {
        const match = location.pathname.match(/^\/canvas\/([^/]+)/);
        const templateId = match?.[1];

        if (!templateId || !templates.length) return;
        if (activeTemplate?.id === templateId) return;

        const found = templates.find(t => t.id === templateId);
        if (found) {
            setActiveTemplate(JSON.parse(JSON.stringify(found)));
            setActivePageIndex(0);
            setSelectedWidgetId(null);
            setProjectDocumentation(null);
        }
    }, [location.pathname, templates, activeTemplate?.id]);

    // --- Webhook / Socket.IO Integration ---
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
            const { templates: loadedTemplates, source } = await loadTemplates();
            setTemplates(loadedTemplates);
            setTemplateSource(source);
            setTemplatesLoaded(true);
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
        if (templatesLoaded && templates.length > 0) {
            persistTemplates(templates, templateSource);
        }
    }, [templates, templateSource, templatesLoaded]);

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

    const handleLogin = () => navigate('/plantillas');
    const handleLogout = () => navigate('/login');

    const handleSelectTemplate = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (template) {
            setActiveTemplate(JSON.parse(JSON.stringify(template))); // Deep copy to avoid mutation
            setActivePageIndex(0);
            setSelectedWidgetId(null);
            setProjectDocumentation(null); // Clear any previous doc results
            navigate(`/canvas/${id}`);
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

        const error = await createTemplate(newTemplate, templateSource);
        if (error) {
            console.error("Error creating template:", error);
            alert("Failed to save new template to database.");
            setTemplates(t => t.filter(temp => temp.id !== newTemplate.id));
            handleReturnToDashboard();
        }
    };

    const handleReturnToDashboard = () => {
        setActiveTemplate(null);
        setProjectDocumentation(null);
        navigate('/plantillas');
    };

    const handleUpdateTemplate = async () => {
        if (!activeTemplate) return;

        // Optimistic UI update in local state
        setTemplates(currentTemplates =>
            currentTemplates.map(t => t.id === activeTemplate.id ? activeTemplate : t)
        );

        const error = await saveTemplate(activeTemplate, templateSource);

        if (error) {
            console.error("Error updating template:", error);
            alert('¡Error al actualizar la plantilla en la base de datos!');
        } else {
            alert('¡Plantilla actualizada!');
        }
    };

    // --- Template Management Handlers ---
    const handleRenameTemplate = async (id: string, newName: string) => {
        const originalName = templates.find(t => t.id === id)?.name;
        setTemplates(ts => ts.map(t => t.id === id ? { ...t, name: newName } : t)); // Optimistic

        const error = await saveTemplateName(id, newName, templateSource);

        if (error) {
            console.error("Error renaming template:", error);
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

            const error = await saveDuplicatedTemplate(newTemplate, templateSource);

            if (error) {
                console.error("Error duplicating template:", error);
                alert("Failed to duplicate template.");
                setTemplates(ts => ts.filter(t => t.id !== newTemplate.id)); // Revert
            }
        }
    };

    const handleArchiveTemplate = async (id: string) => {
        setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'archived' } : t)); // Optimistic

        const error = await setTemplateStatus(id, 'archived', templateSource);

        if (error) {
            console.error("Error archiving template:", error);
            alert("Failed to archive template.");
            setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'active' } : t)); // Revert
        }
    };

    const handleRestoreTemplate = async (id: string) => {
        setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'active' } : t)); // Optimistic

        const error = await setTemplateStatus(id, 'active', templateSource);

        if (error) {
            console.error("Error restoring template:", error);
            alert("Failed to restore template.");
            setTemplates(ts => ts.map(t => t.id === id ? { ...t, status: 'archived' } : t)); // Revert
        }
    };

    const handleDeleteTemplate = useCallback(async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla permanentemente? Esta acción no se puede rehacer.')) {
            const originalTemplates = [...templates];
            setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== id)); // Optimistic

            const error = await removeTemplate(id, templateSource);

            if (error) {
                console.error("Error deleting template:", error);
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

            return { ...template, pages: newPages };
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
            return { ...template, pages: [...template.pages, newPage] };
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

        if (oldWidget && (oldWidget.type === 'Text' || oldWidget.type === 'Styled Paragraph')) {
            newWidgets[explanationWidgetIndex] = {
                ...oldWidget,
                props: { ...oldWidget.props, content: newExplanation }
            };

            setProjectDocumentation({ ...projectDocumentation, widgets: newWidgets });

            if (isDocDetailModalOpen && docDetailContent?.title === filePath) {
                setDocDetailContent(current => current ? { ...current, explanation: newExplanation } : null);
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
            updateWidget(targetWidgetIdForAiText, { props: { content: text } });
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

    const plantillasPage = (
        <PlantillasPage
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

    const canvasPage = !activeTemplate ? (
        templatesLoaded ? <Navigate to="/plantillas" replace /> : (
            <div className="min-h-screen bg-main text-main theme-night flex items-center justify-center">
                Cargando plantilla...
            </div>
        )
    ) : (
        <CanvasPage
            currentTheme={theme}
            isRenderMode={isRenderMode}
            onCloseContextMenu={() => contextMenu && setContextMenu(null)}
        >
            <div className={`flex flex-col bg-main text-main ${isRenderMode ? 'min-h-screen h-auto' : 'h-screen'}`}>
                {!isRenderMode && (
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
                )}
                <div className={`flex flex-1 ${isRenderMode ? 'overflow-visible h-auto' : 'overflow-hidden'}`}>
                    {!isRenderMode && (
                        <>
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
                        </>
                    )}
                    <main className={`flex-1 flex flex-col ${isRenderMode ? 'overflow-visible h-auto' : 'overflow-auto'}`} onClick={handleDeselect}>
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
                            editorZoom={isRenderMode ? 1 : editorZoom} // Force zoom 1 in render mode
                            editorLayout={editorLayout}
                            copiedWidget={copiedWidget}
                            onCopyWidget={handleCopyWidget}
                            onPasteWidget={handlePasteWidget}
                            onDuplicateWidget={handleDuplicateWidget}
                            alignmentGuides={alignmentGuides}
                            setAlignmentGuides={setAlignmentGuides}
                            bypassTruncation={isRenderMode}
                            isRenderMode={isRenderMode} // Pass prop
                        />
                    </main>
                    {/* Right Panel */}
                    {!isRenderMode && (
                        <>
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
                        </>
                    )}

                </div>
            </div>
            {/* Floating Controls - now at top level, fixed */}
            {!isRenderMode && (
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
            )}
            <GenerateJsonModal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                // Fix: Replaced updateActiveTemplate with setActiveTemplate
                onJsonGenerated={(newJson) => {
                    setActiveTemplate(t => {
                        if (!t) return t;
                        return { ...t, jsonData: newJson }
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
                    return { ...t, jsonData: json }
                })}
                onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
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
        </CanvasPage>
    );

    return (
        <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/plantillas" element={plantillasPage} />
            <Route path="/canvas/:templateId" element={canvasPage} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
