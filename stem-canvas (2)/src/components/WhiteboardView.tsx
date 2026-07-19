import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MousePointer, 
  PenTool, 
  Square, 
  Circle, 
  Type, 
  StickyNote, 
  Eraser, 
  Sparkles, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Send,
  Loader2,
  Sigma,
  Plus,
  ArrowUpRight,
  Hexagon,
  Bot,
  HelpCircle,
  HelpCircle as CheckCircle,
  Hand,
  Infinity,
  Calculator,
  Download,
  FileDown,
  X,
  RotateCw,
  RotateCcw,
  Link2,
  Lock,
  FileUp
} from 'lucide-react';
import { Board, BoardElement, Collaborator, ElementType, ShapeType } from '../types';
import MathKeypad from './MathKeypad';

interface WhiteboardViewProps {
  board: Board;
  onBack: () => void;
  onSaveBoard: (
    updatedElements: BoardElement[],
    title: string,
    extra?: { canvasMode?: 'normal' | 'unlimited'; totalPages?: number; currentPageIndex?: number }
  ) => void;
  role: 'teacher' | 'student';
  isRoleLocked?: boolean;
}

export default function WhiteboardView({ board, onBack, onSaveBoard, role, isRoleLocked = false }: WhiteboardViewProps) {
  const [elements, setElements] = useState<BoardElement[]>(board.elements);
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [tool, setTool] = useState<ElementType | 'select' | 'eraser' | 'shape'>('select');
  const [activeShape, setActiveShape] = useState<ShapeType>('rect');
  const [activeColor, setActiveColor] = useState('#003fb1'); // default Constructive Blue
  const [activeStickyColor, setActiveStickyColor] = useState<'yellow' | 'pink' | 'cyan' | 'green'>('yellow');
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // History states for Undo/Redo
  const [history, setHistory] = useState<BoardElement[][]>([board.elements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Synchronize local elements and pages with board updates from parent/localStorage/other tabs
  useEffect(() => {
    if (JSON.stringify(board.elements) !== JSON.stringify(elements)) {
      setElements(board.elements);
      setHistory([board.elements]);
      setHistoryIndex(0);
    }
  }, [board.elements]);

  useEffect(() => {
    if (board.title !== boardTitle) {
      setBoardTitle(board.title);
    }
  }, [board.title]);

  useEffect(() => {
    if (board.canvasMode && board.canvasMode !== canvasMode) {
      setCanvasMode(board.canvasMode);
    }
  }, [board.canvasMode]);

  useEffect(() => {
    if (board.totalPages !== undefined && board.totalPages !== totalPages) {
      setTotalPages(board.totalPages);
    }
  }, [board.totalPages]);

  useEffect(() => {
    if (board.currentPageIndex !== undefined && board.currentPageIndex !== currentPageIndex) {
      setCurrentPageIndex(board.currentPageIndex);
    }
  }, [board.currentPageIndex]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElementId, setCurrentElementId] = useState<string | null>(null);

  // Dragging state
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Math Keypad states
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [latexInput, setLatexInput] = useState('');

  // AI Assistant states
  const [aiPanelOpen, setAiPanelOpen] = useState(role === 'teacher');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDrawing, setAiDrawing] = useState(false);

  // Simulated live collaborative cursors (initially empty to remove John Doe and Sarah Miller mock cursors)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Canvas modes, zoom & pan states
  const BOARD_WIDTH = 1200;
  const BOARD_HEIGHT = 800;
  const [canvasMode, setCanvasMode] = useState<'unlimited' | 'normal'>(board.canvasMode || 'unlimited');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Book Pagination Mode (Multi-page system)
  const [currentPageIndex, setCurrentPageIndex] = useState(board.currentPageIndex !== undefined ? board.currentPageIndex : 0);
  const [totalPages, setTotalPages] = useState(() => {
    if (board.totalPages !== undefined) return board.totalPages;
    const maxPage = board.elements.reduce((max, el) => Math.max(max, el.pageIndex || 0), 0);
    return Math.max(1, maxPage + 1);
  });

  // Selected element for rotation, deletion, custom settings
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Resizing state for diagonal adjustments
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);

  // Scale snapping drawing state
  const [activeScaleElement, setActiveScaleElement] = useState<BoardElement | null>(null);
  const [snappedEdge, setSnappedEdge] = useState<string | null>(null);

  // Scroll wheel behavior and active math category states
  const [scrollBehavior, setScrollBehavior] = useState<'zoom' | 'pan'>('zoom');
  const [activeMathCategory, setActiveMathCategory] = useState<'geometry' | 'numbers' | 'fractions' | 'algebra' | 'probability'>('geometry');

  // Floating menus state
  const [isMathToolMenuOpen, setIsMathToolMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Color presets
  const colorPresets = [
    { name: 'Constructive Blue', hex: '#003fb1' },
    { name: 'Scientific Teal', hex: '#006a61' },
    { name: 'Math Violet', hex: '#6366f1' },
    { name: 'Carbon Grey', hex: '#474a4c' },
    { name: 'Coral Red', hex: '#ba1a1a' }
  ];

  // Simulated collaborative movement
  useEffect(() => {
    const timer = setInterval(() => {
      setCollaborators(prev => prev.map(c => ({
        ...c,
        x: Math.max(100, Math.min(780, c.x + (Math.random() - 0.5) * 35)),
        y: Math.max(100, Math.min(550, c.y + (Math.random() - 0.5) * 35))
      })));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fitToScreen = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // 32px padding on each side
    const availableWidth = width - 64;
    const availableHeight = height - 64;
    
    const scaleX = availableWidth / BOARD_WIDTH;
    const scaleY = availableHeight / BOARD_HEIGHT;
    
    // Scale down to fit cleanly; maximum zoom of 1.2x to prevent excessive magnification
    const newZoom = Math.max(0.15, Math.min(scaleX, scaleY, 1.2));
    
    // Center inside container
    const newPanX = (width - BOARD_WIDTH * newZoom) / 2;
    const newPanY = (height - BOARD_HEIGHT * newZoom) / 2;
    
    setZoom(Number(newZoom.toFixed(3)));
    setPanX(Math.round(newPanX));
    setPanY(Math.round(newPanY));
  };

  useEffect(() => {
    if (canvasMode === 'normal') {
      fitToScreen();
    } else {
      // Reset zoom/pan when entering unlimited mode for a clean starting slate
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }
  }, [canvasMode]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasMode === 'normal') {
        fitToScreen();
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [canvasMode]);

  // Sync elements back to parent
  const pushStateToHistory = (newElements: BoardElement[], extraPages?: number, extraPageIndex?: number) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newElements]);
    setHistoryIndex(updatedHistory.length);
    setElements(newElements);
    onSaveBoard(newElements, boardTitle, {
      canvasMode,
      totalPages: extraPages !== undefined ? extraPages : totalPages,
      currentPageIndex: extraPageIndex !== undefined ? extraPageIndex : currentPageIndex
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevElements = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setElements(prevElements);
      onSaveBoard(prevElements, boardTitle, { canvasMode, totalPages, currentPageIndex });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextElements = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setElements(nextElements);
      onSaveBoard(nextElements, boardTitle, { canvasMode, totalPages, currentPageIndex });
    }
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear this entire canvas?')) {
      pushStateToHistory([]);
    }
  };

  const handlePageChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < totalPages) {
      setCurrentPageIndex(newIndex);
      onSaveBoard(elements, boardTitle, { canvasMode, totalPages, currentPageIndex: newIndex });
    }
  };

  const handleAddPage = () => {
    if (totalPages >= 500) {
      alert("Book Mode limit reached: Maximum 500 pages allowed.");
      return;
    }
    const nextTotal = totalPages + 1;
    setTotalPages(nextTotal);
    setCurrentPageIndex(totalPages);
    onSaveBoard(elements, boardTitle, { canvasMode, totalPages: nextTotal, currentPageIndex: totalPages });
  };

  const handleDeletePage = () => {
    if (totalPages <= 1) {
      alert("Cannot delete the only page of a book.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Page ${currentPageIndex + 1} and all its drawings?`)) {
      return;
    }
    
    const updatedElements = elements
      .filter(el => (el.pageIndex || 0) !== currentPageIndex)
      .map(el => {
        const pIdx = el.pageIndex || 0;
        if (pIdx > currentPageIndex) {
          return { ...el, pageIndex: pIdx - 1 };
        }
        return el;
      });

    const nextTotal = totalPages - 1;
    const nextPageIndex = Math.max(0, currentPageIndex - 1);
    
    setTotalPages(nextTotal);
    setCurrentPageIndex(nextPageIndex);
    pushStateToHistory(updatedElements, nextTotal, nextPageIndex);
  };

  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('pdfjsLib not found on window after script load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load PDF.js script from CDN'));
      };
      document.head.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfUploading(true);
    try {
      // 1. Load pdfjs-dist
      const pdfjsLib = await loadPdfJs();

      // 2. Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // 3. Load PDF Document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      if (numPages === 0) {
        alert('The uploaded PDF has no pages.');
        setIsPdfUploading(false);
        return;
      }

      // Check 500-page limit
      if (totalPages + numPages > 500) {
        alert(`Cannot add ${numPages} pages. Max limit of 500 pages exceeded. (Current total pages: ${totalPages})`);
        setIsPdfUploading(false);
        return;
      }

      // Confirm with user if adding many pages
      if (numPages > 10) {
        const confirmed = window.confirm(`This PDF has ${numPages} pages. Processing might take a moment. Proceed?`);
        if (!confirmed) {
          setIsPdfUploading(false);
          return;
        }
      }

      // Ensure canvas mode is 'normal' (Book Mode) since they want each page into a whiteboard page like a real book
      let currentMode = canvasMode;
      if (canvasMode !== 'normal') {
        const switchMode = window.confirm("PDF Book uploading requires Book Mode. Switch to Book Mode now?");
        if (switchMode) {
          setCanvasMode('normal');
          currentMode = 'normal';
        } else {
          setIsPdfUploading(false);
          return;
        }
      }

      // 4. Render each page
      const newElements: BoardElement[] = [...elements];
      let pageIndexToInsert = currentPageIndex;

      let newTotalPages = totalPages;

      for (let i = 0; i < numPages; i++) {
        const pdfPageNumber = i + 1;
        const targetPageIndex = pageIndexToInsert + i;

        // If targetPageIndex is beyond our current totalPages, we expand the book!
        if (targetPageIndex >= newTotalPages) {
          newTotalPages++;
        }

        const page = await pdf.getPage(pdfPageNumber);
        
        // We want high quality but reasonable size. Let's render at scale = 1.8.
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get 2D context from canvas');
        }

        // Fill background white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');

        // Center on 1200x800 board
        const scaleX = 1100 / viewport.width;
        const scaleY = 740 / viewport.height;
        const fitScale = Math.min(scaleX, scaleY, 1); // don't scale up past original size
        const imgWidth = Math.round(viewport.width * fitScale);
        const imgHeight = Math.round(viewport.height * fitScale);
        const x = Math.round((1200 - imgWidth) / 2);
        const y = Math.round((800 - imgHeight) / 2);

        const imgElement: BoardElement = {
          id: `pdf-page-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'image',
          x,
          y,
          width: imgWidth,
          height: imgHeight,
          content: dataUrl,
          pageIndex: targetPageIndex
        };

        newElements.push(imgElement);
      }

      setTotalPages(newTotalPages);
      pushStateToHistory(newElements, newTotalPages, pageIndexToInsert);
      alert(`Successfully imported ${numPages} PDF pages!`);
    } catch (err) {
      console.error('Error rendering PDF:', err);
      alert('An error occurred while uploading and parsing the PDF. Make sure it is a valid PDF.');
    } finally {
      setIsPdfUploading(false);
      // Reset input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddMathTool = (toolType: BoardElement['toolType']) => {
    if (!toolType) return;
    const id = `math-${toolType}-${Date.now()}`;
    let width = 160;
    let height = 160;
    
    if (toolType === 'protractor') {
      width = 240;
      height = 120;
    } else if (toolType === 'ruler') {
      width = 300;
      height = 50;
    } else if (toolType === 'cartesian') {
      width = 320;
      height = 320;
    } else if (toolType === 'block-rod') {
      width = 24;
      height = 240;
    } else if (toolType === 'block-unit') {
      width = 24;
      height = 24;
    } else if (toolType === 'block-flat') {
      width = 240;
      height = 240;
    } else if (toolType === 'tangram-tri-lg') {
      width = 120;
      height = 120;
    } else if (toolType === 'tangram-tri-md') {
      width = 90;
      height = 90;
    } else if (toolType === 'tangram-tri-sm') {
      width = 60;
      height = 60;
    } else if (toolType === 'tangram-square') {
      width = 80;
      height = 80;
    } else if (toolType === 'tangram-para') {
      width = 120;
      height = 60;
    } else if (toolType === 'poly-pentagon' || toolType === 'poly-hexagon') {
      width = 100;
      height = 100;
    } else if (toolType === 'number-line') {
      width = 320;
      height = 80;
    } else if (toolType === 'fraction-bar') {
      width = 300;
      height = 100;
    } else if (toolType === 'fraction-circle') {
      width = 180;
      height = 210;
    } else if (toolType === 'balance-scale') {
      width = 240;
      height = 180;
    } else if (toolType === 'algebra-tile-x2') {
      width = 80;
      height = 80;
    } else if (toolType === 'algebra-tile-x') {
      width = 80;
      height = 30;
    } else if (toolType === 'algebra-tile-1') {
      width = 30;
      height = 30;
    } else if (toolType === 'coin-flip' || toolType === 'dice-roll' || toolType === 'spinner') {
      width = 120;
      height = 140;
    }
    
    // Center inside the whiteboard viewport
    const newEl: BoardElement = {
      id,
      type: 'math-tool',
      toolType,
      x: Math.round(BOARD_WIDTH / 2 - width / 2),
      y: Math.round(BOARD_HEIGHT / 2 - height / 2),
      width,
      height,
      angle: 0,
      pageIndex: currentPageIndex,
      strokeColor: activeColor,
      strokeWidth,
      plottedPoints: [],
      divisions: toolType === 'fraction-bar' ? 5 : toolType === 'fraction-circle' ? 6 : undefined,
      filledSegments: [],
      leftWeight: 0,
      rightWeight: 0,
      coinFace: 'Heads',
      coinHistory: [],
      diceValue: 5,
      diceHistory: [],
      spinnerAngle: 0,
      spinnerSector: 'Red',
      numberLineHighlights: []
    };
    
    pushStateToHistory([...elements, newEl]);
    setSelectedElementId(id);
    setTool('select');
  };

  const handleExportSvg = () => {
    if (!canvasRef.current) return;
    try {
      const svgClone = canvasRef.current.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', String(BOARD_WIDTH));
      svgClone.setAttribute('height', String(BOARD_HEIGHT));
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}-canvas-page-${currentPageIndex + 1}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } catch (err) {
      alert('Failed to export canvas as SVG.');
    }
  };

  const handleExportJson = () => {
    try {
      const exportData = {
        title: boardTitle,
        exportDate: new Date().toISOString(),
        totalPages,
        elements
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const jsonBlob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = jsonUrl;
      downloadLink.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}-board-data.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(jsonUrl);
    } catch (err) {
      alert('Failed to export board data.');
    }
  };

  // Helper to format/render basic LaTeX strings visually without MathJax crashes
  const renderLaTeXText = (latex: string) => {
    if (!latex) return '';
    // Basic substitution to render integrals, derivatives and fractions elegantly in the HTML/SVG
    let rendered = latex
      .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫_{$1}^{$2}')
      .replace(/\\int/g, '∫')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
      .replace(/\\ln/g, 'ln')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\sqrt/g, '√')
      .replace(/\\pi/g, 'π')
      .replace(/\\theta/g, 'θ')
      .replace(/\\sum/g, 'Σ')
      .replace(/\\quad/g, '  ')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\cdot/g, '·')
      .replace(/\\to/g, '→')
      .replace(/\\pm/g, '±')
      .replace(/\^2/g, '²')
      .replace(/\^n/g, 'ⁿ');
    return rendered;
  };

  // Helper to convert canvas-relative coordinates to element-local coordinates (rotated)
  const getLocalCoords = (canvasX: number, canvasY: number, el: BoardElement) => {
    const angleRad = ((el.angle || 0) * Math.PI) / 180;
    const dx = canvasX - el.x;
    const dy = canvasY - el.y;
    // Rotate backwards by -angle to get unrotated coordinates relative to top-left corner
    const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
    const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);
    return { x: localX, y: localY };
  };

  // Helper to check if a point is inside a rotated element's bounding box
  const isPointInsideRotatedElement = (canvasX: number, canvasY: number, el: BoardElement, buffer = 0) => {
    const local = getLocalCoords(canvasX, canvasY, el);
    return (
      local.x >= -buffer && 
      local.x <= el.width + buffer && 
      local.y >= -buffer && 
      local.y <= el.height + buffer
    );
  };

  // Helper to snap a point to the nearest edge of a scale/ruler/set square
  const getSnappedCoordsOnScale = (canvasX: number, canvasY: number, el: BoardElement, lockedEdge?: string | null) => {
    const local = getLocalCoords(canvasX, canvasY, el);
    let snappedLocal = { x: local.x, y: local.y };

    if (el.toolType === 'ruler') {
      const snapToTop = lockedEdge ? (lockedEdge === 'top') : (local.y < el.height / 2);
      snappedLocal.y = snapToTop ? 0 : el.height;
      snappedLocal.x = Math.max(0, Math.min(el.width, local.x));
    } else if (el.toolType?.startsWith('set-square')) {
      let activeEdge = lockedEdge;
      if (!activeEdge) {
        const distToLeft = Math.abs(local.x);
        const distToBottom = Math.abs(local.y - el.height);
        const k = el.height / el.width;
        const px = (local.x + k * local.y) / (1 + k * k);
        const py = k * px;
        const distToHypotenuse = Math.sqrt(Math.pow(local.x - px, 2) + Math.pow(local.y - py, 2));

        const minDist = Math.min(distToLeft, distToBottom, distToHypotenuse);
        if (minDist === distToLeft) activeEdge = 'left';
        else if (minDist === distToBottom) activeEdge = 'bottom';
        else activeEdge = 'hypotenuse';
      }

      if (activeEdge === 'left') {
        snappedLocal.x = 0;
        snappedLocal.y = Math.max(0, Math.min(el.height, local.y));
      } else if (activeEdge === 'bottom') {
        snappedLocal.y = el.height;
        snappedLocal.x = Math.max(0, Math.min(el.width, local.x));
      } else {
        const k = el.height / el.width;
        const px = (local.x + k * local.y) / (1 + k * k);
        const py = k * px;
        snappedLocal.x = Math.max(0, Math.min(el.width, px));
        snappedLocal.y = Math.max(0, Math.min(el.height, py));
      }
    }

    // Convert back to canvas coords
    const angleRad = ((el.angle || 0) * Math.PI) / 180;
    const rx = snappedLocal.x * Math.cos(angleRad) - snappedLocal.y * Math.sin(angleRad);
    const ry = snappedLocal.x * Math.sin(angleRad) + snappedLocal.y * Math.cos(angleRad);
    return {
      x: el.x + rx,
      y: el.y + ry
    };
  };

  // SVG Mouse handlers
  const getMouseCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: Math.round((clientX - panX) / zoom),
      y: Math.round((clientY - panY) / zoom)
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getMouseCoords(e);
    
    // Hand panning support
    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }
    
    if (tool === 'select') {
      // Find if clicked on any element to drag
      const clickedEl = [...elements].reverse().find(el => {
        if (el.type === 'drawing') return false;
        // Make sure it is on the current book page
        if ((el.pageIndex || 0) !== currentPageIndex) return false;
        return (
          coords.x >= el.x && 
          coords.x <= el.x + el.width && 
          coords.y >= el.y && 
          coords.y <= el.y + el.height
        );
      });

      if (clickedEl) {
        setDraggedElementId(clickedEl.id);
        setSelectedElementId(clickedEl.id);
        setDragOffset({
          x: coords.x - clickedEl.x,
          y: coords.y - clickedEl.y
        });
      } else {
        setSelectedElementId(null);
      }
      return;
    }

    if (tool === 'eraser') {
      const clickedEl = [...elements].reverse().find(el => {
        if ((el.pageIndex || 0) !== currentPageIndex) return false;
        return (
          coords.x >= el.x && 
          coords.x <= el.x + el.width && 
          coords.y >= el.y && 
          coords.y <= el.y + el.height
        );
      });
      if (clickedEl) {
        pushStateToHistory(elements.filter(el => el.id !== clickedEl.id));
        if (selectedElementId === clickedEl.id) {
          setSelectedElementId(null);
        }
      }
      return;
    }

    setIsDrawing(true);
    const newId = `el-${Date.now()}`;
    setCurrentElementId(newId);

    if (tool === 'pen') {
      const scaleEl = [...elements].reverse().find(el => {
        if (el.type !== 'math-tool' || (el.pageIndex || 0) !== currentPageIndex) return false;
        if (el.toolType !== 'ruler' && !el.toolType?.startsWith('set-square')) return false;
        // Check with a generous 30px snapping buffer!
        return isPointInsideRotatedElement(coords.x, coords.y, el, 30);
      });

      let startCoords = coords;
      if (scaleEl) {
        setActiveScaleElement(scaleEl);
        
        // Calculate and lock the nearest edge
        const local = getLocalCoords(coords.x, coords.y, scaleEl);
        let edge = 'top';
        if (scaleEl.toolType === 'ruler') {
          edge = local.y < scaleEl.height / 2 ? 'top' : 'bottom';
        } else if (scaleEl.toolType?.startsWith('set-square')) {
          const distToLeft = Math.abs(local.x);
          const distToBottom = Math.abs(local.y - scaleEl.height);
          const k = scaleEl.height / scaleEl.width;
          const px = (local.x + k * local.y) / (1 + k * k);
          const py = k * px;
          const distToHypotenuse = Math.sqrt(Math.pow(local.x - px, 2) + Math.pow(local.y - py, 2));

          const minDist = Math.min(distToLeft, distToBottom, distToHypotenuse);
          if (minDist === distToLeft) edge = 'left';
          else if (minDist === distToBottom) edge = 'bottom';
          else edge = 'hypotenuse';
        }
        setSnappedEdge(edge);
        startCoords = getSnappedCoordsOnScale(coords.x, coords.y, scaleEl, edge);
      } else {
        setActiveScaleElement(null);
        setSnappedEdge(null);
      }

      const newElement: BoardElement = {
        id: newId,
        type: 'drawing',
        x: startCoords.x,
        y: startCoords.y,
        width: 1,
        height: 1,
        strokeColor: activeColor,
        strokeWidth,
        points: [{ x: startCoords.x, y: startCoords.y }],
        pageIndex: currentPageIndex
      };
      setElements([...elements, newElement]);
    } else if (tool === 'shape') {
      const newElement: BoardElement = {
        id: newId,
        type: 'shape',
        shapeType: activeShape,
        x: coords.x,
        y: coords.y,
        width: 1,
        height: 1,
        strokeColor: activeColor,
        strokeWidth,
        pageIndex: currentPageIndex
      };
      setElements([...elements, newElement]);
    } else if (tool === 'sticky') {
      const newElement: BoardElement = {
        id: newId,
        type: 'sticky',
        x: coords.x - 75,
        y: coords.y - 75,
        width: 150,
        height: 150,
        content: 'Double-click to edit note',
        color: activeStickyColor,
        pageIndex: currentPageIndex
      };
      pushStateToHistory([...elements, newElement]);
      setSelectedElementId(newId);
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'text') {
      const newElement: BoardElement = {
        id: newId,
        type: 'text',
        x: coords.x,
        y: coords.y,
        width: 250,
        height: 45,
        content: 'Click to type text',
        isFormula: false,
        strokeColor: activeColor,
        pageIndex: currentPageIndex
      };
      pushStateToHistory([...elements, newElement]);
      setSelectedElementId(newId);
      setIsDrawing(false);
      setTool('select');
    } else if (tool === 'formula') {
      const newElement: BoardElement = {
        id: newId,
        type: 'text',
        x: coords.x,
        y: coords.y,
        width: 300,
        height: 60,
        content: '\\int x^2 dx = \\frac{x^3}{3} + C',
        isFormula: true,
        strokeColor: activeColor,
        pageIndex: currentPageIndex
      };
      pushStateToHistory([...elements, newElement]);
      setSelectedElementId(newId);
      setIsDrawing(false);
      setTool('select');
      
      // Instantly select for latex keyboard
      setSelectedTextId(newId);
      setLatexInput(newElement.content || '');
      setIsKeypadOpen(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    const coords = getMouseCoords(e);

    if (resizingElementId) {
      const updated = elements.map(el => {
        if (el.id === resizingElementId) {
          const local = getLocalCoords(coords.x, coords.y, el);
          return {
            ...el,
            width: Math.max(20, Math.round(local.x)),
            height: Math.max(20, Math.round(local.y))
          };
        }
        return el;
      });
      setElements(updated);
      return;
    }

    if (draggedElementId) {
      const updated = elements.map(el => {
        if (el.id === draggedElementId) {
          return {
            ...el,
            x: coords.x - dragOffset.x,
            y: coords.y - dragOffset.y
          };
        }
        return el;
      });
      setElements(updated);
      return;
    }

    if (!isDrawing || !currentElementId) return;

    if (tool === 'pen') {
      const updated = elements.map(el => {
        if (el.id === currentElementId) {
          if (activeScaleElement) {
            // Snapped straight line along scale edge
            const snappedCurrent = getSnappedCoordsOnScale(coords.x, coords.y, activeScaleElement, snappedEdge);
            return {
              ...el,
              points: [{ x: el.x, y: el.y }, snappedCurrent]
            };
          } else {
            // Normal freehand drawing
            const currentPoints = el.points || [];
            return {
              ...el,
              points: [...currentPoints, { x: coords.x, y: coords.y }]
            };
          }
        }
        return el;
      });
      setElements(updated);
    } else if (tool === 'shape') {
      const updated = elements.map(el => {
        if (el.id === currentElementId) {
          return {
            ...el,
            width: coords.x - el.x,
            height: coords.y - el.y
          };
        }
        return el;
      });
      setElements(updated);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (resizingElementId) {
      pushStateToHistory(elements);
      setResizingElementId(null);
      return;
    }

    if (draggedElementId) {
      pushStateToHistory(elements);
      setDraggedElementId(null);
      return;
    }

    if (isDrawing) {
      pushStateToHistory(elements);
      setIsDrawing(false);
      setCurrentElementId(null);
      setActiveScaleElement(null);
      setSnappedEdge(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    if (scrollBehavior === 'zoom') {
      // Zoom factor
      const zoomIntensity = 0.05;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Current point on the canvas before zoom
      const canvasMouseX = (mouseX - panX) / zoom;
      const canvasMouseY = (mouseY - panY) / zoom;

      // Calculate new zoom level
      const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * zoomIntensity * 0.01 * zoom));

      // Calculate new pans to keep the cursor centered at the same point after zoom
      const newPanX = mouseX - canvasMouseX * newZoom;
      const newPanY = mouseY - canvasMouseY * newZoom;

      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    } else {
      // Pan behavior (Scroll vertically, Shift+Scroll horizontally)
      if (e.shiftKey) {
        setPanX(prev => prev - e.deltaY);
      } else {
        setPanY(prev => prev - e.deltaY);
      }
    }
  };

  // Math keypad inserts
  const handleInsertSymbol = (symbol: string) => {
    setLatexInput(prev => prev + symbol);
    if (selectedTextId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedTextId) {
          return { ...el, content: latexInput + symbol };
        }
        return el;
      }));
    }
  };

  const handleLatexChange = (val: string) => {
    setLatexInput(val);
    if (selectedTextId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedTextId) {
          return { ...el, content: val };
        }
        return el;
      }));
    }
  };

  const handleConfirmLatex = () => {
    pushStateToHistory(elements);
    setIsKeypadOpen(false);
    setSelectedTextId(null);
  };

  // Double click sticky note or text to edit content directly
  const handleElementDoubleClick = (el: BoardElement) => {
    if (el.isFormula) {
      setSelectedTextId(el.id);
      setLatexInput(el.content || '');
      setIsKeypadOpen(true);
    } else {
      const newContent = window.prompt(`Edit content:`, el.content || '');
      if (newContent !== null) {
        pushStateToHistory(elements.map(item => {
          if (item.id === el.id) {
            return { ...item, content: newContent };
          }
          return item;
        }));
      }
    }
  };

  // Call server-side Gemini endpoints
  const handleSolveBoard = async () => {
    setAiLoading(true);
    setAiResponse('');
    try {
      const mathFormulas = elements
        .filter(el => el.type === 'text')
        .map(el => el.content)
        .join('\n');

      const userPrompt = mathFormulas 
        ? `Solve the following equations found on my blackboard step-by-step:\n\n${mathFormulas}`
        : `Provide a helpful lesson or summary about: "${boardTitle}"`;

      const res = await fetch('/api/ai/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAiResponse(data.text);
    } catch (err: any) {
      setAiResponse(`Failed to contact OpenAI co-pilot: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiResponse('');
    try {
      const queryText = aiQuery.trim();
      setAiQuery('');

      // Check if it's a DRAWING command
      const isDrawingRequest = /draw|sketch|plot|graph|diagram|hexagon|ring/i.test(queryText);

      if (isDrawingRequest) {
        setAiDrawing(true);
        const res = await fetch('/api/ai/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: queryText })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Inject elements generated by Gemini with a slight animation delay
        if (data.elements && data.elements.length > 0) {
          const generatedElements: BoardElement[] = data.elements.map((el: any, i: number) => ({
            id: `gemini-el-${Date.now()}-${i}`,
            type: el.type,
            shapeType: el.shapeType,
            x: el.x,
            y: el.y,
            width: el.width || 100,
            height: el.height || 100,
            content: el.content,
            color: el.color || 'yellow',
            strokeColor: el.strokeColor || '#006a61',
            strokeWidth: 3,
            isFormula: el.isFormula || false,
            label: el.label
          }));

          // Append to board
          pushStateToHistory([...elements, ...generatedElements]);
          setAiResponse(`🎨 OpenAI Co-pilot generated a drawing for you! Added **${generatedElements.length} elements** representing: "${data.title || queryText}".`);
        } else {
          setAiResponse(`OpenAI co-pilot didn't return drawing structures. Output: ${JSON.stringify(data)}`);
        }
        setAiDrawing(false);
      } else {
        // Standard textbook answer query
        const res = await fetch('/api/ai/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: queryText,
            context: elements.map(el => ({ type: el.type, content: el.content, label: el.label }))
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setAiResponse(data.text);
      }
    } catch (err: any) {
      setAiResponse(`Error communicating with OpenAI co-pilot: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${board.id}&role=student`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 3000);
    }).catch((err) => {
      console.error('Failed to copy invite link: ', err);
    });
  };

  return (
    <div className="min-h-screen bg-background dot-grid font-sans text-on-background select-none flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-outline-variant/20 bg-surface-container-lowest/90 backdrop-blur px-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            id="back-to-dash-btn"
            className="flex items-center gap-1 hover:bg-surface-container-low text-on-surface-variant hover:text-primary transition-all px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          
          <div className="h-5 w-px bg-outline-variant/40"></div>

          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={boardTitle}
              onChange={(e) => {
                setBoardTitle(e.target.value);
                onSaveBoard(elements, e.target.value);
              }}
              id="board-title-input"
              className="font-display font-bold text-base bg-transparent border-b border-transparent hover:border-outline-variant/50 focus:border-primary focus:outline-none px-1 text-on-surface w-64 truncate"
            />
            <span className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 rounded-md px-1.5 py-0.5 font-medium font-mono animate-pulse">
              ● Cloud Sync Live
            </span>
            {isRoleLocked && (
              <span className="text-[10px] bg-red-500/10 text-red-600 border border-red-500/20 rounded-md px-1.5 py-0.5 font-semibold font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-red-500" /> Student Mode (Locked)
              </span>
            )}

            {canvasMode === 'normal' && (
              <div className="flex items-center gap-1 bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-0.5 text-xs select-none">
                <button
                  type="button"
                  disabled={currentPageIndex === 0}
                  onClick={() => handlePageChange(currentPageIndex - 1)}
                  className={`p-1 rounded-lg hover:bg-surface-container-highest transition-colors ${currentPageIndex === 0 ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface'}`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-on-surface-variant min-w-[75px] text-center">
                  Page {currentPageIndex + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPageIndex === totalPages - 1}
                  onClick={() => handlePageChange(currentPageIndex + 1)}
                  className={`p-1 rounded-lg hover:bg-surface-container-highest transition-colors ${currentPageIndex === totalPages - 1 ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface'}`}
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {role === 'teacher' && (
                  <>
                    <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>
                    <button
                      type="button"
                      onClick={handleAddPage}
                      className="p-1 rounded-lg text-primary hover:bg-primary/10 hover:text-primary-container transition-colors"
                      title="Add New Book Page"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {totalPages > 1 && (
                      <button
                        type="button"
                        onClick={handleDeletePage}
                        className="p-1 rounded-lg text-error hover:bg-error/10 transition-colors"
                        title="Delete Current Book Page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action controls & Collaborative Avatars */}
        <div className="flex items-center gap-4">
          {/* Active Collaborators */}
          <div className="flex items-center -space-x-2">
            {collaborators.map(c => (
              <div 
                key={c.id} 
                className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-surface-container-lowest shadow-sm ${c.color}`}
                title={`${c.name} (Collaborating)`}
                id={`collaborator-avatar-${c.id}`}
              >
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-surface-container-low border border-outline-variant/30 text-[10px] text-outline font-semibold flex items-center justify-center shadow-sm">
              +1
            </div>
          </div>

          <div className="h-5 w-px bg-outline-variant/40"></div>

          {/* Undo/Redo & Utility buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={handleUndo} 
              disabled={historyIndex === 0}
              id="undo-canvas-btn"
              title="Undo Action"
              className={`p-2 rounded-lg transition-colors ${historyIndex === 0 ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex === history.length - 1}
              id="redo-canvas-btn"
              title="Redo Action"
              className={`p-2 rounded-lg transition-colors ${historyIndex === history.length - 1 ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleClearCanvas}
              id="clear-all-canvas-btn"
              title="Clear Blackboard"
              className="p-2 text-outline-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* PDF Upload Button */}
          <div className="h-5 w-px bg-outline-variant/40"></div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isPdfUploading
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20'
            }`}
            title="Upload a PDF and insert its pages into this whiteboard book"
            id="upload-pdf-btn"
          >
            {isPdfUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileUp className="w-3.5 h-3.5" />
            )}
            {isPdfUploading ? 'Processing PDF...' : 'Upload PDF'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePdfUpload}
            accept="application/pdf"
            className="hidden"
            id="pdf-upload-file-input"
          />

          {role === 'teacher' && (
            <>
              <div className="h-5 w-px bg-outline-variant/40"></div>
              <button 
                onClick={handleCopyInviteLink}
                id="copy-student-invite-btn"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${copiedInvite ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20'}`}
                title="Copy Invite Link that locks students to Student Mode"
              >
                <Link2 className="w-3.5 h-3.5" />
                {copiedInvite ? 'Link Copied!' : 'Invite Student'}
              </button>

              <div className="h-5 w-px bg-outline-variant/40"></div>
              <button 
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                id="toggle-ai-sidebar"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${aiPanelOpen ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-primary border-primary/20 hover:bg-primary/5'}`}
              >
                <Bot className="w-4 h-4" /> OpenAI Lesson Co-pilot
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Board Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Workspace Canvas Container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
          <svg
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            id="stem-blackboard-svg"
            className="w-full h-full glass-panel rounded-2xl shadow-sm border border-outline-variant/30 bg-surface-container-lowest/40 cursor-crosshair relative z-10"
          >
            {/* Draw Dot Grid */}
            <defs>
              <pattern id="dotpattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1" fill="#d5e3fc" />
              </pattern>
            </defs>

            {/* Transform Group containing the entire canvas */}
            <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
              
              {/* Underlay physical board backing for Normal mode */}
              {canvasMode === 'normal' && (
                <rect
                  x="0"
                  y="0"
                  width={BOARD_WIDTH}
                  height={BOARD_HEIGHT}
                  rx="16"
                  ry="16"
                  fill="#ffffff"
                  stroke="#003fb1"
                  strokeWidth="3"
                  strokeOpacity="0.1"
                  style={{ filter: 'drop-shadow(0px 8px 24px rgba(0, 0, 0, 0.04))' }}
                />
              )}

              {/* Dot Grid inside the active canvas area */}
              <rect
                width={canvasMode === 'normal' ? BOARD_WIDTH : 6000}
                height={canvasMode === 'normal' ? BOARD_HEIGHT : 6000}
                x={canvasMode === 'normal' ? 0 : -3000}
                y={canvasMode === 'normal' ? 0 : -3000}
                fill="url(#dotpattern)"
                rx={canvasMode === 'normal' ? 16 : 0}
              />

              {/* Render Board Elements */}
              {elements.filter(el => (el.pageIndex || 0) === currentPageIndex).map((el) => {
                if (el.type === 'drawing' && el.points) {
                  // Freehand drawings
                  const d = el.points
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');
                  return (
                    <path
                      key={el.id}
                      d={d}
                      fill="none"
                      stroke={el.strokeColor}
                      strokeWidth={el.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      id={`drawing-path-${el.id}`}
                    />
                  );
                }

                if (el.type === 'math-tool') {
                  const isSelected = el.id === selectedElementId;
                  
                  // Helper click handler for Cartesian point plotting
                  const handleCartesianDoubleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const coords = getMouseCoords(e);
                    const local = getLocalCoords(coords.x, coords.y, el);

                    // Grid center is at el.width/2, el.height/2. Each coordinate unit is el.width / 16 pixels
                    const gridX = Math.round((local.x - el.width / 2) / (el.width / 16));
                    const gridY = Math.round((el.height / 2 - local.y) / (el.height / 16));

                    if (Math.abs(gridX) <= 8 && Math.abs(gridY) <= 8) {
                      const currentPoints = el.plottedPoints || [];
                      const existsIdx = currentPoints.findIndex(pt => pt.x === gridX && pt.y === gridY);
                      let updatedPoints;
                      if (existsIdx > -1) {
                        updatedPoints = currentPoints.filter((_, idx) => idx !== existsIdx);
                      } else {
                        updatedPoints = [...currentPoints, { x: gridX, y: gridY }];
                      }
                      const updated = elements.map(item => item.id === el.id ? { ...item, plottedPoints: updatedPoints } : item);
                      pushStateToHistory(updated);
                    }
                  };

                  return (
                    <g
                      key={el.id}
                      id={`math-tool-g-${el.id}`}
                      transform={`translate(${el.x}, ${el.y}) rotate(${el.angle || 0})`}
                      className="cursor-move"
                      style={{ pointerEvents: 'auto' }}
                      onMouseDown={(e) => {
                        if (tool === 'select') {
                          setSelectedElementId(el.id);
                        }
                      }}
                      onDoubleClick={el.toolType === 'cartesian' ? handleCartesianDoubleClick : undefined}
                    >
                      {/* Render based on toolType */}
                      {(() => {
                        switch (el.toolType) {
                          case 'ruler':
                            return (
                              <>
                                <rect
                                  width={el.width}
                                  height={el.height}
                                  fill="rgba(240, 246, 255, 0.9)"
                                  stroke={isSelected ? '#003fb1' : '#6b7280'}
                                  strokeWidth={isSelected ? '2' : '1'}
                                  rx="4"
                                />
                                {Array.from({ length: Math.floor(el.width / 20) + 1 }).map((_, idx) => {
                                  const x = idx * 20;
                                  return (
                                    <g key={idx}>
                                      <line x1={x} y1={0} x2={x} y2={12} stroke="#1e40af" strokeWidth="1.5" />
                                      <text x={x} y={22} fontSize="8" textAnchor="middle" fill="#1e40af" fontFamily="monospace" fontWeight="bold" className="select-none pointer-events-none">
                                        {idx}
                                      </text>
                                      {idx < Math.floor(el.width / 20) && Array.from({ length: 9 }).map((_, subIdx) => {
                                        const subX = x + (subIdx + 1) * 2;
                                        const h = (subIdx + 1) === 5 ? 8 : 5;
                                        return (
                                          <line key={subIdx} x1={subX} y1={0} x2={subX} y2={h} stroke="#1e40af" strokeWidth="0.5" />
                                        );
                                      })}
                                    </g>
                                  );
                                })}
                                <text x={el.width / 2} y={38} fontSize="9" textAnchor="middle" fill="#1e40af" fontFamily="sans-serif" opacity="0.6" className="select-none pointer-events-none">
                                  Metric Scale (cm)
                                </text>
                              </>
                            );
                          case 'protractor':
                            return (
                              <>
                                <path
                                  d={`M 0,${el.height} A ${el.height},${el.height} 0 0,1 ${el.width},${el.height} Z`}
                                  fill="rgba(245, 243, 255, 0.9)"
                                  stroke={isSelected ? '#4f46e5' : '#6b7280'}
                                  strokeWidth={isSelected ? '2' : '1'}
                                />
                                <path
                                  d={`M ${el.width/2 - 30},${el.height} A 30,30 0 0,1 ${el.width/2 + 30},${el.height} Z`}
                                  fill="none"
                                  stroke="#4f46e5"
                                  strokeWidth="1"
                                  strokeOpacity="0.4"
                                />
                                <circle cx={el.width/2} cy={el.height} r="3.5" fill="#4f46e5" />
                                <line x1={el.width/2} y1={el.height - 10} x2={el.width/2} y2={el.height + 5} stroke="#4f46e5" strokeWidth="1" />
                                <line x1={el.width/2 - 10} y1={el.height} x2={el.width/2 + 10} y2={el.height} stroke="#4f46e5" strokeWidth="1" />

                                {Array.from({ length: 37 }).map((_, idx) => {
                                  const deg = idx * 5;
                                  const rad = (deg * Math.PI) / 180;
                                  const cos = Math.cos(rad);
                                  const sin = Math.sin(rad);
                                  
                                  const rOuter = el.height;
                                  const rInner = deg % 10 === 0 ? el.height - 15 : el.height - 8;
                                  
                                  const x1 = el.width/2 + rOuter * cos;
                                  const y1 = el.height - rOuter * sin;
                                  const x2 = el.width/2 + rInner * cos;
                                  const y2 = el.height - rInner * sin;
                                  
                                  return (
                                    <g key={idx}>
                                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4f46e5" strokeWidth={deg % 10 === 0 ? 1.5 : 0.8} />
                                      {deg % 10 === 0 && (
                                        <text
                                          x={el.width/2 + (rOuter - 24) * cos}
                                          y={el.height - (rOuter - 24) * sin + 3}
                                          fontSize="7.5"
                                          textAnchor="middle"
                                          fill="#4f46e5"
                                          fontFamily="monospace"
                                          fontWeight="bold"
                                          className="select-none pointer-events-none"
                                        >
                                          {180 - deg}
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                                <text x={el.width / 2} y={el.height - 15} fontSize="9" textAnchor="middle" fill="#4f46e5" fontFamily="sans-serif" opacity="0.6" className="select-none pointer-events-none">
                                  180° Protractor
                                </text>
                              </>
                            );
                          case 'set-square-45':
                            return (
                              <>
                                <polygon
                                  points={`0,${el.height} ${el.width},${el.height} 0,0`}
                                  fill="rgba(254, 242, 242, 0.9)"
                                  stroke={isSelected ? '#ba1a1a' : '#6b7280'}
                                  strokeWidth={isSelected ? '2' : '1'}
                                />
                                <polygon
                                  points={`15,${el.height - 15} ${el.width - 45},${el.height - 15} 15,30`}
                                  fill="none"
                                  stroke="#ba1a1a"
                                  strokeWidth="1"
                                  strokeOpacity="0.4"
                                />
                                {Array.from({ length: Math.floor(el.width / 15) }).map((_, idx) => {
                                  const x = idx * 15;
                                  return (
                                    <line key={idx} x1={x} y1={el.height} x2={x} y2={el.height - 6} stroke="#ba1a1a" strokeWidth="0.8" />
                                  );
                                })}
                                <text x={22} y={el.height - 25} fontSize="9.5" fill="#ba1a1a" fontFamily="sans-serif" fontWeight="bold" className="select-none pointer-events-none">
                                  45° Set Square
                                </text>
                              </>
                            );
                          case 'set-square-30':
                            return (
                              <>
                                <polygon
                                  points={`0,${el.height} ${el.width},${el.height} 0,0`}
                                  fill="rgba(240, 253, 250, 0.9)"
                                  stroke={isSelected ? '#006a61' : '#6b7280'}
                                  strokeWidth={isSelected ? '2' : '1'}
                                />
                                <polygon
                                  points={`15,${el.height - 15} ${el.width - 35},${el.height - 15} 15,30`}
                                  fill="none"
                                  stroke="#006a61"
                                  strokeWidth="1"
                                  strokeOpacity="0.4"
                                />
                                {Array.from({ length: Math.floor(el.width / 15) }).map((_, idx) => {
                                  const x = idx * 15;
                                  return (
                                    <line key={idx} x1={x} y1={el.height} x2={x} y2={el.height - 6} stroke="#006a61" strokeWidth="0.8" />
                                  );
                                })}
                                <text x={22} y={el.height - 25} fontSize="9.5" fill="#006a61" fontFamily="sans-serif" fontWeight="bold" className="select-none pointer-events-none">
                                  30°-60°-90° Set Square
                                </text>
                              </>
                            );
                          case 'cartesian':
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#ffffff" stroke={isSelected ? '#4f46e5' : '#474a4c'} strokeWidth={isSelected ? '2.5' : '1.5'} rx="8" style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.06))' }} />
                                
                                {/* Grid lines (scaled to el.width and el.height) */}
                                {Array.from({ length: 17 }).map((_, idx) => {
                                  const posX = (el.width / 16) * idx;
                                  const posY = (el.height / 16) * idx;
                                  return (
                                    <g key={idx}>
                                      {posX !== el.width/2 && (
                                        <>
                                          <line x1={posX} y1={0} x2={posX} y2={el.height} stroke="#f3f4f6" strokeWidth="1" />
                                          <line x1={0} y1={posY} x2={el.width} y2={posY} stroke="#f3f4f6" strokeWidth="1" />
                                        </>
                                      )}
                                    </g>
                                  );
                                })}

                                {/* X and Y Axes */}
                                <line x1={0} y1={el.height / 2} x2={el.width} y2={el.height / 2} stroke="#111827" strokeWidth="2.5" />
                                <line x1={el.width / 2} y1={0} x2={el.width / 2} y2={el.height} stroke="#111827" strokeWidth="2.5" />

                                {/* Axis arrowheads */}
                                <path d={`M ${el.width - 5},${el.height/2 - 4} L ${el.width},${el.height/2} L ${el.width - 5},${el.height/2 + 4} Z`} fill="#111827" />
                                <path d={`M ${el.width/2 - 4},5 L ${el.width/2},0 L ${el.width/2 + 4},5 Z`} fill="#111827" />

                                <text x={el.width - 15} y={el.height/2 - 10} fontSize="9" fontWeight="bold" fill="#111827" className="select-none">X</text>
                                <text x={el.width/2 + 10} y={15} fontSize="9" fontWeight="bold" fill="#111827" className="select-none">Y</text>

                                {/* Axis Numbers */}
                                {Array.from({ length: 15 }).map((_, idx) => {
                                  const val = idx - 7;
                                  if (val === 0) return null;
                                  const posX = el.width/2 + val * (el.width / 16);
                                  const posY = el.height/2 + val * (el.height / 16);
                                  return (
                                    <g key={idx}>
                                      <line x1={posX} y1={el.height/2 - 3} x2={posX} y2={el.height/2 + 3} stroke="#111827" strokeWidth="1.5" />
                                      <text x={posX} y={el.height/2 + 14} fontSize="7" textAnchor="middle" fill="#4b5563" fontWeight="bold" className="select-none">
                                        {val}
                                      </text>
                                      <line x1={el.width/2 - 3} y1={posY} x2={el.width/2 + 3} y2={posY} stroke="#111827" strokeWidth="1.5" />
                                      <text x={el.width/2 - 8} y={posY + 3} fontSize="7" textAnchor="end" fill="#4b5563" fontWeight="bold" className="select-none">
                                        {-val}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Plotted points */}
                                {(el.plottedPoints || []).map((pt, pIdx) => {
                                  const cx = el.width/2 + pt.x * (el.width / 16);
                                  const cy = el.height/2 - pt.y * (el.height / 16);
                                  const labelLetter = String.fromCharCode(65 + (pIdx % 26));
                                  return (
                                    <g key={pIdx}>
                                      <circle cx={cx} cy={cy} r="5" fill="#ba1a1a" stroke="#ffffff" strokeWidth="1.5" />
                                      <text
                                        x={cx + 8}
                                        y={cy - 5}
                                        fontSize="9.5"
                                        fontWeight="bold"
                                        fill="#ba1a1a"
                                        className="select-none pointer-events-none"
                                        style={{ textShadow: '1px 1px 0px white, -1px -1px 0px white' }}
                                      >
                                        {labelLetter}({pt.x}, {pt.y})
                                      </text>
                                    </g>
                                  );
                                })}
                                <text x={10} y={el.height - 10} fontSize="8" fill="#9ca3af" className="select-none pointer-events-none font-mono">
                                  Double-click to plot/unplot coordinates
                                </text>
                              </>
                            );
                          case 'block-unit':
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#f97316" stroke={isSelected ? '#c2410c' : '#7c2d12'} strokeWidth={isSelected ? '2' : '1'} rx="3" />
                                <rect x="3" y="3" width={Math.max(1, el.width - 6)} height={Math.max(1, el.height - 6)} fill="none" stroke="#ffedd5" strokeWidth="1" strokeOpacity="0.4" />
                                <text x={el.width/2} y={el.height/2 + 4} fontSize="8.5" textAnchor="middle" fill="#ffffff" fontWeight="bold" className="select-none pointer-events-none">1</text>
                              </>
                            );
                          case 'block-rod':
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#f97316" stroke={isSelected ? '#c2410c' : '#7c2d12'} strokeWidth={isSelected ? '2' : '1'} rx="4" />
                                {Array.from({ length: 10 }).map((_, idx) => (
                                  <g key={idx}>
                                    {idx > 0 && <line x1={0} y1={idx * (el.height/10)} x2={el.width} y2={idx * (el.height/10)} stroke="#7c2d12" strokeWidth="1" />}
                                    <rect x="3" y={idx * (el.height/10) + 3} width={Math.max(1, el.width - 6)} height={Math.max(1, (el.height/10) - 6)} fill="none" stroke="#ffedd5" strokeWidth="1" strokeOpacity="0.3" />
                                  </g>
                                ))}
                                <rect x={el.width/2 - 10} y={el.height/2 - 10} width="20" height="20" rx="3" fill="rgba(0,0,0,0.15)" />
                                <text x={el.width/2} y={el.height/2 + 4} fontSize="9" textAnchor="middle" fill="#ffffff" fontWeight="extrabold" className="select-none pointer-events-none">10</text>
                              </>
                            );
                          case 'block-flat':
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#f97316" stroke={isSelected ? '#c2410c' : '#7c2d12'} strokeWidth={isSelected ? '2' : '1.5'} rx="6" />
                                {Array.from({ length: 9 }).map((_, idx) => {
                                  const posX = (idx + 1) * (el.width / 10);
                                  const posY = (idx + 1) * (el.height / 10);
                                  return (
                                    <g key={idx}>
                                      <line x1={posX} y1={0} x2={posX} y2={el.height} stroke="#7c2d12" strokeWidth="1" />
                                      <line x1={0} y1={posY} x2={el.width} y2={posY} stroke="#7c2d12" strokeWidth="1" />
                                    </g>
                                  );
                                })}
                                <rect x={el.width/2 - 15} y={el.height/2 - 15} width="30" height="30" rx="6" fill="rgba(0,0,0,0.2)" />
                                <text x={el.width/2} y={el.height/2 + 4} fontSize="11.5" textAnchor="middle" fill="#ffffff" fontWeight="extrabold" className="select-none pointer-events-none">100</text>
                              </>
                            );

                          case 'tangram-tri-lg':
                          case 'tangram-tri-md':
                          case 'tangram-tri-sm':
                          case 'tangram-square':
                          case 'tangram-para': {
                            let pointsStr = "";
                            let fillStr = "#818cf8";
                            let strokeStr = "#4f46e5";
                            let labelName = "Tangram";
                            if (el.toolType === 'tangram-tri-lg') {
                              pointsStr = `0,0 ${el.width},0 ${el.width/2},${el.height}`;
                              fillStr = "rgba(129, 140, 248, 0.85)";
                              strokeStr = "#4f46e5";
                              labelName = "Large Triangle";
                            } else if (el.toolType === 'tangram-tri-md') {
                              pointsStr = `0,0 ${el.width},0 ${el.width/2},${el.height}`;
                              fillStr = "rgba(52, 211, 153, 0.85)";
                              strokeStr = "#059669";
                              labelName = "Med Triangle";
                            } else if (el.toolType === 'tangram-tri-sm') {
                              pointsStr = `0,0 ${el.width},0 ${el.width/2},${el.height}`;
                              fillStr = "rgba(244, 63, 94, 0.85)";
                              strokeStr = "#e11d48";
                              labelName = "Small Triangle";
                            } else if (el.toolType === 'tangram-square') {
                              pointsStr = `${el.width/2},0 ${el.width},${el.height/2} ${el.width/2},${el.height} 0,${el.height/2}`;
                              fillStr = "rgba(251, 191, 36, 0.85)";
                              strokeStr = "#d97706";
                              labelName = "Square";
                            } else if (el.toolType === 'tangram-para') {
                              pointsStr = `${el.width/3},0 ${el.width},0 ${el.width - el.width/3},${el.height} 0,${el.height}`;
                              fillStr = "rgba(45, 212, 191, 0.85)";
                              strokeStr = "#0d9488";
                              labelName = "Parallelogram";
                            }
                            return (
                              <>
                                <polygon
                                  points={pointsStr}
                                  fill={fillStr}
                                  stroke={isSelected ? '#003fb1' : strokeStr}
                                  strokeWidth="1.5"
                                />
                                <text x={el.width / 2} y={el.height / 2 + 3} fontSize="8" textAnchor="middle" fill="#1e1b4b" fontWeight="bold" className="select-none pointer-events-none">
                                  {labelName}
                                </text>
                              </>
                            );
                          }

                          case 'poly-pentagon':
                          case 'poly-hexagon': {
                            const cx = el.width / 2;
                            const cy = el.height / 2;
                            const r = Math.min(cx, cy);
                            const totalSides = el.toolType === 'poly-pentagon' ? 5 : 6;
                            const pts = Array.from({ length: totalSides }).map((_, idx) => {
                              const angle = (idx * 2 * Math.PI) / totalSides - Math.PI / 2;
                              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                            }).join(' ');
                            return (
                              <>
                                <polygon
                                  points={pts}
                                  fill={el.toolType === 'poly-pentagon' ? "rgba(236, 72, 153, 0.85)" : "rgba(147, 51, 234, 0.85)"}
                                  stroke={isSelected ? '#003fb1' : '#1e293b'}
                                  strokeWidth="1.5"
                                />
                                <text x={cx} y={cy + 4} fontSize="9" textAnchor="middle" fill="#ffffff" fontWeight="bold" className="select-none pointer-events-none">
                                  {el.toolType === 'poly-pentagon' ? 'Pentagon' : 'Hexagon'}
                                </text>
                              </>
                            );
                          }

                          case 'number-line': {
                            const padding = 20;
                            const usableLength = el.width - 2 * padding;
                            const step = usableLength / 10;
                            const highlights = el.numberLineHighlights || [];
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="rgba(255, 255, 255, 0.95)" stroke={isSelected ? '#003fb1' : '#cbd5e1'} strokeWidth="1" rx="8" />
                                <line x1={padding} y1={el.height / 2} x2={el.width - padding} y2={el.height / 2} stroke="#374151" strokeWidth="2.5" />
                                {Array.from({ length: 11 }).map((_, idx) => {
                                  const tx = padding + idx * step;
                                  const isHighlighted = highlights.includes(idx);
                                  return (
                                    <g 
                                      key={idx}
                                      className="cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newHighlights = isHighlighted ? highlights.filter(h => h !== idx) : [...highlights, idx];
                                        const updated = elements.map(item => item.id === el.id ? { ...item, numberLineHighlights: newHighlights } : item);
                                        pushStateToHistory(updated);
                                      }}
                                    >
                                      <line x1={tx} y1={el.height/2 - 10} x2={tx} y2={el.height/2 + 10} stroke="#374151" strokeWidth="2" />
                                      <circle cx={tx} cy={el.height/2} r={isHighlighted ? "6" : "3"} fill={isHighlighted ? "#ba1a1a" : "#374151"} />
                                      <text x={tx} y={el.height/2 + 22} fontSize="8" textAnchor="middle" fontWeight="bold" fill={isHighlighted ? "#ba1a1a" : "#4b5563"} className="select-none">
                                        {idx}
                                      </text>
                                    </g>
                                  );
                                })}
                                <text x={el.width / 2} y={15} fontSize="8" textAnchor="middle" fill="#9ca3af" className="select-none pointer-events-none font-mono">
                                  Click numbers to toggle highlights
                                </text>
                              </>
                            );
                          }

                          case 'fraction-bar': {
                            const divs = el.divisions || 5;
                            const filled = el.filledSegments || [];
                            const segWidth = el.width / divs;
                            const handleDenonChange = (e: React.MouseEvent, change: number) => {
                              e.stopPropagation();
                              const newDivs = Math.max(1, Math.min(12, divs + change));
                              const updated = elements.map(item => item.id === el.id ? { ...item, divisions: newDivs, filledSegments: [] } : item);
                              pushStateToHistory(updated);
                            };
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#ffffff" stroke={isSelected ? '#003fb1' : '#9ca3af'} strokeWidth="1.5" rx="8" />
                                {Array.from({ length: divs }).map((_, idx) => {
                                  const isFilled = filled.includes(idx);
                                  return (
                                    <rect
                                      key={idx}
                                      x={idx * segWidth}
                                      y={0}
                                      width={segWidth}
                                      height={el.height - 35}
                                      fill={isFilled ? "rgba(59, 130, 246, 0.75)" : "transparent"}
                                      stroke="#9ca3af"
                                      strokeWidth="1.5"
                                      className="cursor-pointer hover:fill-blue-100/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newFilled = isFilled ? filled.filter(f => f !== idx) : [...filled, idx];
                                        const updated = elements.map(item => item.id === el.id ? { ...item, filledSegments: newFilled } : item);
                                        pushStateToHistory(updated);
                                      }}
                                    />
                                  );
                                })}
                                <g transform={`translate(10, ${el.height - 26})`}>
                                  <circle cx="10" cy="10" r="9" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" className="cursor-pointer hover:fill-gray-200" onClick={(e) => handleDenonChange(e, -1)} />
                                  <text x="10" y="14" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#374151" className="select-none pointer-events-none">-</text>

                                  <circle cx="32" cy="10" r="9" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" className="cursor-pointer hover:fill-gray-200" onClick={(e) => handleDenonChange(e, 1)} />
                                  <text x="32" y="14" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#374151" className="select-none pointer-events-none">+</text>

                                  <text x="50" y="13" fontSize="9.5" fontWeight="extrabold" fill="#1e40af" className="select-none font-mono">
                                    Divs: {divs} | Filled: {filled.length}/{divs} ({Math.round((filled.length/divs)*100)}%)
                                  </text>
                                </g>
                              </>
                            );
                          }

                          case 'fraction-circle': {
                            const divs = el.divisions || 6;
                            const filled = el.filledSegments || [];
                            const r = Math.min(el.width, el.height) / 2 - 25;
                            const cx = el.width / 2;
                            const cy = el.height / 2 - 12;
                            const handleCircleDenonChange = (e: React.MouseEvent, change: number) => {
                              e.stopPropagation();
                              const newDivs = Math.max(1, Math.min(12, divs + change));
                              const updated = elements.map(item => item.id === el.id ? { ...item, divisions: newDivs, filledSegments: [] } : item);
                              pushStateToHistory(updated);
                            };
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#ffffff" stroke={isSelected ? '#003fb1' : '#9ca3af'} strokeWidth="1.5" rx="8" />
                                <circle cx={cx} cy={cy} r={r} fill="#f9fafb" stroke="#d1d5db" strokeWidth="2" />
                                {Array.from({ length: divs }).map((_, idx) => {
                                  const isFilled = filled.includes(idx);
                                  const angleStep = 360 / divs;
                                  const startAngle = idx * angleStep - 90;
                                  const endAngle = (idx + 1) * angleStep - 90;

                                  const rad1 = (startAngle * Math.PI) / 180;
                                  const rad2 = (endAngle * Math.PI) / 180;

                                  const x1 = cx + r * Math.cos(rad1);
                                  const y1 = cy + r * Math.sin(rad1);
                                  const x2 = cx + r * Math.cos(rad2);
                                  const y2 = cy + r * Math.sin(rad2);

                                  const largeArcFlag = angleStep > 180 ? 1 : 0;
                                  const d = divs === 1 
                                    ? `M ${cx} ${cy} m -${r}, 0 a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0`
                                    : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                                  return (
                                    <path
                                      key={idx}
                                      d={d}
                                      fill={isFilled ? "rgba(16, 185, 129, 0.7)" : "transparent"}
                                      stroke="#9ca3af"
                                      strokeWidth="1.5"
                                      className="cursor-pointer hover:fill-emerald-100/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newFilled = isFilled ? filled.filter(f => f !== idx) : [...filled, idx];
                                        const updated = elements.map(item => item.id === el.id ? { ...item, filledSegments: newFilled } : item);
                                        pushStateToHistory(updated);
                                      }}
                                    />
                                  );
                                })}
                                <g transform={`translate(10, ${el.height - 26})`}>
                                  <circle cx="10" cy="10" r="9" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" className="cursor-pointer hover:fill-gray-200" onClick={(e) => handleCircleDenonChange(e, -1)} />
                                  <text x="10" y="14" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#374151" className="select-none pointer-events-none">-</text>

                                  <circle cx="32" cy="10" r="9" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" className="cursor-pointer hover:fill-gray-200" onClick={(e) => handleCircleDenonChange(e, 1)} />
                                  <text x="32" y="14" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#374151" className="select-none pointer-events-none">+</text>

                                  <text x="50" y="13" fontSize="9.5" fontWeight="extrabold" fill="#047857" className="select-none font-mono">
                                    Parts: {divs} | Filled: {filled.length}/{divs}
                                  </text>
                                </g>
                              </>
                            );
                          }

                          case 'balance-scale': {
                            const leftWt = el.leftWeight || 0;
                            const rightWt = el.rightWeight || 0;
                            const diff = leftWt - rightWt;
                            const tiltAngle = Math.max(-12, Math.min(12, (diff / 10) * 12));
                            const handleWeightChange = (e: React.MouseEvent, side: 'left' | 'right', amount: number) => {
                              e.stopPropagation();
                              const updated = elements.map(item => {
                                if (item.id === el.id) {
                                  const current = side === 'left' ? leftWt : rightWt;
                                  return { ...item, [side === 'left' ? 'leftWeight' : 'rightWeight']: Math.max(0, current + amount) };
                                }
                                return item;
                              });
                              pushStateToHistory(updated);
                            };
                            const midX = el.width / 2;
                            const baseY = el.height - 25;
                            const pillarTopY = 55;
                            const beamLength = el.width - 60;
                            const rad = (tiltAngle * Math.PI) / 180;
                            const beamXOffset = (beamLength / 2) * Math.cos(rad);
                            const beamYOffset = (beamLength / 2) * Math.sin(rad);

                            const leftPanX = midX - beamXOffset;
                            const leftPanY = pillarTopY - beamYOffset;
                            const rightPanX = midX + beamXOffset;
                            const rightPanY = pillarTopY + beamYOffset;

                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#fcfcfd" stroke={isSelected ? '#003fb1' : '#b2c5ff'} strokeWidth="1" rx="12" style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.04))' }} />
                                <rect x={midX - 40} y={baseY} width="80" height="12" rx="3" fill="#475569" />
                                <rect x={midX - 6} y={pillarTopY} width="12" height={baseY - pillarTopY} fill="#64748b" />
                                <circle cx={midX} cy={pillarTopY} r="8" fill="#475569" />

                                <line x1={midX - beamXOffset} y1={pillarTopY - beamYOffset} x2={midX + beamXOffset} y2={pillarTopY + beamYOffset} stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

                                <line x1={leftPanX} y1={leftPanY} x2={leftPanX - 22} y2={leftPanY + 40} stroke="#cbd5e1" strokeWidth="1.5" />
                                <line x1={leftPanX} y1={leftPanY} x2={leftPanX + 22} y2={leftPanY + 40} stroke="#cbd5e1" strokeWidth="1.5" />
                                <path d={`M ${leftPanX - 25} ${leftPanY + 40} Q ${leftPanX} ${leftPanY + 46} ${leftPanX + 25} ${leftPanY + 40} Z`} fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />
                                
                                <line x1={rightPanX} y1={rightPanY} x2={rightPanX - 22} y2={rightPanY + 40} stroke="#cbd5e1" strokeWidth="1.5" />
                                <line x1={rightPanX} y1={rightPanY} x2={rightPanX + 22} y2={rightPanY + 40} stroke="#cbd5e1" strokeWidth="1.5" />
                                <path d={`M ${rightPanX - 25} ${rightPanY + 40} Q ${rightPanX} ${rightPanY + 46} ${rightPanX + 25} ${rightPanY + 40} Z`} fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />

                                {leftWt > 0 && (
                                  <g transform={`translate(${leftPanX - 10}, ${leftPanY + 22})`}>
                                    <rect width="20" height="15" fill="#f59e0b" rx="2" stroke="#d97706" strokeWidth="1" />
                                    <text x="10" y="11" fontSize="8" textAnchor="middle" fill="#ffffff" fontWeight="bold">{leftWt}g</text>
                                  </g>
                                )}
                                {rightWt > 0 && (
                                  <g transform={`translate(${rightPanX - 10}, ${rightPanY + 22})`}>
                                    <rect width="20" height="15" fill="#f59e0b" rx="2" stroke="#d97706" strokeWidth="1" />
                                    <text x="10" y="11" fontSize="8" textAnchor="middle" fill="#ffffff" fontWeight="bold">{rightWt}g</text>
                                  </g>
                                )}

                                <g transform={`translate(${leftPanX - 20}, ${el.height - 48})`}>
                                  <circle cx="-10" cy="10" r="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" className="cursor-pointer hover:fill-red-100" onClick={(e) => handleWeightChange(e, 'left', -1)} />
                                  <text x="-10" y="13.5" fontSize="10" textAnchor="middle" fill="#ef4444" fontWeight="bold">-</text>
                                  <circle cx="10" cy="10" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" className="cursor-pointer hover:fill-green-100" onClick={(e) => handleWeightChange(e, 'left', 1)} />
                                  <text x="10" y="13.5" fontSize="10" textAnchor="middle" fill="#22c55e" fontWeight="bold">+</text>
                                  <text x="0" y="-1" fontSize="9" textAnchor="middle" fill="#1e293b" fontWeight="extrabold">{leftWt}g</text>
                                </g>

                                <g transform={`translate(${rightPanX - 20}, ${el.height - 48})`}>
                                  <circle cx="-10" cy="10" r="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" className="cursor-pointer hover:fill-red-100" onClick={(e) => handleWeightChange(e, 'right', -1)} />
                                  <text x="-10" y="13.5" fontSize="10" textAnchor="middle" fill="#ef4444" fontWeight="bold">-</text>
                                  <circle cx="10" cy="10" r="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" className="cursor-pointer hover:fill-green-100" onClick={(e) => handleWeightChange(e, 'right', 1)} />
                                  <text x="10" y="13.5" fontSize="10" textAnchor="middle" fill="#22c55e" fontWeight="bold">+</text>
                                  <text x="0" y="-1" fontSize="9" textAnchor="middle" fill="#1e293b" fontWeight="extrabold">{rightWt}g</text>
                                </g>

                                <text x={midX} y={el.height - 8} fontSize="8.5" textAnchor="middle" fill="#475569" fontWeight="bold" className="select-none font-mono">
                                  {leftWt === rightWt ? "Scale is Balanced" : `${Math.abs(leftWt - rightWt)}g Difference`}
                                </text>
                              </>
                            );
                          }

                          case 'algebra-tile-x2':
                          case 'algebra-tile-x':
                          case 'algebra-tile-1': {
                            let titleText = "1";
                            let fillBg = "rgba(245, 158, 11, 0.85)";
                            let strokeBd = "#92400e";
                            if (el.toolType === 'algebra-tile-x2') {
                              titleText = "x²";
                              fillBg = "rgba(59, 130, 246, 0.85)";
                              strokeBd = "#1e40af";
                            } else if (el.toolType === 'algebra-tile-x') {
                              titleText = "x";
                              fillBg = "rgba(16, 185, 129, 0.85)";
                              strokeBd = "#065f46";
                            }
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill={fillBg} stroke={isSelected ? '#003fb1' : strokeBd} strokeWidth="1.5" rx="4" />
                                <text x={el.width / 2} y={el.height / 2 + 5} fontSize="13" fontWeight="bold" textAnchor="middle" fill="#ffffff" className="select-none pointer-events-none">
                                  {titleText}
                                </text>
                              </>
                            );
                          }

                          case 'coin-flip': {
                            const face = el.coinFace || 'Heads';
                            const tally = el.coinHistory || [];
                            const handleCoinFlip = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              let flipCount = 0;
                              const timer = setInterval(() => {
                                const tempFace = Math.random() > 0.5 ? 'Heads' : 'Tails';
                                setElements(prev => prev.map(item => item.id === el.id ? { ...item, coinFace: tempFace } : item));
                                flipCount++;
                                if (flipCount > 8) {
                                  clearInterval(timer);
                                  const finalFace = Math.random() > 0.5 ? 'Heads' : 'Tails';
                                  const updated = elements.map(item => item.id === el.id ? { ...item, coinFace: finalFace, coinHistory: [...tally, finalFace] } : item);
                                  pushStateToHistory(updated);
                                }
                              }, 80);
                            };
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#fafaf9" stroke={isSelected ? '#003fb1' : '#cbd5e1'} strokeWidth="1" rx="12" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.05))' }} />
                                <circle cx={el.width / 2} cy={el.height / 2 - 12} r="32" fill="url(#goldGradient)" stroke="#d97706" strokeWidth="2.5" />
                                <circle cx={el.width / 2} cy={el.height / 2 - 12} r="26" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                                <text x={el.width / 2} y={el.height / 2 - 8} fontSize="11" fontWeight="black" fill="#78350f" textAnchor="middle" className="select-none pointer-events-none">
                                  {face}
                                </text>

                                <rect x={el.width/2 - 35} y={el.height - 35} width="70" height="18" rx="9" fill="#f59e0b" stroke="#78350f" strokeWidth="1" className="cursor-pointer hover:fill-amber-500" onClick={handleCoinFlip} />
                                <text x={el.width / 2} y={el.height - 23} fontSize="8" textAnchor="middle" fontWeight="bold" fill="#ffffff" className="select-none pointer-events-none">FLIP COIN</text>

                                <text x={el.width / 2} y={15} fontSize="7.5" textAnchor="middle" fill="#78350f" fontWeight="bold" className="select-none pointer-events-none font-mono">
                                  H: {tally.filter(t => t === 'Heads').length} | T: {tally.filter(t => t === 'Tails').length}
                                </text>

                                <defs>
                                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#fef08a" />
                                    <stop offset="50%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#b45309" />
                                  </linearGradient>
                                </defs>
                              </>
                            );
                          }

                          case 'dice-roll': {
                            const val = el.diceValue || 5;
                            const historyRolls = el.diceHistory || [];
                            const handleDiceRoll = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              let rollCount = 0;
                              const timer = setInterval(() => {
                                const tempVal = Math.floor(Math.random() * 6) + 1;
                                setElements(prev => prev.map(item => item.id === el.id ? { ...item, diceValue: tempVal } : item));
                                rollCount++;
                                if (rollCount > 8) {
                                  clearInterval(timer);
                                  const finalVal = Math.floor(Math.random() * 6) + 1;
                                  const updated = elements.map(item => item.id === el.id ? { ...item, diceValue: finalVal, diceHistory: [...historyRolls, finalVal] } : item);
                                  pushStateToHistory(updated);
                                }
                              }, 80);
                            };
                            const centers: { [key: number]: { x: number; y: number }[] } = {
                              1: [{ x: 25, y: 25 }],
                              2: [{ x: 12, y: 12 }, { x: 38, y: 38 }],
                              3: [{ x: 12, y: 12 }, { x: 25, y: 25 }, { x: 38, y: 38 }],
                              4: [{ x: 12, y: 12 }, { x: 38, y: 12 }, { x: 12, y: 38 }, { x: 38, y: 38 }],
                              5: [{ x: 12, y: 12 }, { x: 38, y: 12 }, { x: 25, y: 25 }, { x: 12, y: 38 }, { x: 38, y: 38 }],
                              6: [{ x: 12, y: 12 }, { x: 38, y: 12 }, { x: 12, y: 25 }, { x: 38, y: 25 }, { x: 12, y: 38 }, { x: 38, y: 38 }]
                            };
                            const activePips = centers[val] || [];
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#fafafa" stroke={isSelected ? '#003fb1' : '#cbd5e1'} strokeWidth="1" rx="12" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.05))' }} />
                                <g transform={`translate(${el.width/2 - 25}, ${el.height/2 - 35})`}>
                                  <rect width="50" height="50" rx="10" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                                  {activePips.map((dot, dIdx) => (
                                    <circle key={dIdx} cx={dot.x} cy={dot.y} r="3.5" fill="#ba1a1a" />
                                  ))}
                                </g>

                                <rect x={el.width/2 - 35} y={el.height - 35} width="70" height="18" rx="9" fill="#ba1a1a" stroke="#7c2d12" strokeWidth="1" className="cursor-pointer hover:fill-red-700" onClick={handleDiceRoll} />
                                <text x={el.width / 2} y={el.height - 23} fontSize="8" textAnchor="middle" fontWeight="bold" fill="#ffffff" className="select-none pointer-events-none">ROLL DICE</text>

                                <text x={el.width / 2} y={15} fontSize="7.5" textAnchor="middle" fill="#4b5563" fontWeight="bold" className="select-none pointer-events-none font-mono">
                                  Rolls: {historyRolls.length} | Avg: {historyRolls.length ? (historyRolls.reduce((a,b)=>a+b, 0)/historyRolls.length).toFixed(1) : '0'}
                                </text>
                              </>
                            );
                          }

                          case 'spinner': {
                            const spinAngle = el.spinnerAngle || 0;
                            const winner = el.spinnerSector || "Red";
                            const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
                            const labels = ["Red", "Blue", "Green", "Gold"];
                            const handleSpin = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              const start = Date.now();
                              const duration = 1200;
                              const extra = 4 + Math.random() * 4;
                              const target = spinAngle + extra * 360;
                              const runAnimation = () => {
                                const elapsed = Date.now() - start;
                                if (elapsed < duration) {
                                  const progress = elapsed / duration;
                                  const ease = 1 - Math.pow(1 - progress, 3);
                                  const rot = spinAngle + ease * (target - spinAngle);
                                  setElements(prev => prev.map(item => {
                                    if (item.id === el.id) {
                                      const activeAngle = rot % 360;
                                      const idx = Math.floor(activeAngle / 90);
                                      return { ...item, spinnerAngle: rot, spinnerSector: labels[idx] };
                                    }
                                    return item;
                                  }));
                                  requestAnimationFrame(runAnimation);
                                } else {
                                  const finalRot = target % 360;
                                  const idx = Math.floor(finalRot / 90);
                                  const updated = elements.map(item => item.id === el.id ? { ...item, spinnerAngle: finalRot, spinnerSector: labels[idx] } : item);
                                  pushStateToHistory(updated);
                                }
                              };
                              runAnimation();
                            };
                            const cx_spin = el.width / 2;
                            const cy_spin = el.height / 2 - 12;
                            const r_spin = 32;
                            return (
                              <>
                                <rect width={el.width} height={el.height} fill="#fafafa" stroke={isSelected ? '#003fb1' : '#cbd5e1'} strokeWidth="1" rx="12" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.05))' }} />
                                <g transform={`translate(${cx_spin}, ${cy_spin}) rotate(${spinAngle})`}>
                                  {Array.from({ length: 4 }).map((_, idx) => {
                                    const startDeg = idx * 90;
                                    const endDeg = (idx + 1) * 90;
                                    const r1 = (startDeg * Math.PI) / 180;
                                    const r2 = (endDeg * Math.PI) / 180;
                                    const x1 = r_spin * Math.cos(r1);
                                    const y1 = r_spin * Math.sin(r1);
                                    const x2 = r_spin * Math.cos(r2);
                                    const y2 = r_spin * Math.sin(r2);
                                    return (
                                      <path
                                        key={idx}
                                        d={`M 0 0 L ${x1} ${y1} A ${r_spin} ${r_spin} 0 0 1 ${x2} ${y2} Z`}
                                        fill={colors[idx]}
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                      />
                                    );
                                  })}
                                </g>
                                <polygon points={`${cx_spin},${cy_spin - r_spin - 6} ${cx_spin - 5},${cy_spin - r_spin + 4} ${cx_spin + 5},${cy_spin - r_spin + 4}`} fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
                                <circle cx={cx_spin} cy={cy_spin} r="4" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />

                                <rect x={el.width/2 - 35} y={el.height - 35} width="70" height="18" rx="9" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" className="cursor-pointer hover:fill-blue-600" onClick={handleSpin} />
                                <text x={el.width / 2} y={el.height - 23} fontSize="8" textAnchor="middle" fontWeight="bold" fill="#ffffff" className="select-none pointer-events-none">SPIN</text>

                                <text x={el.width / 2} y={15} fontSize="7.5" textAnchor="middle" fill="#1e293b" fontWeight="extrabold" className="select-none pointer-events-none font-mono">
                                  Result: {winner}
                                </text>
                              </>
                            );
                          }
                          default:
                            return null;
                        }
                      })()}

                      {/* Unified diagonal resizing handle at bottom-right corner */}
                      {isSelected && (
                        <g
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingElementId(el.id);
                          }}
                          className="cursor-se-resize"
                        >
                          <rect
                            width={el.width}
                            height={el.height}
                            fill="none"
                            stroke="#003fb1"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            pointerEvents="none"
                          />
                          <circle
                            cx={el.width}
                            cy={el.height}
                            r="7"
                            fill="#003fb1"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <circle
                            cx={el.width}
                            cy={el.height}
                            r="2.5"
                            fill="#ffffff"
                          />
                        </g>
                      )}
                    </g>
                  );
                }

                if (el.type === 'shape' && el.shapeType) {
                  const width = Math.max(2, Math.abs(el.width));
                  const height = Math.max(2, Math.abs(el.height));
                  const rx = el.width < 0 ? el.x + el.width : el.x;
                  const ry = el.height < 0 ? el.y + el.height : el.y;

                  switch (el.shapeType) {
                    case 'rect':
                      return (
                        <g key={el.id} id={`shape-g-${el.id}`}>
                          <rect
                            x={rx}
                            y={ry}
                            width={width}
                            height={height}
                            fill="none"
                            stroke={el.strokeColor}
                            strokeWidth={el.strokeWidth}
                          />
                          {el.label && (
                            <text x={rx + 8} y={ry + 20} className="text-xs font-mono font-medium fill-tertiary">
                              {el.label}
                            </text>
                          )}
                        </g>
                      );
                    case 'circle':
                      const radius = Math.round(Math.sqrt(width * width + height * height) / 2);
                      return (
                        <g key={el.id} id={`shape-g-${el.id}`}>
                          <circle
                            cx={el.x}
                            cy={el.y}
                            r={radius}
                            fill="none"
                            stroke={el.strokeColor}
                            strokeWidth={el.strokeWidth}
                          />
                          {el.label && (
                            <text x={el.x - radius + 5} y={el.y - 8} className="text-xs font-mono font-bold fill-primary">
                              {el.label}
                            </text>
                          )}
                        </g>
                      );
                    case 'line':
                      return (
                        <g key={el.id} id={`shape-g-${el.id}`}>
                          <line
                            x1={el.x}
                            y1={el.y}
                            x2={el.x + el.width}
                            y2={el.y + el.height}
                            stroke={el.strokeColor}
                            strokeWidth={el.strokeWidth}
                          />
                          {el.label && (
                            <text x={el.x + 10} y={el.y - 8} className="text-xs font-mono fill-outline italic">
                              {el.label}
                            </text>
                          )}
                        </g>
                      );
                    case 'arrow':
                      // Arrow drawing with dynamic end marker
                      const arrowId = `arrow-marker-${el.id}`;
                      return (
                        <g key={el.id} id={`shape-g-${el.id}`}>
                          <defs>
                            <marker
                              id={arrowId}
                              markerWidth="10"
                              markerHeight="10"
                              refX="6"
                              refY="3"
                              orient="auto"
                              markerUnits="strokeWidth"
                            >
                              <path d="M0,0 L0,6 L9,3 z" fill={el.strokeColor} />
                            </marker>
                          </defs>
                          <line
                            x1={el.x}
                            y1={el.y}
                            x2={el.x + el.width}
                            y2={el.y + el.height}
                            stroke={el.strokeColor}
                            strokeWidth={el.strokeWidth}
                            markerEnd={`url(#${arrowId})`}
                          />
                          {el.label && (
                            <text x={el.x + el.width / 2 + 10} y={el.y + el.height / 2 - 8} className="text-xs font-mono fill-secondary-fixed-dim font-medium bg-surface px-1">
                              {el.label}
                            </text>
                          )}
                        </g>
                      );
                    case 'hexagon':
                      // Chemical organic benzene ring drawing
                      const hexR = Math.round(Math.sqrt(width * width + height * height) / 2);
                      const points: string[] = [];
                      for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3;
                        points.push(`${el.x + hexR * Math.cos(angle)},${el.y + hexR * Math.sin(angle)}`);
                      }
                      return (
                        <g key={el.id} id={`shape-g-${el.id}`}>
                          <polygon
                            points={points.join(' ')}
                            fill="none"
                            stroke={el.strokeColor}
                            strokeWidth={el.strokeWidth}
                          />
                          {/* Render double bonds representation */}
                          <polygon
                            points={points.map((p, idx) => {
                              if (idx % 2 === 0) {
                                const pCoords = p.split(',').map(Number);
                                return `${pCoords[0] * 0.9 + el.x * 0.1},${pCoords[1] * 0.9 + el.y * 0.1}`;
                              }
                              return p;
                            }).join(' ')}
                            fill="none"
                            stroke={el.strokeColor}
                            strokeWidth={1}
                            strokeDasharray="4,4"
                          />
                          {el.label && (
                            <text x={el.x - 20} y={el.y + 5} className="text-xs font-sans font-bold fill-tertiary">
                              {el.label}
                            </text>
                          )}
                        </g>
                      );
                    default:
                      return null;
                  }
                }
                if (el.type === 'image' && el.content) {
                  return (
                    <g key={el.id} id={`image-g-${el.id}`}>
                      <image
                        href={el.content}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </g>
                  );
                }

                return null;
              })}
            </g>
          </svg>

          {/* HTML Overlay Layers (Sticky notes, text editors, formula elements) */}
          {elements.filter(el => (el.pageIndex || 0) === currentPageIndex).map((el) => {
            if (el.type === 'sticky') {
              const stickyColorClasses = {
                yellow: 'bg-yellow-100/90 border-yellow-300 text-yellow-900',
                pink: 'bg-pink-100/90 border-pink-300 text-pink-900',
                cyan: 'bg-cyan-100/90 border-cyan-300 text-cyan-900',
                green: 'bg-green-100/90 border-green-300 text-green-900'
              };
              return (
                <div
                  key={el.id}
                  id={`overlay-el-${el.id}`}
                  onDoubleClick={() => handleElementDoubleClick(el)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    transform: `translate(${el.x * zoom + panX}px, ${el.y * zoom + panY}px) scale(${zoom}) rotate(-1deg)`,
                    transformOrigin: 'top left'
                  }}
                  className={`p-3 border-t-4 rounded shadow-md select-text flex flex-col justify-between font-sans text-xs cursor-move ${stickyColorClasses[el.color || 'yellow']} z-20 hover:scale-101 hover:shadow-lg transition-transform duration-100`}
                >
                  <p className="whitespace-pre-wrap font-medium">{el.content}</p>
                  <div className="flex justify-between items-center text-[9px] text-outline font-mono pt-2 border-t border-outline-variant/10">
                    <span>Note Card</span>
                    <span>✎ Dbl-Click</span>
                  </div>
                </div>
              );
            }

            if (el.type === 'text') {
              return (
                <div
                  key={el.id}
                  id={`overlay-el-${el.id}`}
                  onDoubleClick={() => handleElementDoubleClick(el)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: `${el.width}px`,
                    transform: `translate(${el.x * zoom + panX}px, ${el.y * zoom + panY}px) scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                  className={`px-2.5 py-1.5 rounded cursor-move select-text z-20 border border-transparent hover:border-outline-variant/30 hover:bg-surface-container-lowest/40`}
                >
                  {el.isFormula ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono text-outline uppercase tracking-wider">LaTeX Equation</span>
                      <div className="font-mono text-base italic font-medium tracking-tight text-primary p-1 bg-surface-container-low/40 rounded border border-primary/10">
                        {renderLaTeXText(el.content || '')}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-on-surface whitespace-pre-wrap">{el.content}</p>
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* Collaborative cursors floating visually */}
          {collaborators.map((collab) => (
            <div
              key={collab.id}
              id={`collab-pointer-${collab.id}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${collab.x * zoom + panX}px, ${collab.y * zoom + panY}px)`,
                transformOrigin: 'top left',
                pointerEvents: 'none',
                transition: 'all 1.2s cubic-bezier(0.1, 0.8, 0.25, 1)'
              }}
              className="z-30 flex flex-col gap-1 items-start"
            >
              <MousePointer className="w-5 h-5 text-secondary stroke-2 fill-secondary" />
              <span className="text-[10px] font-medium bg-inverse-surface text-inverse-on-surface px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                {collab.name}
              </span>
            </div>
          ))}

          {/* Floating Selected Element Properties Card */}
          {selectedElementId && (
            (() => {
              const selectedEl = elements.find(el => el.id === selectedElementId);
              if (!selectedEl) return null;
              
              const rotateElement = (amount: number) => {
                const updated = elements.map(el => {
                  if (el.id === selectedElementId) {
                    return {
                      ...el,
                      angle: ((el.angle || 0) + amount) % 360
                    };
                  }
                  return el;
                });
                pushStateToHistory(updated);
              };

              const deleteSelectedElement = () => {
                const updated = elements.filter(el => el.id !== selectedElementId);
                pushStateToHistory(updated);
                setSelectedElementId(null);
              };

              const moveZIndex = (direction: 'forward' | 'backward') => {
                const idx = elements.findIndex(el => el.id === selectedElementId);
                if (idx === -1) return;
                const newElements = [...elements];
                if (direction === 'forward' && idx < elements.length - 1) {
                  // Swap with next
                  newElements[idx] = elements[idx + 1];
                  newElements[idx + 1] = elements[idx];
                } else if (direction === 'backward' && idx > 0) {
                  // Swap with prev
                  newElements[idx] = elements[idx - 1];
                  newElements[idx - 1] = elements[idx];
                }
                pushStateToHistory(newElements);
              };

              return (
                <div className="absolute top-4 right-4 z-40 w-60 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl p-3 flex flex-col gap-2.5 animate-fade-in text-on-surface">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                    <span className="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">Element Controls</span>
                    <button 
                      onClick={() => setSelectedElementId(null)}
                      className="text-outline-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-on-surface-variant font-semibold capitalize">
                      Type: <span className="font-mono text-xs text-primary">{selectedEl.type === 'math-tool' ? `${selectedEl.toolType} tool` : selectedEl.type}</span>
                    </span>
                    {selectedEl.label && (
                      <span className="text-[10px] text-outline font-mono">Label: "{selectedEl.label}"</span>
                    )}
                  </div>

                  {/* Rotation Controls (Only for rotateable elements) */}
                  {selectedEl.type === 'math-tool' && (
                    <div className="flex flex-col gap-1 border-t border-outline-variant/20 pt-2">
                      <span className="text-[9px] font-mono text-outline uppercase tracking-wider">Rotate Math Tool</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => rotateElement(-15)}
                          className="flex-1 py-1 rounded-lg border border-outline-variant/30 text-xs font-semibold hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-primary" />
                          <span>-15°</span>
                        </button>
                        <button
                          onClick={() => rotateElement(15)}
                          className="flex-1 py-1 rounded-lg border border-outline-variant/30 text-xs font-semibold hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <RotateCw className="w-3 h-3 text-primary" />
                          <span>+15°</span>
                        </button>
                        <span className="text-xs font-mono font-bold bg-surface-container-low/60 px-2 py-0.5 rounded border border-outline-variant/10 text-center min-w-[36px]">
                          {selectedEl.angle || 0}°
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cartesian Point Plotter (Only for cartesian grid) */}
                  {selectedEl.type === 'math-tool' && selectedEl.toolType === 'cartesian' && (
                    <div className="flex flex-col gap-1.5 border-t border-outline-variant/20 pt-2 text-xs">
                      <span className="text-[9px] font-mono text-outline uppercase tracking-wider">Cartesian Points</span>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const xVal = parseInt((form.elements.namedItem('cartesian-x') as HTMLInputElement).value, 10);
                          const yVal = parseInt((form.elements.namedItem('cartesian-y') as HTMLInputElement).value, 10);
                          if (!isNaN(xVal) && !isNaN(yVal) && Math.abs(xVal) <= 8 && Math.abs(yVal) <= 8) {
                            const currentPoints = selectedEl.plottedPoints || [];
                            if (!currentPoints.some(pt => pt.x === xVal && pt.y === yVal)) {
                              const updatedPoints = [...currentPoints, { x: xVal, y: yVal }];
                              const updated = elements.map(item => item.id === selectedEl.id ? { ...item, plottedPoints: updatedPoints } : item);
                              setElements(updated);
                              pushStateToHistory(updated);
                            }
                            form.reset();
                          }
                        }}
                        className="flex gap-1.5"
                      >
                        <input 
                          type="number" 
                          name="cartesian-x" 
                          min="-8" 
                          max="8" 
                          placeholder="X" 
                          required 
                          className="w-12 px-1.5 py-0.5 text-xs border border-outline-variant/30 rounded bg-surface-container-low text-center focus:outline-none focus:border-primary font-mono" 
                        />
                        <input 
                          type="number" 
                          name="cartesian-y" 
                          min="-8" 
                          max="8" 
                          placeholder="Y" 
                          required 
                          className="w-12 px-1.5 py-0.5 text-xs border border-outline-variant/30 rounded bg-surface-container-low text-center focus:outline-none focus:border-primary font-mono" 
                        />
                        <button 
                          type="submit" 
                          className="flex-1 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold active:scale-95 transition-all"
                        >
                          Plot Point
                        </button>
                      </form>
                      
                      {selectedEl.plottedPoints && selectedEl.plottedPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto mt-1 border border-outline-variant/10 p-1.5 rounded bg-surface-container-low/40">
                          {selectedEl.plottedPoints.map((pt, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">
                              <span>{String.fromCharCode(65 + (idx % 26))}({pt.x},{pt.y})</span>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updatedPoints = selectedEl.plottedPoints!.filter((_, pIdx) => pIdx !== idx);
                                  const updated = elements.map(item => item.id === selectedEl.id ? { ...item, plottedPoints: updatedPoints } : item);
                                  setElements(updated);
                                  pushStateToHistory(updated);
                                }}
                                className="text-red-500 hover:text-red-700 font-bold ml-1 text-[10px]"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Z-Index Controls */}
                  <div className="flex flex-col gap-1 border-t border-outline-variant/20 pt-2">
                    <span className="text-[9px] font-mono text-outline uppercase tracking-wider">Layer Arrangement</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveZIndex('backward')}
                        className="flex-1 py-1 px-2 rounded-lg border border-outline-variant/30 text-xs font-semibold hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-1"
                        title="Send layer backward"
                      >
                        <ChevronDown className="w-3 h-3" />
                        <span>Send Back</span>
                      </button>
                      <button
                        onClick={() => moveZIndex('forward')}
                        className="flex-1 py-1 px-2 rounded-lg border border-outline-variant/30 text-xs font-semibold hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-1"
                        title="Bring layer forward"
                      >
                        <ChevronUp className="w-3 h-3" />
                        <span>Bring Front</span>
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone Action Delete */}
                  <div className="border-t border-outline-variant/20 pt-2 flex items-center gap-2">
                    <button
                      onClick={deleteSelectedElement}
                      className="w-full py-1 rounded-lg bg-error/10 hover:bg-error-container text-xs font-semibold text-error transition-colors flex items-center justify-center gap-1 border border-error/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Element</span>
                    </button>
                  </div>
                </div>
              );
            })()
          )}

          {/* Floating Math Keyboard Keypad */}
          {isKeypadOpen && (
            <div className="absolute top-10 left-10 z-50 animate-fade-in">
              <MathKeypad
                onInsert={handleInsertSymbol}
                onClose={() => setIsKeypadOpen(false)}
                currentValue={latexInput}
                onChangeValue={handleLatexChange}
                onConfirm={handleConfirmLatex}
              />
            </div>
          )}

          {/* Zoom & Viewport Mode Control Panel */}
          <div className="absolute bottom-6 left-6 z-30 glass-panel p-1.5 rounded-2xl shadow-xl flex items-center gap-2 border border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md">
            
            {/* Viewport Mode Toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCanvasMode('normal')}
                id="canvas-mode-normal-btn"
                title="Normal Board Mode (Fixed & Auto-Centered)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${canvasMode === 'normal' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Normal Board</span>
              </button>
              <button
                onClick={() => setCanvasMode('unlimited')}
                id="canvas-mode-unlimited-btn"
                title="Unlimited Page Mode (Infinite Scrolling)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${canvasMode === 'unlimited' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                <Infinity className="w-3.5 h-3.5" />
                <span>Unlimited Page</span>
              </button>
            </div>

            <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>

            {/* Scroll behavior setting toggle */}
            <button
              onClick={() => setScrollBehavior(prev => prev === 'zoom' ? 'pan' : 'zoom')}
              title={`Scroll Wheel Action: ${scrollBehavior === 'zoom' ? 'Zoom (Scroll to Zoom, Shift+Scroll to Pan)' : 'Pan (Scroll to Pan, Shift+Scroll to Pan)'}`}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary/5 hover:bg-primary/10 text-primary border border-primary/15 transition-all flex items-center gap-1.5 font-mono"
            >
              {scrollBehavior === 'zoom' ? (
                <>
                  <MousePointer className="w-3 h-3" />
                  <span>WHEEL: ZOOM</span>
                </>
              ) : (
                <>
                  <Hand className="w-3 h-3" />
                  <span>WHEEL: PAN</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>

            {/* Manual Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(prev => Math.max(0.15, Number((prev - 0.1).toFixed(1))))}
                id="zoom-out-canvas-btn"
                title="Zoom Out (-)"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-[11px] font-mono font-bold text-on-surface-variant min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => setZoom(prev => Math.min(3.0, Number((prev + 0.1).toFixed(1))))}
                id="zoom-in-canvas-btn"
                title="Zoom In (+)"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => {
                  if (canvasMode === 'normal') {
                    fitToScreen();
                  } else {
                    setZoom(1);
                    setPanX(0);
                    setPanY(0);
                  }
                }}
                id="zoom-reset-btn"
                title={canvasMode === 'normal' ? 'Fit Board to Screen' : 'Reset Zoom & Scroll'}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all font-mono"
              >
                {canvasMode === 'normal' ? 'FIT' : 'RESET'}
              </button>
            </div>
          </div>
        </div>

        {/* Floating Bottom Center Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass-panel px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-md">
          {/* Interaction modes */}
          <div className="flex items-center gap-1 border-r border-outline-variant/30 pr-3">
            <button
              onClick={() => { setTool('select'); setIsKeypadOpen(false); }}
              id="tool-select-btn"
              title="Selection Pointer (v)"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'select' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <MousePointer className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('pen'); setIsKeypadOpen(false); }}
              id="tool-pen-btn"
              title="Brush Drawing (b)"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'pen' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <PenTool className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('shape'); setIsKeypadOpen(false); }}
              id="tool-shape-btn"
              title="Geometric Shape (s)"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'shape' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('sticky'); setIsKeypadOpen(false); }}
              id="tool-sticky-btn"
              title="Sticky Note (n)"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'sticky' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <StickyNote className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('text'); setIsKeypadOpen(false); }}
              id="tool-text-btn"
              title="Text Annotation (t)"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'text' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('formula'); }}
              id="tool-formula-btn"
              title="LaTeX Mathematical Formula"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'formula' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Sigma className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('eraser'); setIsKeypadOpen(false); }}
              id="tool-eraser-btn"
              title="Eraser tool"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'eraser' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setTool('pan'); setIsKeypadOpen(false); }}
              id="tool-pan-btn"
              title="Pan / Scroll Canvas (h)"
              className={`p-2 rounded-xl transition-all hover:scale-105 ${tool === 'pan' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <Hand className="w-5 h-5" />
            </button>

            {/* Math STEM Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsMathToolMenuOpen(!isMathToolMenuOpen);
                  setIsExportMenuOpen(false);
                }}
                id="stem-math-tools-dropdown-btn"
                title="Insert STEM Tools (Protractors, Rulers, Set Squares, Blocks & Graphs)"
                className={`p-2 rounded-xl transition-all hover:scale-105 flex items-center justify-center ${isMathToolMenuOpen ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                <Calculator className="w-5 h-5" />
              </button>
              
              {isMathToolMenuOpen && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-3 w-80 flex flex-col gap-2.5 text-xs animate-fade-in text-on-surface">
                  {/* Categorized Headers / Tabs */}
                  <div className="flex border-b border-outline-variant/20 pb-2 gap-1 overflow-x-auto select-none scrollbar-none">
                    {[
                      { id: 'geometry', label: 'Geometry' },
                      { id: 'numbers', label: 'Numbers' },
                      { id: 'fractions', label: 'Fractions' },
                      { id: 'algebra', label: 'Algebra' },
                      { id: 'probability', label: 'Prob / Data' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveMathCategory(tab.id as any)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${activeMathCategory === tab.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-outline hover:bg-surface-container-low border border-transparent'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="max-h-[280px] overflow-y-auto pr-1 flex flex-col gap-1">
                    {activeMathCategory === 'geometry' && (
                      <>
                        <button onClick={() => { handleAddMathTool('ruler'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          <span>Metric Scale Ruler</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('protractor'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          <span>180° Protractor</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('set-square-45'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                          <span>Set Square (45°)</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('set-square-30'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                          <span>Set Square (30°-60°)</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('poly-pentagon'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span>Regular Pentagon Shape</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('poly-hexagon'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                          <span>Regular Hexagon Shape</span>
                        </button>
                        <div className="text-[9px] font-mono font-bold text-outline uppercase tracking-wider px-3 py-1 border-t border-outline-variant/10 mt-1">Tangram Pieces</div>
                        {[
                          { id: 'tangram-tri-lg', label: 'Tangram Triangle (Large)', color: 'bg-violet-500' },
                          { id: 'tangram-tri-md', label: 'Tangram Triangle (Medium)', color: 'bg-violet-500' },
                          { id: 'tangram-tri-sm', label: 'Tangram Triangle (Small)', color: 'bg-violet-500' },
                          { id: 'tangram-square', label: 'Tangram Square', color: 'bg-violet-500' },
                          { id: 'tangram-para', label: 'Tangram Parallelogram', color: 'bg-violet-500' },
                        ].map(t => (
                          <button key={t.id} onClick={() => { handleAddMathTool(t.id as any); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                            <span className={`w-1.5 h-1.5 ${t.color} rounded-full`}></span>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {activeMathCategory === 'numbers' && (
                      <>
                        <button onClick={() => { handleAddMathTool('number-line'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                          <span className="font-bold text-primary">Interactive Number Line</span>
                        </button>
                        <div className="text-[9px] font-mono font-bold text-outline uppercase tracking-wider px-3 py-1 border-t border-outline-variant/10 mt-1">Base-10 Blocks</div>
                        <button onClick={() => { handleAddMathTool('block-unit'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                          <span>Unit Block (1)</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('block-rod'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                          <span>Base-10 Rod (10)</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('block-flat'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                          <span>Base-10 Flat (100)</span>
                        </button>
                      </>
                    )}
                    {activeMathCategory === 'fractions' && (
                      <>
                        <button onClick={() => { handleAddMathTool('fraction-bar'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                          <span>Interactive Fraction Bar</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('fraction-circle'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full"></span>
                          <span>Interactive Fraction Circle</span>
                        </button>
                      </>
                    )}
                    {activeMathCategory === 'algebra' && (
                      <>
                        <button onClick={() => { handleAddMathTool('cartesian'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          <span className="font-bold text-primary">Cartesian coordinate grid</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('balance-scale'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          <span>Algebra Balance Scale</span>
                        </button>
                        <div className="text-[9px] font-mono font-bold text-outline uppercase tracking-wider px-3 py-1 border-t border-outline-variant/10 mt-1">Algebra Tiles</div>
                        <button onClick={() => { handleAddMathTool('algebra-tile-x2'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                          <span>Algebra Tile (x²)</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('algebra-tile-x'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          <span>Algebra Tile (x)</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('algebra-tile-1'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                          <span>Algebra Tile (1)</span>
                        </button>
                      </>
                    )}
                    {activeMathCategory === 'probability' && (
                      <>
                        <button onClick={() => { handleAddMathTool('coin-flip'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span>Interactive Coin Flip</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('dice-roll'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          <span>Interactive Dice Roll</span>
                        </button>
                        <button onClick={() => { handleAddMathTool('spinner'); setIsMathToolMenuOpen(false); }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold">
                          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                          <span>Interactive Spinner</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Export Board Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsExportMenuOpen(!isExportMenuOpen);
                  setIsMathToolMenuOpen(false);
                }}
                id="export-board-dropdown-btn"
                title="Export Whiteboard Content"
                className={`p-2 rounded-xl transition-all hover:scale-105 flex items-center justify-center ${isExportMenuOpen ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                <FileDown className="w-5 h-5" />
              </button>
              
              {isExportMenuOpen && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-2 w-48 flex flex-col gap-1 text-xs animate-fade-in text-on-surface">
                  <span className="px-3 py-1 text-[10px] font-mono text-outline uppercase tracking-wider border-b border-outline-variant/20 mb-1">
                    Export Options
                  </span>
                  
                  <button
                    onClick={() => { handleExportSvg(); setIsExportMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold text-primary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Page as SVG</span>
                  </button>
                  
                  <button
                    onClick={() => { handleExportJson(); setIsExportMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-left font-semibold text-secondary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Board Data (JSON)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Conditional settings based on active tool */}
          {tool === 'shape' && (
            <div className="flex items-center gap-1 border-r border-outline-variant/30 pr-3 animate-fade-in text-xs font-semibold">
              <button 
                onClick={() => setActiveShape('rect')}
                className={`px-2 py-1 rounded ${activeShape === 'rect' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
              >
                Rectangle
              </button>
              <button 
                onClick={() => setActiveShape('circle')}
                className={`px-2 py-1 rounded ${activeShape === 'circle' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
              >
                Circle
              </button>
              <button 
                onClick={() => setActiveShape('line')}
                className={`px-2 py-1 rounded ${activeShape === 'line' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
              >
                Line
              </button>
              <button 
                onClick={() => setActiveShape('arrow')}
                className={`px-2 py-1 rounded ${activeShape === 'arrow' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
              >
                Vector
              </button>
              <button 
                onClick={() => setActiveShape('hexagon')}
                className={`px-2 py-1 rounded ${activeShape === 'hexagon' ? 'bg-secondary-container text-on-secondary-container' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                title="Chemical Aromatic Ring"
              >
                Benzene
              </button>
            </div>
          )}

          {tool === 'sticky' && (
            <div className="flex items-center gap-1 border-r border-outline-variant/30 pr-3 animate-fade-in">
              {(['yellow', 'pink', 'cyan', 'green'] as const).map(color => {
                const colorMap = {
                  yellow: 'bg-yellow-200',
                  pink: 'bg-pink-200',
                  cyan: 'bg-cyan-200',
                  green: 'bg-green-200'
                };
                return (
                  <button
                    key={color}
                    onClick={() => setActiveStickyColor(color)}
                    style={{ width: '18px', height: '18px' }}
                    className={`rounded-full border ${activeStickyColor === color ? 'ring-2 ring-primary border-transparent scale-110' : 'border-outline-variant/40'} ${colorMap[color]}`}
                  />
                );
              })}
            </div>
          )}

          {/* Draw colors selection (Pen, Shapes & Text) */}
          <div className="flex items-center gap-1.5">
            {colorPresets.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => setActiveColor(preset.hex)}
                style={{ backgroundColor: preset.hex, width: '18px', height: '18px' }}
                title={preset.name}
                className={`rounded-full border transition-transform ${activeColor === preset.hex ? 'ring-2 ring-primary ring-offset-1 border-transparent scale-115' : 'border-outline-variant/30 hover:scale-105'}`}
              />
            ))}
          </div>
        </div>

        {/* Collapsible OpenAI AI Co-pilot Side Panel Drawer */}
        {aiPanelOpen && role === 'teacher' && (
          <aside id="ai-copilot-aside" className="w-80 border-l border-outline-variant/20 bg-surface-container-lowest flex flex-col z-15 shadow-2xl relative animate-fade-in">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-on-surface">OpenAI AI Assistant</h3>
                  <span className="text-[10px] text-primary font-semibold">STEM Lesson Co-pilot</span>
                </div>
              </div>
            </div>

            {/* AI co-pilot scrollable panel */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Quick smart action triggers */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-outline uppercase tracking-wider">Quick Actions</span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleSolveBoard}
                    disabled={aiLoading}
                    className="text-left px-3 py-2.5 rounded-xl border border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition-all flex items-center justify-between group"
                  >
                    <span>Analyze & Solve Board Formulas</span>
                    <Sigma className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <div className="h-px bg-outline-variant/20 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setAiQuery("Draw an XY Cartesian coordinate system with arrows on the axis");
                    }}
                    className="text-left px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:border-secondary bg-surface-container-low text-[11px] font-medium text-on-surface-variant hover:text-secondary transition-all"
                  >
                    "Draw XY Coordinate Grid"
                  </button>
                  <button
                    onClick={() => {
                      setAiQuery("Draw a beautiful benzene chemical ring structure with H and C elements");
                    }}
                    className="text-left px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:border-secondary bg-surface-container-low text-[11px] font-medium text-on-surface-variant hover:text-secondary transition-all"
                  >
                    "Draw Organic Benzene Ring"
                  </button>
                  <button
                    onClick={() => {
                      setAiQuery("Create a cyan sticky note summarizing Newton's Third Law of Motion");
                    }}
                    className="text-left px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:border-secondary bg-surface-container-low text-[11px] font-medium text-on-surface-variant hover:text-secondary transition-all"
                  >
                    "Create Newton's Law Note"
                  </button>
                </div>
              </div>

              {/* Response output */}
              {(aiResponse || aiLoading) && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-outline uppercase tracking-wider">Co-pilot Response</span>
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs text-on-surface select-text overflow-x-auto min-h-[100px] flex flex-col justify-between">
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-3 text-center text-outline">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-primary text-xs">
                            {aiDrawing ? 'Designing canvas geometries...' : 'OpenAI is thinking...'}
                          </p>
                          <p className="text-[10px] font-mono text-outline">Formulating step-by-step logic</p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm font-sans flex flex-col gap-2 leading-relaxed">
                        <div className="whitespace-pre-wrap font-mono text-[11px] bg-surface-container-lowest p-2.5 rounded border border-outline-variant/20 max-h-80 overflow-y-auto">
                          {aiResponse}
                        </div>
                        <div className="flex justify-end pt-1">
                          <span className="text-[9px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-mono font-semibold">
                            ✓ Solved via gpt-4o-mini
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Prompt Input Bar */}
            <form onSubmit={handleCustomAiQuery} className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex gap-2">
              <input
                type="text"
                placeholder="Ask OpenAI or prompt: 'Draw...'"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                id="ai-prompt-input"
                className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                id="send-prompt-btn"
                className="bg-primary hover:bg-primary-container text-on-primary p-2 rounded-xl transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
