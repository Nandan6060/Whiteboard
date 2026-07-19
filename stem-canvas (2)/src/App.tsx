/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { initialBoards, initialSharedBoards } from './data';
import { Board, BoardElement, SharedBoard } from './types';
import DashboardView from './components/DashboardView';
import WhiteboardView from './components/WhiteboardView';
import OnboardingView from './components/OnboardingView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: 'teacher' | 'student' } | null>(() => {
    const saved = localStorage.getItem('stem_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [boards, setBoards] = useState<Board[]>(() => {
    const saved = localStorage.getItem('stem_boards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse boards from localStorage', e);
      }
    }
    return initialBoards;
  });
  const [sharedBoards, setSharedBoards] = useState<SharedBoard[]>(initialSharedBoards);
  const [currentView, setCurrentView] = useState<'dashboard' | 'whiteboard'>('dashboard');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  
  const [role, setRole] = useState<'teacher' | 'student'>(() => {
    const savedUser = localStorage.getItem('stem_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role === 'teacher' || u.role === 'student') {
          return u.role;
        }
      } catch (e) {}
    }
    const savedRole = localStorage.getItem('stem_role_selected');
    if (savedRole === 'teacher' || savedRole === 'student') {
      return savedRole;
    }
    return 'teacher'; // default fallback
  });

  const [hasSelectedRole, setHasSelectedRole] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('stem_user');
    if (savedUser) return true;
    
    const savedRole = localStorage.getItem('stem_role_selected');
    if (savedRole === 'teacher' || savedRole === 'student') return true;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('invite')) return true;
    
    return false;
  });

  const [isRoleLocked, setIsRoleLocked] = useState<boolean>(false);

  // Sync role with logged in user role
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('stem_user');
    localStorage.removeItem('stem_role_selected');
    setCurrentUser(null);
    setRole('teacher'); // default fallback
    setHasSelectedRole(false);
  };

  const handleLoginSuccess = (user: { id: string; name: string; email: string; role: 'teacher' | 'student' }) => {
    localStorage.setItem('stem_user', JSON.stringify(user));
    setCurrentUser(user);
    setRole(user.role);
    setHasSelectedRole(true);
  };

  // Save to localStorage whenever boards list changes
  useEffect(() => {
    localStorage.setItem('stem_boards', JSON.stringify(boards));
  }, [boards]);

  // Synchronize boards across tabs using storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'stem_boards' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setBoards(parsed);
        } catch (err) {
          console.error('Failed to sync boards across tabs', err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Periodic polling fallback for sandbox environments (e.g. iframes) to sync student & teacher views
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('stem_boards');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (JSON.stringify(parsed) !== JSON.stringify(boards)) {
            setBoards(parsed);
          }
        } catch (e) {
          console.error('Failed to parse boards during polling', e);
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, [boards]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteBoardId = params.get('invite');
    const roleParam = params.get('role');

    if (inviteBoardId) {
      if (roleParam === 'student' || !roleParam) {
        setRole('student');
        setIsRoleLocked(true);
      }

      // Check if it exists in normal boards
      const boardExists = boards.some(b => b.id === inviteBoardId);
      if (boardExists) {
        setActiveBoardId(inviteBoardId);
        setCurrentView('whiteboard');
      } else {
        // Check if it exists in shared boards
        const sharedRef = sharedBoards.find(sb => sb.id === inviteBoardId);
        if (sharedRef) {
          const newId = `shared-copy-${Date.now()}`;
          const newBoard: Board = {
            id: newId,
            title: `${sharedRef.title} (Editable Copy)`,
            modifiedAt: 'Modified Just Now',
            period: 'Collaboration',
            elements: inviteBoardId === 'shared-thermo' ? [
              {
                id: 'thermo-1',
                type: 'text',
                x: 200,
                y: 150,
                width: 300,
                height: 60,
                content: '\\Delta U = Q - W',
                isFormula: true,
                strokeColor: '#ba1a1a'
              },
              {
                id: 'thermo-2',
                type: 'text',
                x: 200,
                y: 250,
                width: 300,
                height: 60,
                content: 'dS \\ge \\frac{dQ}{T}',
                isFormula: true,
                strokeColor: '#003fb1'
              },
              {
                id: 'thermo-note',
                type: 'sticky',
                x: 520,
                y: 180,
                width: 185,
                height: 150,
                content: 'First Law: Conservation of Energy\n\nSecond Law: Entropy of isolated systems always increases.',
                color: 'cyan'
              }
            ] : [
              {
                id: 'ds-1',
                type: 'text',
                x: 200,
                y: 150,
                width: 300,
                height: 60,
                content: 'y = \\beta_0 + \\beta_1 x + \\epsilon',
                isFormula: true,
                strokeColor: '#006a61'
              },
              {
                id: 'ds-note',
                type: 'sticky',
                x: 520,
                y: 150,
                width: 185,
                height: 150,
                content: 'Linear regression model coefficients:\n\nβ0: Intercept\nβ1: Slope coef\n\nCheck residuals for homoscedasticity!',
                color: 'yellow'
              }
            ]
          };
          setBoards(prev => [newBoard, ...prev]);
          setActiveBoardId(newId);
          setCurrentView('whiteboard');
        } else {
          const newId = `board-${Date.now()}`;
          const newBoard: Board = {
            id: newId,
            title: 'Joined Classroom Board',
            modifiedAt: 'Modified Just Now',
            period: 'Period 1',
            elements: []
          };
          setBoards(prev => [newBoard, ...prev]);
          setActiveBoardId(newId);
          setCurrentView('whiteboard');
        }
      }
    }
  }, []);

  const handleOpenBoard = (boardId: string) => {
    // Check if it's a shared board, otherwise look up normal boards
    const isShared = sharedBoards.some(sb => sb.id === boardId);
    if (isShared) {
      // Load a copy of the shared board as a new editable board
      const sharedRef = sharedBoards.find(sb => sb.id === boardId);
      const newId = `shared-copy-${Date.now()}`;
      
      const newBoard: Board = {
        id: newId,
        title: sharedRef ? `${sharedRef.title} (Editable Copy)` : 'Shared Whiteboard',
        modifiedAt: 'Modified Just Now',
        period: 'Collaboration',
        elements: boardId === 'shared-thermo' ? [
          {
            id: 'thermo-1',
            type: 'text',
            x: 200,
            y: 150,
            width: 300,
            height: 60,
            content: '\\Delta U = Q - W',
            isFormula: true,
            strokeColor: '#ba1a1a'
          },
          {
            id: 'thermo-2',
            type: 'text',
            x: 200,
            y: 250,
            width: 300,
            height: 60,
            content: 'dS \\ge \\frac{dQ}{T}',
            isFormula: true,
            strokeColor: '#003fb1'
          },
          {
            id: 'thermo-note',
            type: 'sticky',
            x: 520,
            y: 180,
            width: 185,
            height: 150,
            content: 'First Law: Conservation of Energy\n\nSecond Law: Entropy of isolated systems always increases.',
            color: 'cyan'
          }
        ] : [
          {
            id: 'ds-1',
            type: 'text',
            x: 200,
            y: 150,
            width: 300,
            height: 60,
            content: 'y = \\beta_0 + \\beta_1 x + \\epsilon',
            isFormula: true,
            strokeColor: '#006a61'
          },
          {
            id: 'ds-note',
            type: 'sticky',
            x: 520,
            y: 150,
            width: 185,
            height: 150,
            content: 'Linear regression model coefficients:\n\nβ0: Intercept\nβ1: Slope coef\n\nCheck residuals for homoscedasticity!',
            color: 'yellow'
          }
        ]
      };

      setBoards([newBoard, ...boards]);
      setActiveBoardId(newId);
    } else {
      setActiveBoardId(boardId);
    }
    setCurrentView('whiteboard');
  };

  const handleSaveBoard = (
    updatedElements: BoardElement[],
    title: string,
    extra?: { canvasMode?: 'normal' | 'unlimited'; totalPages?: number; currentPageIndex?: number }
  ) => {
    setBoards(prev => prev.map(b => {
      if (b.id === activeBoardId) {
        return {
          ...b,
          title,
          elements: updatedElements,
          modifiedAt: 'Modified Just Now',
          canvasMode: extra?.canvasMode !== undefined ? extra.canvasMode : b.canvasMode,
          totalPages: extra?.totalPages !== undefined ? extra.totalPages : b.totalPages,
          currentPageIndex: extra?.currentPageIndex !== undefined ? extra.currentPageIndex : b.currentPageIndex
        };
      }
      return b;
    }));
  };

  const handleDeleteBoard = (boardId: string) => {
    if (window.confirm('Are you sure you want to delete this whiteboard permanently?')) {
      setBoards(prev => prev.filter(b => b.id !== boardId));
    }
  };

  const handleCreateNewBoard = (
    templateType?: 'blank' | 'math' | 'physics' | 'chemistry',
    customTitle?: string,
    canvasModeSelected?: 'normal' | 'unlimited',
    periodSelected?: string
  ) => {
    const newId = `board-${Date.now()}`;
    let title = customTitle || 'Untitled Board';
    let elements: BoardElement[] = [];
    let image: string | undefined = undefined;

    if (templateType === 'math') {
      title = 'New Mathematics Board';
      elements = [
        {
          id: 'axis-x',
          type: 'shape',
          shapeType: 'arrow',
          x: 150,
          y: 400,
          width: 500,
          height: 400,
          strokeColor: '#474a4c',
          strokeWidth: 2,
          label: 'X-Axis'
        },
        {
          id: 'axis-y',
          type: 'shape',
          shapeType: 'arrow',
          x: 350,
          y: 500,
          width: 350,
          height: 150,
          strokeColor: '#474a4c',
          strokeWidth: 2,
          label: 'Y-Axis'
        },
        {
          id: 'math-formula',
          type: 'text',
          x: 180,
          y: 100,
          width: 300,
          height: 50,
          content: 'y = mx + b \\quad \\text{or} \\quad f(x) = x^2',
          isFormula: true,
          strokeColor: '#003fb1'
        },
        {
          id: 'math-sticky',
          type: 'sticky',
          x: 520,
          y: 120,
          width: 170,
          height: 140,
          content: 'Algebraic equations:\nUse the formula builder tool (∑) to insert more custom math structures.',
          color: 'yellow'
        }
      ];
    } else if (templateType === 'physics') {
      title = 'New Physics Board';
      elements = [
        {
          id: 'block',
          type: 'shape',
          shapeType: 'rect',
          x: 350,
          y: 300,
          width: 120,
          height: 80,
          strokeColor: '#003fb1',
          strokeWidth: 3,
          label: 'Box (mass m)'
        },
        {
          id: 'force-g',
          type: 'shape',
          shapeType: 'arrow',
          x: 410,
          y: 340,
          width: 410,
          height: 480,
          strokeColor: '#ba1a1a',
          strokeWidth: 2,
          label: 'Gravity (F = mg)'
        },
        {
          id: 'force-n',
          type: 'shape',
          shapeType: 'arrow',
          x: 410,
          y: 340,
          width: 410,
          height: 200,
          strokeColor: '#006a61',
          strokeWidth: 2,
          label: 'Normal Force (Fn)'
        },
        {
          id: 'phys-sticky',
          type: 'sticky',
          x: 520,
          y: 180,
          width: 180,
          height: 140,
          content: 'Frictional Forces:\nFf = μ · Fn\n\nSum of forces in Y axis balances out!',
          color: 'cyan'
        }
      ];
    } else if (templateType === 'chemistry') {
      title = 'New Chemistry Board';
      elements = [
        {
          id: 'chem-ring',
          type: 'shape',
          shapeType: 'hexagon',
          x: 300,
          y: 320,
          width: 100,
          height: 100,
          strokeColor: '#474a4c',
          strokeWidth: 3,
          label: 'Benzene C6H6'
        },
        {
          id: 'reaction',
          type: 'text',
          x: 200,
          y: 150,
          width: 400,
          height: 50,
          content: 'C_6H_6 + HNO_3 \\xrightarrow{H_2SO_4} C_6H_5NO_2 + H_2O',
          isFormula: true,
          strokeColor: '#ba1a1a'
        },
        {
          id: 'chem-sticky',
          type: 'sticky',
          x: 520,
          y: 220,
          width: 180,
          height: 140,
          content: 'Aromatic Substitution:\nNitration mechanism. Concentrated acids are required.',
          color: 'pink'
        }
      ];
    } else {
      title = 'New Blank Canvas';
    }

    const newBoard: Board = {
      id: newId,
      title: customTitle || title,
      modifiedAt: 'Modified Just Now',
      period: periodSelected || 'Period 1',
      elements,
      canvasMode: canvasModeSelected || 'unlimited',
      totalPages: canvasModeSelected === 'normal' ? 1 : undefined
    };

    setBoards(prev => [newBoard, ...prev]);
    setActiveBoardId(newId);
    setCurrentView('whiteboard');
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <>
      {!hasSelectedRole ? (
        <OnboardingView
          onSelectRole={(selectedRole) => {
            localStorage.setItem('stem_role_selected', selectedRole);
            setRole(selectedRole);
            setHasSelectedRole(true);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : currentView === 'dashboard' ? (
        <DashboardView
          boards={boards}
          sharedBoards={sharedBoards}
          onOpenBoard={handleOpenBoard}
          onCreateNewBoard={handleCreateNewBoard}
          onDeleteBoard={handleDeleteBoard}
          role={role}
          onChangeRole={setRole}
          isRoleLocked={isRoleLocked}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      ) : (
        activeBoard && (
          <WhiteboardView
            board={activeBoard}
            onBack={() => setCurrentView('dashboard')}
            onSaveBoard={handleSaveBoard}
            role={role}
            isRoleLocked={isRoleLocked}
          />
        )
      )}
    </>
  );
}
