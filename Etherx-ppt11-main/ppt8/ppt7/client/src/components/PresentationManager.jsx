import React, { useState, useEffect } from 'react';
import { usePresentation } from '../contexts/PresentationContext';
import { saveToLocal, loadFromLocal, listLocalPresentations } from '../utils/cloudStorage';
import { exportToJSON, importFromJSON } from '../utils/exportUtils';

const PresentationManager = ({ onClose, onLoadPresentation }) => {
  const { slides, setSlides } = usePresentation();
  const [presentations, setPresentations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState(['Personal', 'Work', 'Templates']);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = () => {
    const localPresentations = listLocalPresentations();
    const presentationsWithFolders = localPresentations.map(p => ({
      ...p,
      folder: p.folder || 'Personal',
      slideCount: 0,
      thumbnail: null
    }));
    setPresentations(presentationsWithFolders);
  };

  const handleSavePresentation = () => {
    const name = prompt('Enter presentation name:');
    if (name) {
      try {
        const presentationData = {
          name,
          slides,
          folder: selectedFolder === 'all' ? 'Personal' : selectedFolder,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        };
        saveToLocal(presentationData, name);
        loadPresentations();
        alert('Presentation saved successfully!');
      } catch (error) {
        alert('Failed to save presentation: ' + error.message);
      }
    }
  };

  const handleLoadPresentation = (filename) => {
    try {
      const data = loadFromLocal(filename);
      if (data && data.slides) {
        setSlides(data.slides);
        onLoadPresentation?.(data);
        onClose();
      }
    } catch (error) {
      alert('Failed to load presentation: ' + error.message);
    }
  };

  const handleDeletePresentation = (filename) => {
    if (confirm('Are you sure you want to delete this presentation?')) {
      try {
        const saved = JSON.parse(localStorage.getItem('savedPresentations') || '{}');
        delete saved[filename];
        localStorage.setItem('savedPresentations', JSON.stringify(saved));
        loadPresentations();
      } catch (error) {
        alert('Failed to delete presentation: ' + error.message);
      }
    }
  };

  const handleDuplicatePresentation = (filename) => {
    try {
      const data = loadFromLocal(filename);
      if (data) {
        const newName = `${filename} - Copy`;
        saveToLocal(data, newName);
        loadPresentations();
      }
    } catch (error) {
      alert('Failed to duplicate presentation: ' + error.message);
    }
  };

  const createFolder = () => {
    if (newFolderName.trim()) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const filteredPresentations = presentations.filter(p => {
    const matchesSearch = p.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || p.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const templates = [
    { name: 'Business Pitch', slides: 8, icon: '💼' },
    { name: 'Project Report', slides: 12, icon: '📊' },
    { name: 'Educational', slides: 15, icon: '🎓' },
    { name: 'Marketing', slides: 10, icon: '📈' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="panel w-4/5 max-w-6xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(240,165,0,0.08)' }}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold nav-title">Presentation Manager</h2>
            <button onClick={onClose} className="toolbar-btn">✕</button>
          </div>
          
          {/* Search and Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search presentations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="form-select"
              >
                <option value="all">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowNewFolder(true)} className="btn-secondary px-3 py-2">📁 New Folder</button>
              <button onClick={handleSavePresentation} className="btn-primary px-3 py-2">💾 Save Current</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 sidebar p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-300 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm btn-secondary">📄 New Presentation</button>
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json,.pptx,.ppt';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              if (file.name.endsWith('.json')) {
                                const data = JSON.parse(e.target.result);
                                if (data.slides) {
                                  setSlides(data.slides);
                                  onLoadPresentation?.(data);
                                  onClose();
                                }
                              } else {
                                alert('PowerPoint files (.pptx/.ppt) import coming soon!');
                              }
                            } catch (error) {
                              alert('Failed to import file: ' + error.message);
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full text-left px-3 py-2 text-sm btn-secondary"
                  >
                    📂 Import File
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-300 mb-2">Templates</h3>
                <div className="space-y-2">
                  {templates.map(template => (
                    <button
                      key={template.name}
                      className="w-full text-left px-3 py-2 text-sm btn-secondary"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{template.icon}</span>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-neutral-400">{template.slides} slides</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPresentations.map((presentation) => (
                <div
                  key={presentation.filename}
                  className="panel p-4 hover:glow transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-full h-32 bg-transparent rounded-md mb-3 flex items-center justify-center">
                    <span className="text-4xl">📊</span>
                  </div>
                  
                  {/* Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-white truncate">
                      {presentation.filename}
                    </h4>
                    <div className="text-xs text-neutral-400">
                      <div>Modified: {new Date(presentation.timestamp).toLocaleDateString()}</div>
                      <div>Folder: {presentation.folder}</div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button onClick={() => handleLoadPresentation(presentation.filename)} className="btn-primary px-2 py-1 text-xs">Open</button>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDuplicatePresentation(presentation.filename)}
                        className="p-1 text-neutral-300 hover:text-white"
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDeletePresentation(presentation.filename)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPresentations.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">📁</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No presentations found matching your search.' : 'No presentations found.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Folder Modal */}
        {showNewFolder && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80">
              <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white mb-4"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewFolder(false)}
                  className="px-3 py-2 text-sm bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={createFolder}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationManager;