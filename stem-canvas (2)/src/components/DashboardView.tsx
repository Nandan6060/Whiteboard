import React, { useState, useRef } from 'react';
import { 
  Plus, 
  PlusCircle, 
  History, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogIn, 
  LogOut,
  MoreVertical, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Calculator,
  DraftingCompass,
  FlaskConical,
  Search,
  Trash2,
  Lock,
  X,
  Infinity,
  FileText,
  Eye,
  Upload,
  Download,
  Sliders,
  CheckCircle,
  RefreshCw,
  User,
  Compass
} from 'lucide-react';
import { Board, SharedBoard } from '../types';
import AuthModal from './AuthModal';

interface DashboardViewProps {
  boards: Board[];
  sharedBoards: SharedBoard[];
  onOpenBoard: (boardId: string) => void;
  onCreateNewBoard: (
    templateType?: 'blank' | 'math' | 'physics' | 'chemistry',
    title?: string,
    canvasMode?: 'normal' | 'unlimited',
    period?: string
  ) => void;
  onDeleteBoard: (boardId: string) => void;
  role: 'teacher' | 'student';
  onChangeRole: (role: 'teacher' | 'student') => void;
  isRoleLocked?: boolean;
  currentUser: { id: string; name: string; email: string; role: 'teacher' | 'student' } | null;
  onLoginSuccess: (user: { id: string; name: string; email: string; role: 'teacher' | 'student' }) => void;
  onLogout: () => void;
}

export default function DashboardView({
  boards,
  sharedBoards,
  onOpenBoard,
  onCreateNewBoard,
  onDeleteBoard,
  role,
  onChangeRole,
  isRoleLocked = false,
  currentUser,
  onLoginSuccess,
  onLogout,
}: DashboardViewProps) {
  const [joinCode, setJoinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'classes' | 'resources'>('all');

  // Menu and Modals state toggles
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  // Hidden input ref for JSON imports
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Grid style selection
  const [gridStyle, setGridStyle] = useState<'dot' | 'solid' | 'none'>(() => {
    return (localStorage.getItem('stem_grid_style') as 'dot' | 'solid' | 'none') || 'dot';
  });

  // Revision logs
  const [revisionLogs, setRevisionLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem('stem_revision_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      'System initialized with demo AP Physics, Organic Chemistry, and Calculus templates',
      'User workspace config loaded successfully',
      'Offline persistent storage synchronized'
    ];
  });

  const addRevisionLog = (log: string) => {
    const now = new Date().toLocaleTimeString();
    const fullLog = `[${now}] ${log}`;
    const updated = [fullLog, ...revisionLogs].slice(0, 50);
    setRevisionLogs(updated);
    localStorage.setItem('stem_revision_logs', JSON.stringify(updated));
  };

  const handleGridStyleChange = (style: 'dot' | 'solid' | 'none') => {
    setGridStyle(style);
    localStorage.setItem('stem_grid_style', style);
    addRevisionLog(`Changed workspace background grid to: ${style.toUpperCase()}`);
  };

  const handleExportBackup = () => {
    const savedBoards = localStorage.getItem('stem_boards') || JSON.stringify(boards);
    const blob = new Blob([savedBoards], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stem-canvas-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addRevisionLog('Exported all whiteboard backups as JSON file');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (typeof parsed === 'object' || Array.isArray(parsed))) {
          // Check if single board or multiple boards array
          const importList = Array.isArray(parsed) ? parsed : [parsed];
          const savedBoards = localStorage.getItem('stem_boards');
          const currentBoards = savedBoards ? JSON.parse(savedBoards) : boards;
          
          let count = 0;
          const updated = [...currentBoards];
          for (const item of importList) {
            if (item && typeof item === 'object') {
              const boardTitle = item.title || 'Imported Canvas';
              const boardElements = Array.isArray(item.elements) ? item.elements : [];
              const canvasMode = item.canvasMode || 'unlimited';
              const period = item.period || 'Period 1';
              
              const newBoard = {
                id: `board-imported-${Date.now()}-${count}`,
                title: boardTitle,
                modifiedAt: 'Imported Just Now',
                period: period,
                elements: boardElements,
                canvasMode: canvasMode
              };
              updated.unshift(newBoard);
              count++;
              addRevisionLog(`Imported whiteboard: "${boardTitle}"`);
            }
          }
          
          localStorage.setItem('stem_boards', JSON.stringify(updated));
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid whiteboard JSON backup file structure.');
      }
    };
    reader.readAsText(file);
  };

  // Custom Teacher PIN state (stored in localStorage)
  const [teacherPin, setTeacherPin] = useState(() => {
    return localStorage.getItem('stem_teacher_pin') || 'admin';
  });

  const handleUpdateTeacherPin = (newPin: string) => {
    setTeacherPin(newPin);
    localStorage.setItem('stem_teacher_pin', newPin);
    addRevisionLog('Updated Teacher PIN security passcode');
  };

  // PIN Lock variables to prevent student unauthorized access to Teacher Side
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // New Board Configuration Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationTemplate, setCreationTemplate] = useState<'blank' | 'math' | 'physics' | 'chemistry'>('blank');
  const [creationTitle, setCreationTitle] = useState('');
  const [creationPeriod, setCreationPeriod] = useState('Period 1');
  const [creationCanvasMode, setCreationCanvasMode] = useState<'normal' | 'unlimited'>('unlimited');

  const triggerCreateModal = (templateType: 'blank' | 'math' | 'physics' | 'chemistry') => {
    let defaultTitle = 'Untitled Board';
    if (templateType === 'math') defaultTitle = 'New Mathematics Board';
    else if (templateType === 'physics') defaultTitle = 'New Physics Board';
    else if (templateType === 'chemistry') defaultTitle = 'New Chemistry Board';
    else defaultTitle = 'New Blank Canvas';

    setCreationTemplate(templateType);
    setCreationTitle(defaultTitle);
    setCreationPeriod('Period 1');
    setCreationCanvasMode('unlimited'); // default to Normal whiteboard mode (panning/scrolling)
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = () => {
    onCreateNewBoard(creationTemplate, creationTitle, creationCanvasMode, creationPeriod);
    setIsCreateModalOpen(false);
  };

  const handleJoinBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    const code = joinCode.trim().toLowerCase();
    if (code === 'calculus' || code === 'calc') {
      onOpenBoard('calculus-2');
    } else if (code === 'physics' || code === 'phys') {
      onOpenBoard('physics-orbital');
    } else if (code === 'chemistry' || code === 'chem') {
      onOpenBoard('organic-chem');
    } else {
      // Create a random join board
      triggerCreateModal('blank');
      setJoinCode('');
    }
  };

  const filteredBoards = boards.filter(board => 
    board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.period.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${gridStyle === 'dot' ? 'dot-grid' : gridStyle === 'solid' ? 'solid-grid' : ''} font-sans text-on-background pb-12`}>
      {/* Header */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-8 h-16 bg-surface-container-lowest shadow-sm border-b border-outline-variant/20">
        <div className="flex items-center gap-6">
          <span className="text-xl font-display font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="bg-primary text-on-primary p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            STEM Canvas
          </span>
          <nav className="hidden md:flex gap-2 items-center">
            {/* File Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setIsFileMenuOpen(!isFileMenuOpen); setIsViewMenuOpen(false); }}
                className={`font-sans text-sm font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isFileMenuOpen ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                id="header-file-menu-btn"
              >
                File
              </button>
              {isFileMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl py-2 z-50 animate-fade-in flex flex-col">
                  <button
                    onClick={() => { triggerCreateModal('blank'); setIsFileMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low text-left font-semibold text-sm text-on-surface"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span>New Canvas...</span>
                  </button>
                  <button
                    onClick={() => { importFileInputRef.current?.click(); setIsFileMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low text-left font-semibold text-sm text-on-surface"
                  >
                    <Upload className="w-4 h-4 text-secondary" />
                    <span>Import Canvas (JSON)</span>
                  </button>
                  <button
                    onClick={() => { handleExportBackup(); setIsFileMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low text-left font-semibold text-sm text-on-surface"
                  >
                    <Download className="w-4 h-4 text-secondary" />
                    <span>Backup All Boards (JSON)</span>
                  </button>
                  <div className="h-px bg-outline-variant/20 my-1"></div>
                  <button
                    onClick={() => {
                      if (window.confirm('Reset everything? This will delete all custom whiteboards and restore defaults.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                      setIsFileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-left font-semibold text-sm text-error"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                    <span>Reset All Workspace Data</span>
                  </button>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={importFileInputRef} 
              onChange={handleImportJSON} 
              accept=".json" 
              className="hidden" 
            />

            <button 
              className="font-sans text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors px-3 py-1.5 rounded-lg font-semibold" 
              onClick={() => triggerCreateModal('blank')}
            >
              Insert
            </button>

            {/* View Menu Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setIsViewMenuOpen(!isViewMenuOpen); setIsFileMenuOpen(false); }}
                className={`font-sans text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isViewMenuOpen ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                id="header-view-menu-btn"
              >
                View
              </button>
              {isViewMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl py-2 z-50 animate-fade-in flex flex-col">
                  <span className="px-4 py-1 text-[10px] font-bold text-outline uppercase tracking-wider">Canvas Grid Background</span>
                  <button
                    onClick={() => { handleGridStyleChange('dot'); setIsViewMenuOpen(false); }}
                    className="flex items-center justify-between px-4 py-2 hover:bg-surface-container-low text-left font-semibold text-sm text-on-surface"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" /> Dot Grid Pattern
                    </span>
                    {gridStyle === 'dot' && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => { handleGridStyleChange('solid'); setIsViewMenuOpen(false); }}
                    className="flex items-center justify-between px-4 py-2 hover:bg-surface-container-low text-left font-semibold text-sm text-on-surface"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-secondary" /> Solid Grid Lines
                    </span>
                    {gridStyle === 'solid' && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => { handleGridStyleChange('none'); setIsViewMenuOpen(false); }}
                    className="flex items-center justify-between px-4 py-2 hover:bg-surface-container-low text-left font-semibold text-sm text-on-surface"
                  >
                    <span className="flex items-center gap-2">
                      <X className="w-4 h-4 text-outline" /> Plain Empty Canvas
                    </span>
                    {gridStyle === 'none' && <CheckCircle className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              )}
            </div>

            <button 
              className="font-sans text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors px-3 py-1.5 rounded-lg font-semibold"
              onClick={() => setIsHistoryModalOpen(true)}
            >
              History
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Active Role Selector */}
          {isRoleLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-xs font-semibold select-none shadow-sm animate-pulse">
              <Lock className="w-3.5 h-3.5 text-red-500" />
              <span>Student Mode (Locked via Invite)</span>
            </div>
          ) : (currentUser?.role === 'student' || localStorage.getItem('stem_role_selected') === 'student') ? (
            // In student mode: NO switcher or teacher option is visible
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl text-xs font-semibold select-none shadow-sm">
              <Compass className="w-3.5 h-3.5 text-secondary" />
              <span>Student Workspace</span>
            </div>
          ) : (
            // In teacher mode: show switcher (allows switching to student and back since they are a teacher)
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => onChangeRole('teacher')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${role === 'teacher' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                id="role-switch-teacher-btn"
              >
                <span>Teacher View</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeRole('student')}
                className={`px-3 py-1.5 rounded-lg transition-all ${role === 'student' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
                id="role-switch-student-btn"
              >
                Student View
              </button>
            </div>
          )}

          <button 
            onClick={() => triggerCreateModal('blank')}
            className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-primary-container hover:scale-95 duration-150 shadow-sm flex items-center gap-1.5"
            id="header-share-btn"
          >
            <Plus className="w-4 h-4" /> New Canvas
          </button>
          
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="text-outline hover:text-primary transition-colors p-2 hover:bg-surface-container-low rounded-full" 
            id="header-settings-btn" 
            title="System Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3 bg-surface-container-low pl-3 pr-1 py-1 rounded-full border border-outline-variant/30 shadow-sm">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-on-surface leading-none">{currentUser.name}</span>
                <span className="text-[9px] font-mono font-medium text-primary uppercase tracking-wider">{currentUser.role}</span>
              </div>
              <button 
                onClick={onLogout}
                title="Sign Out"
                className="w-8 h-8 rounded-full bg-error-container/20 hover:bg-error-container/40 text-error flex items-center justify-center transition-all hover:scale-105"
                id="header-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-95 flex items-center gap-1.5 shadow-sm"
              id="header-auth-trigger-btn"
            >
              <LogIn className="w-3.5 h-3.5" /> Create Account / Sign In
            </button>
          )}
        </div>
      </header>

      {/* Side Navigation Rail */}
      <aside className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 py-4 z-40 bg-surface-container/85 backdrop-blur-md border border-outline-variant/40 rounded-full shadow-lg px-2">
        <div className="flex flex-col gap-2">
          <button 
            className={`rounded-full p-3 transition-all hover:scale-110 active:scale-90 ${activeTab === 'all' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            title="My Boards"
            onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
            id="nav-boards-btn"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button 
            className={`rounded-full p-3 transition-all hover:scale-110 ${activeTab === 'classes' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            title="Classes"
            onClick={() => setActiveTab('classes')}
            id="nav-classes-btn"
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            className={`rounded-full p-3 transition-all hover:scale-110 ${activeTab === 'resources' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            title="Resources Library"
            onClick={() => setActiveTab('resources')}
            id="nav-resources-btn"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button 
            className="text-on-surface-variant p-3 hover:bg-surface-container-highest rounded-full transition-all hover:scale-110" 
            title="Revision History"
            onClick={() => setIsHistoryModalOpen(true)}
            id="nav-history-btn"
          >
            <History className="w-5 h-5" />
          </button>
          <div className="h-px w-6 bg-outline-variant/60 mx-auto my-1"></div>
          <button 
            className="text-on-surface-variant p-3 hover:bg-surface-container-highest rounded-full transition-all hover:scale-110" 
            title="Application Settings"
            onClick={() => setIsSettingsModalOpen(true)}
            id="nav-settings-btn"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-24 pl-24 pr-8 pb-12 max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Welcome Block & Join Panel */}
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div>
            <h1 className="font-display text-4xl font-bold text-on-surface tracking-tight" id="dashboard-welcome-heading">
              {currentUser 
                ? `Welcome back, ${currentUser.name}` 
                : (role === 'teacher' ? 'Welcome back, Prof. Aris (Guest)' : 'Welcome back, Sarah Miller (Guest)')}
            </h1>
            <p className="text-on-surface-variant mt-1 text-sm">
              {role === 'teacher' 
                ? 'Ready for your next breakthrough interactive STEM lesson?' 
                : 'Access lessons, join live collaborative canvases, and track your study notes.'}
            </p>
          </div>

          <form onSubmit={handleJoinBoard} className="glass-panel p-4 rounded-xl flex items-center gap-4 w-full lg:w-auto border border-outline-variant/30">
            <div className="flex-1 lg:w-56">
              <label className="block text-xs font-mono font-medium text-outline uppercase tracking-wider mb-1">
                Join Board
              </label>
              <input 
                type="text"
                placeholder="Enter Code... (e.g. calc, phys)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                id="join-code-input"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg font-mono text-sm px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              id="join-board-submit"
              className="mt-5 bg-secondary text-on-secondary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-on-secondary-container transition-all hover:scale-95"
            >
              <LogIn className="w-4 h-4" /> Join
            </button>
          </form>
        </section>

        {activeTab === 'classes' && (
          <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm animate-fade-in">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" /> Classes & Student Groups
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-outline-variant/30 p-4 rounded-xl hover:shadow-md transition-shadow">
                <span className="text-xs font-mono bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded">Period 2</span>
                <h3 className="font-semibold mt-2">Calculus II (Intro)</h3>
                <p className="text-xs text-outline mt-1">24 Active Students • 3 Online Whiteboards</p>
              </div>
              <div className="border border-outline-variant/30 p-4 rounded-xl hover:shadow-md transition-shadow">
                <span className="text-xs font-mono bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded">Period 4</span>
                <h3 className="font-semibold mt-2">Calculus II (Methods)</h3>
                <p className="text-xs text-outline mt-1">28 Active Students • 5 Online Whiteboards</p>
              </div>
              <div className="border border-outline-variant/30 p-4 rounded-xl hover:shadow-md transition-shadow">
                <span className="text-xs font-mono bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded">Period 5</span>
                <h3 className="font-semibold mt-2">AP Physics: Mechanics</h3>
                <p className="text-xs text-outline mt-1">18 Active Students • 2 Online Whiteboards</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'resources' && (
          <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm animate-fade-in">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-secondary" /> Resources & Document Templates
            </h2>
            <p className="text-sm text-outline mb-4">Select an interactive workspace template or educational reference guide to load onto your whiteboard.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-outline-variant/30 p-4 rounded-xl flex justify-between items-center hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => triggerCreateModal('math')}>
                <div>
                  <h4 className="font-semibold">3D Cartesian Grid Reference</h4>
                  <p className="text-xs text-outline">Preloaded coordinates and parametric equation controls.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-outline" />
              </div>
              <div className="border border-outline-variant/30 p-4 rounded-xl flex justify-between items-center hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => triggerCreateModal('physics')}>
                <div>
                  <h4 className="font-semibold">Free Body Force Vector Diagram</h4>
                  <p className="text-xs text-outline">Preloaded friction coefficient slider and simulation blocks.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-outline" />
              </div>
            </div>
          </section>
        )}

        {/* Create New Board templates */}
        {activeTab === 'all' && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-on-surface">
              <PlusCircle className="w-5 h-5 text-primary animate-pulse" /> Create New Board
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Blank Canvas */}
              <div 
                onClick={() => triggerCreateModal('blank')}
                id="create-blank-canvas"
                className="glass-panel p-6 rounded-2xl border-2 border-dashed border-outline-variant/60 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-surface-container-low transition-all group min-h-[190px] text-center"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                  <Plus className="w-6 h-6 text-primary group-hover:text-on-primary" />
                </div>
                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors text-sm">Blank Canvas</span>
              </div>

              {/* Math Template */}
              <div 
                onClick={() => triggerCreateModal('math')}
                id="create-math-canvas"
                className="glass-panel p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/50 transition-all border border-outline-variant/20 relative overflow-hidden group min-h-[190px] flex flex-col justify-between"
              >
                <div>
                  <div className="mb-3 text-primary bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-on-surface text-sm">Mathematics</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Grid systems, coordinate plots, and LaTeX solvers.</p>
                </div>
                <div className="absolute right-[-10px] bottom-[-15px] opacity-10 group-hover:opacity-20 transition-all duration-300 transform group-hover:scale-110">
                  <Calculator className="w-28 h-28 text-primary" />
                </div>
              </div>

              {/* Physics Template */}
              <div 
                onClick={() => triggerCreateModal('physics')}
                id="create-physics-canvas"
                className="glass-panel p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-secondary/50 transition-all border border-outline-variant/20 relative overflow-hidden group min-h-[190px] flex flex-col justify-between"
              >
                <div>
                  <div className="mb-3 text-secondary bg-secondary/10 w-10 h-10 rounded-xl flex items-center justify-center">
                    <DraftingCompass className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-on-surface text-sm">Physics</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Vector mechanics, force diagrams, and live orbit simulators.</p>
                </div>
                <div className="absolute right-[-10px] bottom-[-15px] opacity-10 group-hover:opacity-20 transition-all duration-300 transform group-hover:scale-110">
                  <DraftingCompass className="w-28 h-28 text-secondary" />
                </div>
              </div>

              {/* Chemistry Template */}
              <div 
                onClick={() => triggerCreateModal('chemistry')}
                id="create-chemistry-canvas"
                className="glass-panel p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-tertiary/50 transition-all border border-outline-variant/20 relative overflow-hidden group min-h-[190px] flex flex-col justify-between"
              >
                <div>
                  <div className="mb-3 text-tertiary bg-tertiary/10 w-10 h-10 rounded-xl flex items-center justify-center">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-on-surface text-sm">Chemistry</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Aromatic rings, chemical stoichiometry, and lab models.</p>
                </div>
                <div className="absolute right-[-10px] bottom-[-15px] opacity-10 group-hover:opacity-20 transition-all duration-300 transform group-hover:scale-110">
                  <FlaskConical className="w-28 h-28 text-tertiary" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Boards section */}
        {activeTab === 'all' && (
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-on-surface">
                <History className="w-5 h-5 text-secondary" /> Recent Boards
              </h2>
              <div className="flex items-center gap-3 w-full max-w-xs md:max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search recent whiteboards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    id="search-boards-input"
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs pl-9 pr-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {filteredBoards.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50">
                <p className="text-sm text-outline">No recent boards found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredBoards.map((board) => (
                  <div key={board.id} className="group flex flex-col gap-3">
                    <div 
                      onClick={() => onOpenBoard(board.id)}
                      id={`board-card-${board.id}`}
                      className="h-48 rounded-2xl overflow-hidden glass-panel border border-outline-variant/30 relative shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      {board.image ? (
                        <img 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" 
                          src={board.image} 
                          alt={board.title}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-low flex items-center justify-center text-primary font-display font-semibold text-lg">
                          STEM Whiteboard Workspace
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-all"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20">
                        <span className="bg-surface-container-lowest text-primary text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          Open Canvas <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start px-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-on-surface truncate text-sm" title={board.title}>{board.title}</h4>
                        <p className="text-xs font-mono text-outline mt-0.5">{board.modifiedAt} • {board.period}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onDeleteBoard(board.id)}
                          className="text-outline-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors"
                          id={`delete-board-btn-${board.id}`}
                          title="Delete Whiteboard"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Shared With Me Section */}
        {activeTab === 'all' && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2 text-on-surface">
              <Users className="w-5 h-5 text-tertiary" /> Shared with Me
            </h2>
            <div className="glass-panel rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                      <th className="p-4 text-xs font-mono font-medium text-outline uppercase tracking-wider">Document Name</th>
                      <th className="p-4 text-xs font-mono font-medium text-outline uppercase tracking-wider">Owner</th>
                      <th className="p-4 text-xs font-mono font-medium text-outline uppercase tracking-wider">Last Accessed</th>
                      <th className="p-4 text-xs font-mono font-medium text-outline uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {sharedBoards.map((sb) => (
                      <tr 
                        key={sb.id} 
                        onClick={() => onOpenBoard(sb.id)}
                        id={`shared-row-${sb.id}`}
                        className="hover:bg-surface-container-low/30 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 flex items-center gap-3">
                          <span className={`p-1.5 rounded-lg ${sb.icon === 'analytics' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <span className="font-semibold text-on-surface text-sm">{sb.title}</span>
                          <span className="text-[10px] bg-surface-container-highest text-primary font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Read Only
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full ${sb.ownerColor} text-[10px] flex items-center justify-center font-bold`}>
                              {sb.ownerInitials}
                            </div>
                            <span className="text-sm text-on-surface-variant font-medium">{sb.owner}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-outline">{sb.lastAccessed}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => triggerCreateModal('blank')}
        id="quick-create-fab"
        title="Quick Create Board"
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-on-primary rounded-full shadow-xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all duration-200 z-50 cursor-pointer"
      >
        <Plus className="w-7 h-7" />
        <div className="absolute right-20 bg-inverse-surface text-inverse-on-surface px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          Quick Create Board
        </div>
      </button>

      {/* Configure Your New Whiteboard Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 max-w-md w-full flex flex-col gap-4 text-on-surface">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="text-lg font-display font-bold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Configure New Board
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-outline-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 py-1">
              {/* Board Title Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="board-creation-title" className="text-xs font-bold text-outline uppercase tracking-wider">Board Title</label>
                <input 
                  type="text"
                  id="board-creation-title"
                  value={creationTitle}
                  onChange={(e) => setCreationTitle(e.target.value)}
                  placeholder="e.g. Vector Dynamics"
                  className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none w-full"
                />
              </div>

              {/* Class/Period Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="board-creation-period" className="text-xs font-bold text-outline uppercase tracking-wider">Class / Period</label>
                <select 
                  id="board-creation-period"
                  value={creationPeriod}
                  onChange={(e) => setCreationPeriod(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
                >
                  <option value="Period 1">Period 1: AP Calculus BC</option>
                  <option value="Period 2">Period 2: AP Chemistry</option>
                  <option value="Period 3">Period 3: Physics I</option>
                  <option value="Period 4">Period 4: STEM Collaboration</option>
                  <option value="Period 5">Period 5: AP Physics Mechanics</option>
                  <option value="Extracurricular">Extracurricular / Office Hours</option>
                </select>
              </div>

              {/* Mode Selection Choice */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-outline uppercase tracking-wider">Whiteboard Format Mode</span>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Book Mode Option */}
                  <div 
                    onClick={() => setCreationCanvasMode('normal')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${creationCanvasMode === 'normal' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant bg-transparent'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-1.5 text-on-surface">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Book Mode (Max 500 pages)
                      </span>
                      {creationCanvasMode === 'normal' && <span className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Slide-by-slide paginated book sheets, up to 500 pages. Best for lectures and slide presentations. Includes full page flip navigation.
                    </p>
                  </div>

                  {/* Infinite Whiteboard Mode Option */}
                  <div 
                    onClick={() => setCreationCanvasMode('unlimited')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${creationCanvasMode === 'unlimited' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant bg-transparent'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-1.5 text-on-surface">
                        <Infinity className="w-4 h-4 text-secondary" />
                        Normal Whiteboard Mode
                      </span>
                      {creationCanvasMode === 'unlimited' && <span className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Infinite scrolling whiteboard mode. Best for freeform brainstorming, large coordinate systems, mind mapping, and scrolling vector graphs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 border-t border-outline-variant/20 pt-3">
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmCreate}
                className="flex-1 py-2 text-xs font-bold text-on-primary bg-primary hover:bg-primary-container rounded-xl transition-all shadow-md"
              >
                Create Whiteboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Role PIN Authorization Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4 text-on-surface">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg">Teacher View Lock</h3>
              </div>
              <button 
                onClick={() => setIsPinModalOpen(false)}
                className="text-outline-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              This area is protected to restrict student access to teacher-only boards and controls. Please enter the Teacher PIN to unlock:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Valid pins: custom pin, or defaults: 'admin', 'teacher', '1234'
                const normalized = pinInput.trim().toLowerCase();
                const expected = teacherPin.trim().toLowerCase();
                if (normalized === expected || normalized === 'admin' || normalized === 'teacher' || normalized === '1234') {
                  onChangeRole('teacher');
                  setIsPinModalOpen(false);
                  setPinInput('');
                  setPinError('');
                  addRevisionLog('Unlocked Teacher View via security PIN');
                } else {
                  setPinError('Incorrect Teacher PIN. Please try again.');
                }
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-medium text-outline uppercase tracking-wider">Teacher PIN / Password</label>
                <input
                  type="password"
                  placeholder="Enter passcode (e.g. admin)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                  className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {pinError && (
                  <span className="text-[11px] text-error font-medium">{pinError}</span>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all"
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
            
            <div className="text-[10px] text-outline font-mono border-t border-outline-variant/10 pt-2 text-center">
              Hint for demo testing: use <span className="font-bold text-primary">{teacherPin}</span>, <span className="font-bold text-primary">admin</span> or <span className="font-bold text-primary">1234</span>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Overlay */}
      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onLoginSuccess={(user) => {
            onLoginSuccess(user);
            setIsAuthModalOpen(false);
            addRevisionLog(`Successfully logged in as ${user.name} (${user.role.toUpperCase()})`);
          }}
        />
      )}

      {/* Revision History Modal Overlay */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <span className="text-lg font-display font-bold text-on-surface flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Workspace Revision Log History
              </span>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-outline hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-low transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-outline leading-normal">
              This log shows the real-time record of all actions performed in this STEM workspace. This is persisted offline in your browser's local state.
            </p>

            <div className="flex-1 bg-surface-container-low rounded-xl border border-outline-variant/25 p-3 font-mono text-[11px] max-h-72 overflow-y-auto flex flex-col gap-2">
              {revisionLogs.map((log, index) => (
                <div key={index} className="flex gap-2 text-on-surface-variant hover:text-on-surface py-1 border-b border-outline-variant/5 last:border-b-0">
                  <span className="text-primary font-semibold select-none">•</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-between items-center pt-2">
              <button
                onClick={() => {
                  if (window.confirm('Clear revision log history?')) {
                    const cleared = ['[System Log] History cleared by user'];
                    setRevisionLogs(cleared);
                    localStorage.setItem('stem_revision_logs', JSON.stringify(cleared));
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-error hover:bg-error/5 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Logs
              </button>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Settings Modal Overlay */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
              <span className="text-lg font-display font-bold text-on-surface flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Workspace Settings & Security
              </span>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-outline hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-low transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="flex flex-col gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">Active Workspace Profile</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                  {currentUser ? currentUser.name.substring(0, 2).toUpperCase() : 'G'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">{currentUser ? currentUser.name : 'Guest Educator / Student'}</span>
                  <span className="text-xs text-outline">{currentUser ? currentUser.email : 'No active account. Log in or sign up to personalize your dashboard.'}</span>
                </div>
              </div>
              {!currentUser && (
                <button
                  onClick={() => { setIsSettingsModalOpen(false); setIsAuthModalOpen(true); }}
                  className="mt-1 self-start bg-secondary text-on-secondary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-on-secondary-container transition-all"
                >
                  Create Custom Profile
                </button>
              )}
            </div>

            {/* Teacher Pin Configuration */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">Teacher Area Passcode PIN</span>
              <p className="text-xs text-outline">
                Students attempting to toggle to the Teacher View must enter this passcode. Protect access to educator resources.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={teacherPin}
                  onChange={(e) => handleUpdateTeacherPin(e.target.value)}
                  placeholder="Set Teacher PIN (e.g. admin)"
                  className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono max-w-[150px]"
                />
                <div className="text-[11px] text-outline flex items-center">
                  Current PIN code: <span className="font-bold text-primary ml-1 font-mono">{teacherPin}</span>
                </div>
              </div>
            </div>

            {/* Workspace Stats */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">Workspace Health Stats</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-center">
                  <span className="block text-2xl font-bold font-mono text-primary">{boards.length}</span>
                  <span className="text-[10px] text-outline font-semibold uppercase">Total Custom Boards</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-center">
                  <span className="block text-2xl font-bold font-mono text-primary">{revisionLogs.length}</span>
                  <span className="text-[10px] text-outline font-semibold uppercase">Logged Actions</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/10">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2 text-sm font-bold bg-primary text-on-primary hover:bg-primary-container rounded-xl shadow-sm transition-all"
              >
                Save & Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
