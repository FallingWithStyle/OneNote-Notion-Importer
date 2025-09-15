import React, { useState } from 'react';
import { OneNoteHierarchy, OneNoteNotebook, OneNoteSection, OneNotePage } from '../types';

interface HierarchyViewerProps {
  hierarchy: OneNoteHierarchy;
  selectedItems: string[];
  onItemSelection: (itemIds: string[]) => void;
}

interface HierarchyItemProps {
  item: OneNoteNotebook | OneNoteSection | OneNotePage;
  type: 'notebook' | 'section' | 'page';
  level: number;
  selectedItems: string[];
  onToggle: (itemId: string) => void;
}

const HierarchyItem: React.FC<HierarchyItemProps> = ({ 
  item, 
  type, 
  level, 
  selectedItems, 
  onToggle 
}) => {
  const isSelected = selectedItems.includes(item.id);
  const hasChildren = 'sections' in item ? item.sections.length > 0 : 
                     'pages' in item ? item.pages.length > 0 : false;
  const [isExpanded, setIsExpanded] = useState(true);

  const getIcon = () => {
    switch (type) {
      case 'notebook': return '📚';
      case 'section': return '📁';
      case 'page': return '📄';
      default: return '📄';
    }
  };

  const handleToggle = () => {
    onToggle(item.id);
  };

  const handleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="hierarchy-item">
      <div 
        className="hierarchy-item-content"
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggle}
          aria-label={`Select ${'name' in item ? item.name : item.title}`}
        />
        
        {hasChildren && (
          <button
            className="expand-button"
            onClick={handleExpand}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              marginRight: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        <span className="hierarchy-icon">{getIcon()}</span>
        <span className="hierarchy-name">
          {'name' in item ? item.name : item.title}
        </span>
        
        {type === 'page' && 'lastModified' in item && item.lastModified && (
          <span className="hierarchy-meta">
            {new Date(item.lastModified).toLocaleDateString()}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="hierarchy-children">
          {'sections' in item && item.sections.map((section) => (
            <HierarchyItem
              key={section.id}
              item={section}
              type="section"
              level={level + 1}
              selectedItems={selectedItems}
              onToggle={onToggle}
            />
          ))}
          {'pages' in item && item.pages.map((page) => (
            <HierarchyItem
              key={page.id}
              item={page}
              type="page"
              level={level + 1}
              selectedItems={selectedItems}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyViewer: React.FC<HierarchyViewerProps> = ({
  hierarchy,
  selectedItems,
  onItemSelection
}) => {
  const [selectAll, setSelectAll] = useState(false);

  // Update selectAll state based on current selection
  React.useEffect(() => {
    const totalItems = hierarchy.notebooks.length + 
      hierarchy.notebooks.reduce((acc, nb) => acc + nb.sections.length + 
        nb.sections.reduce((sAcc, s) => sAcc + s.pages.length, 0), 0);
    setSelectAll(selectedItems.length === totalItems && totalItems > 0);
  }, [selectedItems, hierarchy]);

  const handleItemToggle = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onItemSelection(newSelection);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    if (newSelectAll) {
      const allIds: string[] = [];
      hierarchy.notebooks.forEach(notebook => {
        allIds.push(notebook.id);
        notebook.sections.forEach(section => {
          allIds.push(section.id);
          section.pages.forEach(page => {
            allIds.push(page.id);
          });
        });
      });
      onItemSelection(allIds);
    } else {
      onItemSelection([]);
    }
  };

  const getSelectionSummary = () => {
    const notebookCount = selectedItems.filter(id => 
      hierarchy.notebooks.some(nb => nb.id === id)
    ).length;
    const sectionCount = selectedItems.filter(id => 
      hierarchy.notebooks.some(nb => 
        nb.sections.some(s => s.id === id)
      )
    ).length;
    const pageCount = selectedItems.filter(id => 
      hierarchy.notebooks.some(nb => 
        nb.sections.some(s => 
          s.pages.some(p => p.id === id)
        )
      )
    ).length;

    return { notebookCount, sectionCount, pageCount };
  };

  const summary = getSelectionSummary();

  return (
    <div className="hierarchy-viewer">
      <div className="hierarchy-header">
        <h2>Notebook Structure</h2>
        <div className="hierarchy-controls">
          <label>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            Select All
          </label>
        </div>
      </div>

      <div className="hierarchy-summary">
        <p>
          Total: {hierarchy.totalNotebooks} notebooks, {hierarchy.totalSections} sections, {hierarchy.totalPages} pages
        </p>
        {selectedItems.length > 0 && (
          <p className="selection-summary">
            Selected: {summary.notebookCount} notebooks, {summary.sectionCount} sections, {summary.pageCount} pages
          </p>
        )}
      </div>

      <div className="hierarchy-tree">
        {hierarchy.notebooks.map((notebook) => (
          <HierarchyItem
            key={notebook.id}
            item={notebook}
            type="notebook"
            level={0}
            selectedItems={selectedItems}
            onToggle={handleItemToggle}
          />
        ))}
      </div>
    </div>
  );
};
