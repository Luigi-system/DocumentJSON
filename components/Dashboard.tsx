import React, { useState } from 'react';
import { Template, User } from '../types';
import { 
    PlusIcon, UserCircleIcon, CogIcon, SearchIcon, DocumentIcon, 
    EllipsisVerticalIcon, PencilIcon, DocumentDuplicateIcon, ArchiveBoxIcon, TrashIcon, 
    ArrowRightOnRectangleIcon, ArrowUturnLeftIcon, KeyIcon 
} from './icons';
import { renderWidgetToStaticHtml } from '../utils/renderHtml'; // Import renderWidgetToStaticHtml

interface TemplateCardProps {
    template: Template;
    onSelect: () => void;
    onRename: (id: string) => void;
    onDuplicate: (id: string) => void;
    onArchive: (id: string) => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = (props) => {
    const { template, onSelect, onRename, onDuplicate, onArchive, onRestore, onDelete } = props;
    const [menuOpen, setMenuOpen] = useState(false);
    
    const firstPage = template.pages[0];
    const isLandscape = firstPage.properties.orientation === 'Landscape';
    const aspectRatio = isLandscape ? '11 / 8.5' : '8.5 / 11';
    const thumbnailScale = 0.2; // Scale down to 20%
    const scaledWidth = (isLandscape ? 1056 : 816) * thumbnailScale;
    const scaledHeight = (isLandscape ? 816 : 1056) * thumbnailScale;

    // Dynamically render the first page's widgets for the thumbnail
    const renderedPageHtml = React.useMemo(() => {
        if (!firstPage) return '';
        let htmlContent = '';
        const jsonData = JSON.parse(template.jsonData || '{}');
        firstPage.widgets.forEach(widget => {
            htmlContent += renderWidgetToStaticHtml(widget, jsonData);
        });
        return htmlContent;
    }, [firstPage, template.jsonData]);

    return (
        <div className="group relative flex flex-col bg-panel border border-main rounded-lg transition-all duration-300 hover:shadow-xl hover:border-indigo-500/50 hover:-translate-y-1">
            <div 
                onClick={onSelect}
                className="flex-1 flex flex-col p-4 cursor-pointer"
            >
                <div className="flex-1 flex items-center justify-center p-2 mb-4 bg-tertiary rounded-md overflow-hidden">
                    <div 
                        className="relative shadow-md overflow-hidden theme-light"
                        style={{
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                            backgroundColor: firstPage.properties.backgroundColor,
                            transform: `scale(1)`, /* Keep at 1 for parent scaling */
                            transformOrigin: 'top left',
                        }}
                    >
                        <div 
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: isLandscape ? '1056px' : '816px',
                                height: isLandscape ? '816px' : '1056px',
                                pointerEvents: 'none', /* Prevent interaction with scaled content */
                                userSelect: 'none',
                                transform: `scale(${thumbnailScale})`, /* Apply thumbnail scale here */
                                transformOrigin: 'top left',
                            }}
                            dangerouslySetInnerHTML={{ __html: renderedPageHtml }}
                        />
                         {firstPage.properties.watermark.enabled && (
                            <div 
                                className="page-watermark" 
                                style={{
                                    color: firstPage.properties.watermark.color, 
                                    opacity: firstPage.properties.watermark.opacity, 
                                    fontSize: `${firstPage.properties.watermark.fontSize}px`, 
                                    transform: `translate(-50%, -50%) rotate(${firstPage.properties.watermark.angle}deg) scale(${1/thumbnailScale})`, /* Scale watermark inversely */
                                    top: '50%', left: '50%', position: 'absolute', whiteSpace: 'nowrap', fontWeight: 'bold'
                                }}
                            >
                                {firstPage.properties.watermark.text}
                            </div>
                        )}
                        {firstPage.properties.header.enabled && (
                            <div 
                                className="page-header" 
                                style={{
                                    color: '#4b5563', fontSize: '14px', textAlign: 'center', position: 'absolute', top: 0, left: 0, right: 0, padding: '24px 48px',
                                    transform: `scale(${1/thumbnailScale})`, /* Scale header inversely */
                                    transformOrigin: 'top center'
                                }}
                            >
                                {firstPage.properties.header.text}
                            </div>
                        )}
                        {firstPage.properties.pagination.enabled && (
                            <div 
                                className="page-footer" 
                                style={{
                                    color: '#4b5563', fontSize: '14px', textAlign: 'center', position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 48px',
                                    transform: `scale(${1/thumbnailScale})`, /* Scale footer inversely */
                                    transformOrigin: 'bottom center'
                                }}
                            >
                                Página 1 de {template.pages.length}
                            </div>
                        )}
                    </div>
                </div>
                <h3 className="font-semibold text-main truncate group-hover:text-indigo-400">{template.name}</h3>
                <p className="text-xs text-subtle">{template.pages.length} página(s)</p>
            </div>
            
            <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="absolute top-2 right-2 p-1.5 rounded-full text-subtle hover:bg-tertiary"
            >
                <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {menuOpen && (
                 <div 
                    onMouseLeave={() => setMenuOpen(false)}
                    className="absolute top-10 right-2 w-40 bg-panel border border-main rounded-md shadow-2xl z-10 animate-fade-in"
                >
                    <ul className="py-1 text-sm text-main">
                        <li onClick={() => { onRename(template.id); setMenuOpen(false); }} className="px-3 py-1.5 hover:bg-tertiary flex items-center space-x-2 cursor-pointer"><PencilIcon className="h-4 w-4"/><span>Renombrar</span></li>
                        <li onClick={() => { onDuplicate(template.id); setMenuOpen(false); }} className="px-3 py-1.5 hover:bg-tertiary flex items-center space-x-2 cursor-pointer"><DocumentDuplicateIcon className="h-4 w-4"/><span>Duplicar</span></li>
                        {template.status === 'active' ? (
                            <li onClick={() => { onArchive(template.id); setMenuOpen(false); }} className="px-3 py-1.5 hover:bg-tertiary flex items-center space-x-2 cursor-pointer"><ArchiveBoxIcon className="h-4 w-4"/><span>Archivar</span></li>
                        ) : (
                            <li onClick={() => { onRestore(template.id); setMenuOpen(false); }} className="px-3 py-1.5 hover:bg-tertiary flex items-center space-x-2 cursor-pointer"><ArrowUturnLeftIcon className="h-4 w-4"/><span>Restaurar</span></li>
                        )}
                        <li className="px-3 my-1 border-t border-main"></li>
                        <li onClick={() => { onDelete(template.id); setMenuOpen(false); }} className="px-3 py-1.5 hover:bg-red-500/20 text-red-500 flex items-center space-x-2 cursor-pointer"><TrashIcon className="h-4 w-4"/><span>Eliminar</span></li>
                    </ul>
                 </div>
            )}
        </div>
    );
};

const TemplatesView: React.FC<{
    templates: Template[];
    onSelectTemplate: (id: string) => void;
    onCreateNewTemplate: () => void;
    onRename: (id: string) => void;
    onDuplicate: (id: string) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}> = (props) => (
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <button
            onClick={props.onCreateNewTemplate}
            className="flex flex-col items-center justify-center p-6 bg-panel border-2 border-dashed border-main rounded-lg hover:border-indigo-500 hover:bg-indigo-500/5 text-subtle hover:text-indigo-400 transition-colors duration-300"
        >
            <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center mb-4">
                <PlusIcon className="h-8 w-8" />
            </div>
            <span className="font-semibold text-center">Crear Nueva Plantilla</span>
        </button>
        {props.templates.map(template => (
            <TemplateCard 
                key={template.id} 
                template={template} 
                onSelect={() => props.onSelectTemplate(template.id)} 
                onRename={props.onRename}
                onDuplicate={props.onDuplicate}
                onArchive={props.onArchive}
                onRestore={() => {}} // Not used here
                onDelete={props.onDelete}
            />
        ))}
    </div>
);

const ArchivedView: React.FC<{
    templates: Template[];
    onSelectTemplate: (id: string) => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
}> = (props) => (
    <div>
        <h2 className="text-2xl font-bold mb-6">Plantillas Archivadas</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {props.templates.length > 0 ? props.templates.map(template => (
                <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onSelect={() => props.onSelectTemplate(template.id)} 
                    onRename={() => {}} // Not used here
                    onDuplicate={() => {}} // Not used here
                    onArchive={() => {}} // Not used here
                    onRestore={props.onRestore}
                    onDelete={props.onDelete}
                />
            )) : (
                <p className="text-subtle col-span-full text-center">No tienes plantillas archivadas.</p>
            )}
        </div>
    </div>
);

const ProfileView: React.FC<{ user: User, onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
    const [formState, setFormState] = useState(user);

    const handleSave = () => {
        onUpdateUser(formState);
        alert('¡Perfil actualizado!');
    };
    
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Editar Perfil</h2>
            <div className="bg-panel p-6 rounded-lg border border-main space-y-4">
                <div>
                    <label className="text-sm font-medium text-subtle">Nombre</label>
                    <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="mt-1 block w-full px-4 py-2 bg-tertiary border border-main rounded-md" />
                </div>
                <div>
                    <label className="text-sm font-medium text-subtle">Correo Electrónico</label>
                    <input type="email" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} className="mt-1 block w-full px-4 py-2 bg-tertiary border border-main rounded-md" />
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ onSetView: (view: 'main' | 'archived' | 'settings' | 'profile') => void, templates: Template[] }> = ({ onSetView, templates }) => {
    const handleExport = () => {
        const dataStr = JSON.stringify({ templates }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'docugen_backup.json';
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleClearData = () => {
        if (window.confirm('¿Estás seguro? Se eliminarán TODAS tus plantillas y datos de usuario. Esta acción es irreversible.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Configuración</h2>
            <div className="bg-panel p-6 rounded-lg border border-main">
                <h3 className="text-lg font-semibold mb-2">Cuenta</h3>
                <p className="text-sm text-subtle mb-4">Gestiona tu información de perfil.</p>
                <button onClick={() => onSetView('profile')} className="text-sm font-semibold text-indigo-400 hover:underline">Ir a Editar Perfil &rarr;</button>
            </div>

            <div className="bg-panel p-6 rounded-lg border border-main">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <KeyIcon className="h-5 w-5 mr-2 text-subtle" />
                    Configuración de API
                </h3>
                <p className="text-sm text-subtle mb-4">
                    La API Key para los servicios de IA de Google se gestiona de forma segura a través de variables de entorno del sistema para proteger tus credenciales.
                </p>
                <div className="bg-tertiary p-3 rounded-md flex items-center justify-between">
                    <span className="text-sm font-medium">Estado de la API Key de Gemini</span>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-400">Configurada y Activa</span>
                    </div>
                </div>
            </div>

            <div className="bg-panel p-6 rounded-lg border border-main">
                <h3 className="text-lg font-semibold mb-2">Datos de la Aplicación</h3>
                <p className="text-sm text-subtle mb-4">Exporta todas tus plantillas como un archivo JSON de respaldo.</p>
                <button onClick={handleExport} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Exportar Datos</button>
            </div>
            <div className="bg-panel p-6 rounded-lg border border-red-500/50">
                <h3 className="text-lg font-semibold mb-2 text-red-400">Zona de Peligro</h3>
                <p className="text-sm text-subtle mb-4">Elimina permanentemente todos los datos de la aplicación de tu navegador.</p>
                <button onClick={handleClearData} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Limpiar Todos los Datos</button>
            </div>
        </div>
    );
};


interface DashboardProps {
    templates: Template[];
    user: User | null;
    onSelectTemplate: (id: string) => void;
    onCreateNewTemplate: () => void;
    onRenameTemplate: (id: string, newName: string) => void;
    onDuplicateTemplate: (id: string) => void;
    onArchiveTemplate: (id: string) => void;
    onRestoreTemplate: (id: string) => void;
    onDeleteTemplate: (id: string) => void;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { templates, user, onSelectTemplate, onCreateNewTemplate, onRenameTemplate, onDuplicateTemplate, onArchiveTemplate, onRestoreTemplate, onDeleteTemplate, onUpdateUser, onLogout } = props;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [view, setView] = useState<'main' | 'archived' | 'settings' | 'profile'>('main');

    const handleRename = (id: string) => {
        const newName = prompt('Ingresa el nuevo nombre de la plantilla:');
        if (newName) {
            onRenameTemplate(id, newName);
        }
    };
    
    const renderView = () => {
        switch(view) {
            case 'main':
                return <TemplatesView 
                            templates={templates.filter(t => t.status === 'active')} 
                            onSelectTemplate={onSelectTemplate}
                            onCreateNewTemplate={onCreateNewTemplate}
                            onRename={handleRename}
                            onDuplicate={onDuplicateTemplate}
                            onArchive={onArchiveTemplate}
                            onDelete={onDeleteTemplate}
                        />;
            case 'archived':
                return <ArchivedView 
                            templates={templates.filter(t => t.status === 'archived')}
                            onSelectTemplate={onSelectTemplate}
                            onRestore={onRestoreTemplate}
                            onDelete={onDeleteTemplate}
                        />
            case 'settings':
                return <SettingsView onSetView={setView} templates={templates} />;
            case 'profile':
                return user ? <ProfileView user={user} onUpdateUser={onUpdateUser} /> : null;
            default:
                return null;
        }
    }
    
    return (
        <div className="flex h-screen bg-main text-main font-sans theme-night">
            <nav className="w-64 bg-panel border-r border-main flex flex-col p-4">
                <div className="flex items-center space-x-3 mb-8">
                    <img src="https://api.iconify.design/logos:google-gemini.svg" alt="Logo" className="h-8 w-8" />
                    <h1 className="text-xl font-bold text-main">DocuGen AI</h1>
                </div>
                <ul className="space-y-2">
                    <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('main');}} className={`flex items-center space-x-3 px-3 py-2 rounded-md font-semibold ${view === 'main' ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]' : 'text-subtle hover:bg-tertiary'}`}>
                            <DocumentIcon className="h-5 w-5" />
                            <span>Mis Plantillas</span>
                        </a>
                    </li>
                     <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('archived');}} className={`flex items-center space-x-3 px-3 py-2 rounded-md ${view === 'archived' ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]' : 'text-subtle hover:bg-tertiary'}`}>
                            <ArchiveBoxIcon className="h-5 w-5" />
                            <span>Archivados</span>
                        </a>
                    </li>
                </ul>
                <div className="mt-auto">
                    <a href="#" onClick={(e) => { e.preventDefault(); setView('settings');}} className={`flex items-center space-x-3 px-3 py-2 rounded-md ${view === 'settings' ? 'bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]' : 'text-subtle hover:bg-tertiary'}`}>
                        <CogIcon className="h-5 w-5" />
                        <span>Configuración</span>
                    </a>
                </div>
            </nav>

            <div className="flex-1 flex flex-col">
                <header className="bg-panel/80 backdrop-blur-sm border-b border-main p-4 flex items-center justify-between flex-shrink-0">
                    <div className="relative w-full max-w-md">
                        <SearchIcon className="h-5 w-5 text-subtle absolute top-1/2 left-3 -translate-y-1/2" />
                        <input type="text" placeholder="Buscar plantillas..." className="w-full pl-10 pr-4 py-2 bg-tertiary border border-main rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                    </div>
                    <div className="relative">
                        <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2 rounded-full hover:bg-tertiary" title="Perfil">
                            <UserCircleIcon className="h-8 w-8 text-subtle" />
                        </button>
                        {userMenuOpen && (
                            <div onMouseLeave={() => setUserMenuOpen(false)} className="absolute top-12 right-0 w-48 bg-panel border border-main rounded-md shadow-2xl z-20 animate-fade-in">
                                {user && <div className="p-3 border-b border-main">
                                    <p className="font-semibold text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-subtle truncate">{user.email}</p>
                                </div>}
                                <ul className="py-1 text-sm">
                                    <li onClick={() => { setView('profile'); setUserMenuOpen(false); }} className="px-3 py-1.5 hover:bg-tertiary cursor-pointer">Perfil</li>
                                    <li className="px-3 my-1 border-t border-main"></li>
                                    <li onClick={onLogout} className="px-3 py-1.5 hover:bg-tertiary flex items-center space-x-2 cursor-pointer">
                                        <ArrowRightOnRectangleIcon className="h-4 w-4"/><span>Cerrar Sesión</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;