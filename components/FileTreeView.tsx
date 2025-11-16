import React, { useState } from 'react';
import { DocumentIcon, FolderOpenIcon, ChevronDownIcon, ChevronRightIcon } from './icons';

export type FileNode = {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
};

export const buildFileTree = (files: File[]): FileNode[] => {
    const fileTree: FileNode = { name: 'root', path: '', type: 'folder', children: [] };

    for (const file of files) {
        if (!file.webkitRelativePath) continue;
        const pathParts = file.webkitRelativePath.split('/');
        let currentNode = fileTree;

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (!part) continue; 
            const isFile = i === pathParts.length - 1;
            let childNode = currentNode.children?.find(child => child.name === part);

            if (!childNode) {
                childNode = {
                    name: part,
                    path: pathParts.slice(0, i + 1).join('/'),
                    type: isFile ? 'file' : 'folder',
                    ...(isFile ? {} : { children: [] }),
                };
                currentNode.children?.push(childNode);
            }
            if (!isFile) {
                currentNode = childNode;
            }
        }
    }
    return fileTree.children || [];
};

interface TreeNodeProps {
    node: FileNode;
    selectedPaths: Set<string>;
    onSelectionChange: (path: string, selected: boolean, isFolder: boolean) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, selectedPaths, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = node.type === 'folder';
    const isSelected = selectedPaths.has(node.path);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) setIsOpen(!isOpen);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectionChange(node.path, e.target.checked, isFolder);
    };

    return (
        <div className="text-sm">
            <div className="flex items-center p-1 rounded hover:bg-tertiary">
                <input type="checkbox" checked={isSelected} onChange={handleCheckboxChange} className="mr-2 accent-indigo-500" />
                <div onClick={handleToggle} className="flex items-center cursor-pointer flex-grow">
                    {isFolder && (
                        <span className="w-4 h-4 mr-1">
                            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </span>
                    )}
                    <span className="mr-1">
                        {isFolder ? <FolderOpenIcon className="h-4 w-4 text-indigo-400" /> : <DocumentIcon className="h-4 w-4 text-subtle" />}
                    </span>
                    <span>{node.name}</span>
                </div>
            </div>
            {isFolder && isOpen && (
                <div className="ml-4 pl-2 border-l border-main">
                    {node.children?.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(child => (
                        <TreeNode key={child.path} node={child} selectedPaths={selectedPaths} onSelectionChange={onSelectionChange} />
                    ))}
                </div>
            )}
        </div>
    );
};


interface FileTreeViewProps {
    fileTree: FileNode[];
    selectedPaths: Set<string>;
    setSelectedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ fileTree, selectedPaths, setSelectedPaths }) => {

    const handleSelectionChange = (path: string, selected: boolean, isFolder: boolean) => {
        const newSelectedPaths = new Set(selectedPaths);
        const pathsToUpdate: string[] = [path];

        if (isFolder) {
            const findChildren = (node: FileNode) => {
                pathsToUpdate.push(node.path);
                node.children?.forEach(findChildren);
            };
            
            const findNode = (nodes: FileNode[], targetPath: string): FileNode | null => {
                for (const node of nodes) {
                    if (node.path === targetPath) return node;
                    if(node.children) {
                        const found = findNode(node.children, targetPath);
                        if(found) return found;
                    }
                }
                return null;
            };

            const startNode = findNode(fileTree, path);
            startNode?.children?.forEach(findChildren);
        }

        if (selected) {
            pathsToUpdate.forEach(p => newSelectedPaths.add(p));
        } else {
            pathsToUpdate.forEach(p => newSelectedPaths.delete(p));
        }
        
        // This is incomplete. We also need to handle parent state based on children.
        // For simplicity, this implementation only cascades selection down.
        // Deselecting a parent deselects all children. Selecting a parent selects all children.

        setSelectedPaths(newSelectedPaths);
    };

    return (
        <div>
            {fileTree.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).map(node => (
                <TreeNode key={node.path} node={node} selectedPaths={selectedPaths} onSelectionChange={handleSelectionChange} />
            ))}
        </div>
    );
};
