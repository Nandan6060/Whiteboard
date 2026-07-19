import React from 'react';
import { Sigma, X } from 'lucide-react';

interface MathKeypadProps {
  onInsert: (symbol: string) => void;
  onClose: () => void;
  currentValue: string;
  onChangeValue: (val: string) => void;
  onConfirm: () => void;
}

export default function MathKeypad({
  onInsert,
  onClose,
  currentValue,
  onChangeValue,
  onConfirm,
}: MathKeypadProps) {
  const mathSymbols = [
    { label: 'x²', value: '^2' },
    { label: 'xʸ', value: '^' },
    { label: '√x', value: '\\sqrt{' },
    { label: '∫', value: '\\int ' },
    { label: '∫_a^b', value: '\\int_{a}^{b} ' },
    { label: 'a/b', value: '\\frac{' },
    { label: 'π', value: '\\pi' },
    { label: 'θ', value: '\\theta' },
    { label: 'α', value: '\\alpha' },
    { label: 'β', value: '\\beta' },
    { label: 'Δ', value: '\\Delta' },
    { label: '∞', value: '\\infty' },
    { label: 'sin', value: '\\sin(' },
    { label: 'cos', value: '\\cos(' },
    { label: 'tan', value: '\\tan(' },
    { label: 'ln', value: '\\ln(' },
    { label: 'log', value: '\\log(' },
    { label: 'Σ', value: '\\sum ' },
    { label: 'lim', value: '\\lim_{x \\to 0} ' },
    { label: '→', value: '\\to' },
    { label: '≠', value: '\\neq' },
    { label: '±', value: '\\pm' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
  ];

  return (
    <div id="math-keypad-panel" className="glass-panel p-4 rounded-xl shadow-2xl border border-outline-variant w-80 flex flex-col gap-3">
      <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30">
        <div className="flex items-center gap-1.5 text-primary">
          <Sigma className="w-5 h-5" id="sigma-icon" />
          <span className="font-display font-semibold text-sm">LaTeX Math Builder</span>
        </div>
        <button
          onClick={onClose}
          id="close-keypad-btn"
          className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono text-outline uppercase tracking-wider">Formula Input</label>
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="e.g., \int f(x) dx"
          id="latex-input-box"
          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg font-mono text-sm px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {mathSymbols.map((sym) => (
          <button
            key={sym.label}
            onClick={() => onInsert(sym.value)}
            id={`symbol-btn-${sym.label.replace(/\W/g, '')}`}
            className="bg-surface-container-low hover:bg-primary/10 hover:text-primary transition-all text-xs font-mono py-2 rounded-lg border border-outline-variant/30 text-center font-medium"
          >
            {sym.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center gap-2 mt-2 pt-2 border-t border-outline-variant/30">
        <button
          onClick={() => onChangeValue('')}
          id="clear-latex-btn"
          className="text-xs text-outline hover:text-error hover:bg-error-container/20 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onConfirm}
          id="confirm-latex-btn"
          className="bg-primary text-on-primary font-display font-medium text-xs px-4 py-1.5 rounded-lg hover:scale-95 transition-transform"
        >
          Insert Formula
        </button>
      </div>
    </div>
  );
}
