

import React, { useMemo } from 'react';
import { AiWidgetGenerationResponse, DocGenConfig, ProjectDocumentation } from '../types';
import { DocumentIcon, FolderOpenIcon, EyeIcon } from './icons';

type DocTreeNode = {
    name: string;
    type: 'folder' | 'file';
    path: string;
    code?: string;
    explanation?: string;
    children?: DocTreeNode[];
};

const parseDocWidgetsToTree = (documentationWidgets: AiWidgetGenerationResponse): DocTreeNode[] => {
    const root: DocTreeNode = { name: 'root', type: 'folder', path: '', children: [] };
    
    for (let i = 0; i < documentationWidgets.length; i++) {
        const widget = documentationWidgets[i];
        if (widget.type === 'Subtitle' && typeof widget.props?.content === 'string') {
            const path = widget.props.content;
            const parts = path.split('/');
            let currentNode = root;

            for(let j = 0; j < parts.length; j++) {
                const part = parts[j];
                const isFile = j === parts.length - 1;
                let childNode = currentNode.children?.find(c => c.name === part);

                if (!childNode) {
                    childNode = {
                        name: part,
                        path: parts.slice(0, j + 1).join('/'),
                        type: isFile ? 'file' : 'folder',
                        children: isFile ? undefined : [],
                    };
                    currentNode.children?.push(childNode);
                }
                
                if (isFile) {
                    const codeWidget = documentationWidgets[i + 1];
                    const explanationWidget = documentationWidgets[i + 2];
                    if (codeWidget?.type === 'Text') {
                        childNode.code = codeWidget.props?.content as string || '';
                    }
                    if (explanationWidget?.type === 'Text') {
                         childNode.explanation = explanationWidget.props?.content as string || '';
                    }
                }
                
                currentNode = childNode;
            }
        }
    }

    return root.children || [];
};

interface TreeNodeProps {
    node: DocTreeNode;
    config: DocGenConfig;
    onShowDetail?: (title: string, code: string, explanation: string, config: DocGenConfig) => void;
    onSelectPath?: (path: string) => void;
    selectedPath?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onShowDetail, config, onSelectPath, selectedPath }) => {
    const isSelected = node.path === selectedPath;

    return (
         <div className="text-sm">
            <div 
                onClick={() => onSelectPath?.(node.path)}
                className={`flex items-center p-1 rounded group transition-colors ${onSelectPath ? 'cursor-pointer hover:bg-tertiary' : ''} ${isSelected ? 'bg-indigo-500/20' : ''}`}
            >
                <span className="mr-1">
                    {node.type === 'folder' ? <FolderOpenIcon className="h-4 w-4 text-indigo-400" /> : <DocumentIcon className="h-4 w-4 text-subtle" />}
                </span>
                <span className="flex-grow">{node.name}</span>
                {node.type === 'file' && onShowDetail && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShowDetail(node.path, node.code || '', node.explanation || '', config); }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-panel"
                        title={`Ver detalles de ${node.name}`}
                    >
                        <EyeIcon className="h-4 w-4 text-indigo-500" />
                    </button>
                )}
            </div>
            {node.children && (
                <div className="ml-4 pl-2 border-l border-main">
                    {node.children.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(child => (
                        <TreeNode 
                            key={child.path} 
                            node={child} 
                            onShowDetail={onShowDetail} 
                            config={config} 
                            onSelectPath={onSelectPath}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface DocumentationTreeViewProps {
    documentation: ProjectDocumentation;
    onShowDetail?: (title: string, code: string, explanation: string, config: DocGenConfig) => void;
    onSelectPath?: (path: string) => void;
    selectedPath?: string;
}

export const DocumentationTreeView: React.FC<DocumentationTreeViewProps> = (props) => {
    const { documentation, onShowDetail, onSelectPath, selectedPath } = props;
    const fileTree = useMemo(() => parseDocWidgetsToTree(documentation.widgets), [documentation.widgets]);

    return (
        <div>
             {fileTree.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(node => (
                <TreeNode 
                    key={node.path} 
                    node={node} 
                    onShowDetail={onShowDetail} 
                    config={documentation.config} 
                    onSelectPath={onSelectPath}
                    selectedPath={selectedPath}
                />
            ))}
        </div>
    );
};