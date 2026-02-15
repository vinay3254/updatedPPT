import React, { useState, useEffect } from 'react';
import { usePresentation } from '../contexts/PresentationContext';

const TextFormattingRibbon = ({ selectedElement, onFormatChange, applyFormatToSelection }) => {
  const { slides, currentSlide, updateSlide } = usePresentation();
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('12');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [selectedList, setSelectedList] = useState('bullet');
  const [alignment, setAlignment] = useState('left');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [savedSelection, setSavedSelection] = useState(null);

  // Track text selection changes within contentEditable areas
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setHasTextSelection(false);
        return;
      }
      
      const selectedText = selection.toString();
      if (selectedText.length === 0) {
        setHasTextSelection(false);
        return;
      }
      
      // Save the selection range when there's a valid selection
      if (selection.rangeCount > 0) {
        setSavedSelection(selection.getRangeAt(0));
      }
      
      // Check if selection is within a contentEditable element
      let node = selection.anchorNode;
      while (node && node.nodeType !== Node.DOCUMENT_NODE) {
        if (node.contentEditable === 'true' || node.isContentEditable) {
          setHasTextSelection(true);
          return;
        }
        node = node.parentElement || node.parentNode;
      }
      
      // Also check if selection is within the slide editor area
      const editorArea = document.querySelector('.editor-wrapper, .slide-canvas, [contenteditable]');
      if (editorArea && editorArea.contains(selection.anchorNode)) {
        setHasTextSelection(true);
        return;
      }
      
      setHasTextSelection(false);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Restore selection when needed
  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelection);
      return true;
    }
    return false;
  };

  // Microsoft PowerPoint style color palettes
  const themeTextColors = [
    ['#000000', '#44546A', '#5B9BD5', '#0070C0', '#002060', '#7030A0'],
    ['#FFFFFF', '#D9D9D9', '#FFC000', '#ED7D31', '#A5A5A5', '#3F3F3F'],
    ['#FF0000', '#00B0F0', '#92D050', '#FFFF00', '#E26B0A', '#9BBB59']
  ];

  const standardTextColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF6600', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
    '#800000', '#808000', '#008000', '#008080', '#000080', '#800080'
  ];

  const themeHighlightColors = [
    ['#FFFF00', '#FFFC99', '#FFF400', '#FFC000', '#F7D062', '#F39F3A'],
    ['#E2F1A1', '#D5E8A5', '#9BD18B', '#5B9BD5', '#4472C4', '#2E75B6'],
    ['#F2DCDB', '#E7B8B7', '#D9D9D9', '#BFBFBF', '#8EA9DB', '#5C7CA3']
  ];

  const standardHighlightColors = [
    '#FFFFFF', '#000000', '#FF0000', '#FF6600', '#FFFF00', '#00FF00',
    '#00FFFF', '#0000FF', '#800000', '#808000', '#008000', '#008080'
  ];

  const fontFamilies = [
    'Arial', 'Calibri', 'Times New Roman', 'Helvetica', 'Georgia', 
    'Verdana', 'Tahoma', 'Comic Sans MS', 'Impact', 'Trebuchet MS'
  ];

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

  // Keyboard shortcuts for text formatting
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle Ctrl/Cmd shortcuts, don't interfere with normal typing
      if (!(e.ctrlKey || e.metaKey)) return;
      
      if (['b', 'B'].includes(e.key)) {
        e.preventDefault();
        document.execCommand('bold', false, null);
        setIsBold(document.queryCommandState('bold'));
      } else if (['i', 'I'].includes(e.key)) {
        e.preventDefault();
        document.execCommand('italic', false, null);
        setIsItalic(document.queryCommandState('italic'));
      } else if (['u', 'U'].includes(e.key)) {
        e.preventDefault();
        document.execCommand('underline', false, null);
        setIsUnderline(document.queryCommandState('underline'));
      } else if (['l', 'L'].includes(e.key)) {
        e.preventDefault();
        handleAlignmentChange('left');
      } else if (['e', 'E'].includes(e.key)) {
        e.preventDefault();
        handleAlignmentChange('center');
      } else if (['r', 'R'].includes(e.key)) {
        e.preventDefault();
        handleAlignmentChange('right');
      } else if (['j', 'J'].includes(e.key)) {
        e.preventDefault();
        handleAlignmentChange('justify');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFontFamilyChange = (family) => {
    setFontFamily(family);
    applyFormatToSelection?.('fontName', family);
    onFormatChange?.({ fontFamily: family });
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    applyFormatToSelection?.('fontSize', size);
    onFormatChange?.({ fontSize: `${size}px` });
  };

  const handleUpperCase = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.toString().toUpperCase();
      const textNode = document.createTextNode(text);
      range.deleteContents();
      range.insertNode(textNode);
      
      // Restore selection
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  };

  const handleLowerCase = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.toString().toLowerCase();
      const textNode = document.createTextNode(text);
      range.deleteContents();
      range.insertNode(textNode);
      
      // Restore selection
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  };

  const toggleBold = (e) => {
    e.preventDefault();
    document.execCommand('bold', false, null);
    setIsBold(document.queryCommandState('bold'));
  };

  const toggleItalic = (e) => {
    e.preventDefault();
    document.execCommand('italic', false, null);
    setIsItalic(document.queryCommandState('italic'));
  };

  const toggleUnderline = (e) => {
    e.preventDefault();
    document.execCommand('underline', false, null);
    setIsUnderline(document.queryCommandState('underline'));
  };

  const toggleStrikethrough = (e) => {
    e.preventDefault();
    document.execCommand('strikeThrough', false, null);
    setIsStrikethrough(document.queryCommandState('strikeThrough'));
  };

  const handleListChange = (listType) => {
    setSelectedList(listType);
    setShowListDropdown(false);
    
    // Restore selection before applying formatting
    if (!restoreSelection()) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    // Find contentEditable element
    let editableElement = selection.focusNode;
    while (editableElement && editableElement.nodeType !== Node.ELEMENT_NODE) {
      editableElement = editableElement.parentElement || editableElement.parentNode;
    }
    
    // Check for contentEditable using both methods
    while (editableElement && editableElement !== document.body) {
      if (editableElement.contentEditable === 'true' || editableElement.isContentEditable) {
        break;
      }
      editableElement = editableElement.parentElement || editableElement.parentNode;
    }
    
    if (!editableElement || editableElement === document.body) return;

    // Use execCommand for better compatibility
    if (listType === 'bullet') {
      document.execCommand('insertUnorderedList', false, null);
    } else if (listType === 'numeric') {
      document.execCommand('insertOrderedList', false, null);
    } else if (listType === 'alphabetic') {
      document.execCommand('insertOrderedList', false, null);
      // Change to alphabetic
      const lists = editableElement.querySelectorAll('ol');
      lists.forEach(list => list.style.listStyleType = 'upper-alpha');
    } else {
      // Custom list types (stars, arrows)
      const text = selection.toString() || editableElement.textContent;
      const lines = text.split('\n').filter(l => l.trim());
      const symbol = listType === 'stars' ? '★' : '→';
      const formatted = lines.map(l => `${symbol} ${l.replace(/^[•★→\d+A-Z]\.?\s*/, '')}`).join('\n');
      editableElement.textContent = formatted;
    }
  };

  const handleAlignmentChange = (align) => {
    // Restore selection before applying formatting
    if (!restoreSelection()) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Find contentEditable or apply to focused element
    let element = selection.focusNode;
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentElement || element.parentNode;
    }
    
    // Check for contentEditable using both methods
    while (element && element !== document.body) {
      if (element.contentEditable === 'true' || element.isContentEditable) {
        // Apply alignment using style for better control
        element.style.textAlign = align;
        setAlignment(align);
        return;
      }
      element = element.parentElement || element.parentNode;
    }

    // Fallback to execCommand
    const cmd = align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : 'justifyFull';
    document.execCommand(cmd, false, null);
    setAlignment(align);
  };

  const handleTextColor = (color) => {
    if (color) {
      applyFormatToSelection?.('foreColor', color);
    }
  };

  const handleHighlightColor = (color) => {
    if (color) {
      applyFormatToSelection?.('backColor', color);
    }
  };

  const handleInsertElement = (elementType) => {
    if (elementType === 'image') {
      handleImageUpload();
      return;
    }
    
    if (elementType === 'chart') {
      handleChartSelection();
      return;
    }
    
    if (elementType === 'table') {
      handleTableCreation();
      return;
    }
    
    const slide = slides[currentSlide];
    const elements = slide.elements || [];
    
    const newElement = {
      id: Date.now(),
      type: elementType,
      x: 100,
      y: 100,
      width: elementType === 'textbox' ? 200 : 250,
      height: elementType === 'textbox' ? 100 : 150,
      content: elementType === 'textbox' ? 'New text' : elementType === 'equation' ? 'E = mc²' : '',
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#000000',
      shapeType: elementType === 'shape' ? 'rectangle' : undefined,
      fill: elementType === 'shape' ? '#3B82F6' : undefined,
      stroke: elementType === 'shape' ? '#1E40AF' : undefined,
      strokeWidth: elementType === 'shape' ? 2 : undefined
    };
    
    const updatedElements = [...elements, newElement];
    updateSlide(currentSlide, { elements: updatedElements });
  };

  const handleTableCreation = () => {
    const rows = prompt('Enter number of rows (1-10):') || '3';
    const cols = prompt('Enter number of columns (1-10):') || '3';
    
    const numRows = Math.min(Math.max(parseInt(rows), 1), 10);
    const numCols = Math.min(Math.max(parseInt(cols), 1), 10);
    
    const slide = slides[currentSlide];
    const elements = slide.elements || [];
    
    const newElement = {
      id: Date.now(),
      type: 'table',
      x: 100,
      y: 100,
      width: numCols * 80,
      height: numRows * 40,
      rows: numRows,
      cols: numCols,
      data: Array(numRows).fill().map(() => Array(numCols).fill('Cell'))
    };
    
    const updatedElements = [...elements, newElement];
    updateSlide(currentSlide, { elements: updatedElements });
  };

  const handleChartSelection = () => {
    const chartType = prompt('Select chart type:\n1. Pie Chart\n2. Doughnut Chart\n3. Bar Chart\n4. Line Chart\n\nEnter 1, 2, 3, or 4:');
    
    const chartTypes = {
      '1': 'pie',
      '2': 'doughnut', 
      '3': 'bar',
      '4': 'line'
    };
    
    const selectedType = chartTypes[chartType] || 'pie';
    
    const slide = slides[currentSlide];
    const elements = slide.elements || [];
    
    const newElement = {
      id: Date.now(),
      type: 'chart',
      chartType: selectedType,
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Sample Data',
          color: '#3B82F6',
          data: [30, 45, 60, 40]
        }]
      },
      options: { legend: true, dataLabels: true },
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      title: 'Sample Chart'
    };
    
    const updatedElements = [...elements, newElement];
    updateSlide(currentSlide, { elements: updatedElements });
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const slide = slides[currentSlide];
          const elements = slide.elements || [];
          
          const newElement = {
            id: Date.now(),
            type: 'image',
            x: 100,
            y: 100,
            width: 300,
            height: 200,
            src: event.target.result,
            alt: file.name
          };
          
          const updatedElements = [...elements, newElement];
          updateSlide(currentSlide, { elements: updatedElements });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const listTypes = [
    { value: 'bullet', label: '• Bullet Points', icon: '•' },
    { value: 'numeric', label: '1. Numeric', icon: '1.' },
    { value: 'alphabetic', label: 'A. Alphabetic', icon: 'A.' },
    { value: 'stars', label: '★ Stars', icon: '★' },
    { value: 'arrows', label: '→ Arrows', icon: '→' }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-3 shadow-sm">
      <div className="flex items-start gap-4">

      </div>
    </div>
  );
};

export default TextFormattingRibbon;