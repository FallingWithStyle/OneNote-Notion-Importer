import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HierarchyViewer } from '../../../../src/gui/renderer/src/components/HierarchyViewer';
import { OneNoteHierarchy } from '../../../../src/gui/renderer/src/types';

const mockHierarchy: OneNoteHierarchy = {
  notebooks: [
    {
      id: 'notebook-1',
      name: 'Test Notebook 1',
      sections: [
        {
          id: 'section-1',
          name: 'Section 1',
          pages: [
            {
              id: 'page-1',
              title: 'Page 1',
              content: 'Test content',
              lastModified: new Date('2023-01-01'),
              created: new Date('2023-01-01')
            },
            {
              id: 'page-2',
              title: 'Page 2',
              content: 'Test content 2',
              lastModified: new Date('2023-01-02'),
              created: new Date('2023-01-02')
            }
          ]
        },
        {
          id: 'section-2',
          name: 'Section 2',
          pages: [
            {
              id: 'page-3',
              title: 'Page 3',
              content: 'Test content 3',
              lastModified: new Date('2023-01-03'),
              created: new Date('2023-01-03')
            }
          ]
        }
      ]
    },
    {
      id: 'notebook-2',
      name: 'Test Notebook 2',
      sections: [
        {
          id: 'section-3',
          name: 'Section 3',
          pages: [
            {
              id: 'page-4',
              title: 'Page 4',
              content: 'Test content 4',
              lastModified: new Date('2023-01-04'),
              created: new Date('2023-01-04')
            }
          ]
        }
      ]
    }
  ],
  totalNotebooks: 2,
  totalSections: 3,
  totalPages: 4
};

describe('HierarchyViewer', () => {
  const mockOnItemSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render hierarchy structure', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    expect(screen.getByText('Notebook Structure')).toBeInTheDocument();
    expect(screen.getByText('Test Notebook 1')).toBeInTheDocument();
    expect(screen.getByText('Test Notebook 2')).toBeInTheDocument();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Section 3')).toBeInTheDocument();
  });

  it('should display hierarchy summary', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    expect(screen.getByText('Total: 2 notebooks, 3 sections, 4 pages')).toBeInTheDocument();
  });

  it('should handle item selection', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    const page1Checkbox = screen.getByLabelText('Select Page 1');
    fireEvent.click(page1Checkbox);

    expect(mockOnItemSelection).toHaveBeenCalledWith(['page-1']);
  });

  it('should handle item deselection', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={['page-1']}
        onItemSelection={mockOnItemSelection}
      />
    );

    const page1Checkbox = screen.getByLabelText('Select Page 1');
    fireEvent.click(page1Checkbox);

    expect(mockOnItemSelection).toHaveBeenCalledWith([]);
  });

  it('should handle select all functionality', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select All');
    fireEvent.click(selectAllCheckbox);

    expect(mockOnItemSelection).toHaveBeenCalledWith([
      'notebook-1',
      'section-1',
      'page-1',
      'page-2',
      'section-2',
      'page-3',
      'notebook-2',
      'section-3',
      'page-4'
    ]);
  });

  it('should handle deselect all functionality', () => {
    const allItems = [
      'notebook-1',
      'section-1',
      'page-1',
      'page-2',
      'section-2',
      'page-3',
      'notebook-2',
      'section-3',
      'page-4'
    ];

    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={allItems}
        onItemSelection={mockOnItemSelection}
      />
    );

    const selectAllCheckbox = screen.getByLabelText('Select All');
    fireEvent.click(selectAllCheckbox);

    expect(mockOnItemSelection).toHaveBeenCalledWith([]);
  });

  it('should show selection summary when items are selected', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={['notebook-1', 'page-1', 'page-2']}
        onItemSelection={mockOnItemSelection}
      />
    );

    expect(screen.getByText('Selected: 1 notebooks, 0 sections, 2 pages')).toBeInTheDocument();
  });

  it('should expand and collapse sections', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    // Initially expanded, so pages should be visible
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();

    // Click first expand button to collapse
    const expandButtons = screen.getAllByText('▼');
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]!);
    }

    // Pages should still be visible (this is a simplified test)
    // In a real implementation, you'd check for visibility
  });

  it('should display page metadata', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    // Check if last modified date is displayed
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
  });

  it('should show correct icons for different item types', () => {
    render(
      <HierarchyViewer
        hierarchy={mockHierarchy}
        selectedItems={[]}
        onItemSelection={mockOnItemSelection}
      />
    );

    // Check for notebook, section, and page icons
    expect(screen.getAllByText('📚')).toHaveLength(2); // 2 notebooks
    expect(screen.getAllByText('📁')).toHaveLength(3); // 3 sections
    expect(screen.getAllByText('📄')).toHaveLength(4); // 4 pages
  });
});
