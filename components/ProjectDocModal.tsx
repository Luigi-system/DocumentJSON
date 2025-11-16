
import React, { useState, useRef } from 'react';
import { ProjectDocumentation, DocGenConfig, WidgetType } from '../types';
import { generateProjectDocumentation } from '../services/geminiService';
import { CloseIcon, MagicWandIcon, UploadIcon, FolderOpenIcon } from './icons';
import { FileTreeView, FileNode, buildFileTree } from './FileTreeView';
import { COLOR_PALETTES, AVAILABLE_WIDGETS_FOR_DOCS } from '../constants';

interface ProjectDocModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDocumentation: (documentation: ProjectDocumentation) => void;
}

const ProjectDocModal: React.FC<ProjectDocModalProps> = ({ isOpen, onClose, onApplyDocumentation }) => {
    const [view, setView] = useState<'upload' | 'select' | 'config' | 'analyzing' | 'error'>('upload');
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [allFiles, setAllFiles] = useState<File[]>([]);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [docConfig, setDocConfig] = useState<DocGenConfig>({
        verbosity: 'Normal',
        maxWordsPerFile: 150,
        includeIndex: true,
        language: 'Español',
        allowedWidgets: AVAILABLE_WIDGETS_FOR_DOCS,
        colorPalette: COLOR_PALETTES[0],
    });
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Fix: Explicitly cast Array.from(files) to File[]
        const fileList = Array.from(files) as File[];
        setAllFiles(fileList);
        
        const tree = buildFileTree(fileList);
        setFileTree(tree);

        const allPaths = new Set<string>();
        const traverse = (node: FileNode) => {
            allPaths.add(node.path);
            if(node.children) node.children.forEach(traverse);
        };
        tree.forEach(traverse);
        setSelectedPaths(allPaths);

        setView('select');
    };
    
    const handleProceedToConfig = () => {
        if (selectedPaths.size === 0) {
            alert('Por favor, selecciona al menos un archivo.');
            return;
        }
        setView('config');
    };

    const handleAnalyze = async () => {
        setView('analyzing');
        setError(null);
        
        const filesToProcess = allFiles.filter(file => selectedPaths.has(file.webkitRelativePath));
        
        if (filesToProcess.length === 0) {
            setError("Por favor, selecciona al menos un archivo para analizar.");
            setView('select');
            return;
        }

        try {
            const fileContents = await Promise.all(
                filesToProcess.map(file => 
                    file.text().then(content => ({ path: file.webkitRelativePath, content }))
                )
            );

            const widgets = await generateProjectDocumentation(fileContents, docConfig);
            onApplyDocumentation({ widgets, config: docConfig });

        } catch (e: any) {
            setError(e.message || 'Ocurrió un error inesperado durante el análisis.');
            setView('error');
        }
    };

    const resetState = () => {
        setView('upload');
        setFileTree([]);
        setAllFiles([]);
        setSelectedPaths(new Set());
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };
    
    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen) return null;

    const handleWidgetToggle = (widgetType: WidgetType) => {
        setDocConfig(c => {
            const newAllowed = new Set(c.allowedWidgets);
            if (newAllowed.has(widgetType)) {
                newAllowed.delete(widgetType);
            } else {
                newAllowed.add(widgetType);
            }
            return {...c, allowedWidgets: Array.from(newAllowed)};
        });
    };

    const renderContent = () => {
        switch(view) {
            case 'upload':
                return (
                    <div className="text-center">
                        <p className="text-sm text-subtle mb-4">Sube la carpeta de tu proyecto. La IA analizará los archivos seleccionados y generará una página de documentación.</p>
                        <div className="border-2 border-dashed border-main rounded-lg p-8 flex flex-col items-center justify-center bg-tertiary">
                            <UploadIcon className="h-12 w-12 text-subtle mb-2" />
                            <label htmlFor="folder-upload" className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                                Subir Carpeta
                            </label>
                            <input id="folder-upload" type="file" {...{ webkitdirectory: "", directory: "", multiple: true }} ref={inputRef} className="hidden" onChange={handleFolderUpload} />
                             <p className="text-xs text-subtle mt-2">Selecciona una carpeta para empezar.</p>
                        </div>
                    </div>
                );
            case 'select':
                return (
                    <div className="flex flex-col h-full">
                        <p className="text-sm text-subtle mb-2 flex-shrink-0">Selecciona los archivos y carpetas que quieres incluir en la documentación.</p>
                        <div className="flex-grow border border-main bg-tertiary rounded-md p-2 overflow-y-auto">
                            <FileTreeView fileTree={fileTree} selectedPaths={selectedPaths} setSelectedPaths={setSelectedPaths} />
                        </div>
                    </div>
                );
             case 'config':
                return (
                    <div className="space-y-4 animate-fade-in h-full overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-subtle block mb-1">Verbosidad</label>
                                <select value={docConfig.verbosity} onChange={(e) => setDocConfig(c => ({...c, verbosity: e.target.value as DocGenConfig['verbosity']}))} className="w-full p-2 text-sm border border-main rounded-md bg-tertiary text-main focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                    <option value="Concise">Conciso</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Detailed">Detallado</option>
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-subtle block mb-1">Máx. de palabras por archivo</label>
                                <input
                                    type="number"
                                    step="10"
                                    value={docConfig.maxWordsPerFile}
                                    onChange={(e) => setDocConfig(c => ({...c, maxWordsPerFile: parseInt(e.target.value, 10) || 0 }))}
                                    className="w-full p-2 text-sm border border-main rounded-md bg-tertiary text-main focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-subtle block mb-1">Idioma de Salida</label>
                                <select value={docConfig.language} onChange={(e) => setDocConfig(c => ({...c, language: e.target.value}))} className="w-full p-2 text-sm border border-main rounded-md bg-tertiary text-main focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                    <option>Español</option>
                                    <option>English</option>
                                    <option>Français</option>
                                    <option>Deutsch</option>
                                    <option>Português</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="includeIndex" checked={docConfig.includeIndex} onChange={(e) => setDocConfig(c => ({...c, includeIndex: e.target.checked}))} className="h-4 w-4 rounded border-main text-indigo-600 focus:ring-indigo-500 accent-indigo-500" />
                            <label htmlFor="includeIndex" className="ml-2 block text-sm text-main">Incluir un índice al principio</label>
                        </div>

                        <div>
                           <label className="text-sm font-medium text-subtle block mb-2">Widgets Permitidos</label>
                           <div className="grid grid-cols-3 gap-2">
                            {AVAILABLE_WIDGETS_FOR_DOCS.map(widgetType => (
                                <div key={widgetType} className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id={`widget-${widgetType}`} 
                                        checked={docConfig.allowedWidgets.includes(widgetType)}
                                        onChange={() => handleWidgetToggle(widgetType)}
                                        className="h-4 w-4 rounded border-main text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                                    />
                                    <label htmlFor={`widget-${widgetType}`} className="ml-2 text-xs text-main">{widgetType}</label>
                                </div>
                            ))}
                           </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-subtle block mb-2">Paleta de Colores</label>
                            <div className="grid grid-cols-2 gap-2">
                                {COLOR_PALETTES.map(palette => (
                                    <button key={palette.name} onClick={() => setDocConfig(c => ({...c, colorPalette: palette}))} className={`p-2 border rounded-md text-left transition-all ${docConfig.colorPalette.name === palette.name ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-main hover:border-indigo-400'}`}>
                                        <p className="text-xs font-semibold">{palette.name}</p>
                                        <div className="flex space-x-1 mt-1">
                                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: palette.primary}}></div>
                                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: palette.secondary}}></div>
                                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: palette.background, border: '1px solid #ccc'}}></div>
                                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: palette.text}}></div>
                                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: palette.accent}}></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'analyzing':
                return (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-lg font-semibold">Analizando con IA...</p>
                        <p className="text-sm text-subtle">Esto puede tardar unos momentos.</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                        <p className="text-lg font-semibold text-red-500">Error</p>
                        <p className="text-sm text-subtle my-4">{error}</p>
                        <button onClick={resetState} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            Intentar de Nuevo
                        </button>
                    </div>
                );
        }
    };
    
    const renderFooter = () => {
        if (view === 'select') {
            return (
                <div className="flex justify-between items-center">
                    <p className="text-xs text-subtle">{selectedPaths.size} elemento(s) seleccionado(s)</p>
                    <div>
                         <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary mr-2">
                            Cancelar
                        </button>
                        <button onClick={handleProceedToConfig} disabled={selectedPaths.size === 0} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center">
                            <span>Siguiente</span>
                        </button>
                    </div>
                </div>
            );
        }
        if (view === 'config') {
             return (
                <div className="flex justify-between items-center">
                    <button onClick={() => setView('select')} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                        Atrás
                    </button>
                    <button onClick={handleAnalyze} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center">
                        <MagicWandIcon className="h-4 w-4 mr-2"/>
                        <span>Generar Documentación</span>
                    </button>
                </div>
            )
        }
        if (view === 'upload' || view === 'error') {
            return (
                <div className="flex justify-end">
                   <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-subtle bg-panel border border-main rounded-md hover:bg-tertiary">
                       Cerrar
                   </button>
               </div>
           );
        }
        return null; // No footer when analyzing
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-panel rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-main flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-main flex items-center">
                        <FolderOpenIcon className="h-5 w-5 mr-2 text-indigo-500" />
                        Documentación de Proyecto
                    </h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-tertiary">
                        <CloseIcon className="h-5 w-5 text-subtle" />
                    </button>
                </header>
                <main className="p-6 flex-grow overflow-hidden">
                    {renderContent()}
                </main>
                { (view !== 'analyzing') && (
                    <footer className="p-4 border-t border-main bg-editor-canvas flex-shrink-0">
                        {renderFooter()}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ProjectDocModal;