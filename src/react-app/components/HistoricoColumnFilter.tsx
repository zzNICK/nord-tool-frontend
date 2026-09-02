import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownAZ, ArrowUpAZ, Funnel, Search, X } from 'lucide-react';

export type DirecaoOrdenacao = 'asc' | 'desc';

interface HistoricoColumnFilterProps {
  label: string;
  values: string[];
  selected: string[] | null;
  sortDirection: DirecaoOrdenacao | null;
  onApply: (values: string[] | null) => void;
  onSort: (direction: DirecaoOrdenacao) => void;
}

export const HistoricoColumnFilter = ({
  label, values, selected, sortDirection, onApply, onSort,
}: HistoricoColumnFilterProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>(selected ?? values);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const filteredValues = values.filter(value => value.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  const allVisibleSelected = filteredValues.every(value => draft.includes(value));
  const active = selected !== null || sortDirection !== null;

  useEffect(() => {
    if (!open) return;
    setDraft(selected ?? values);
    const positionMenu = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 256;
      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      });
    };
    positionMenu();
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [open, selected, values]);

  const toggleVisible = () => setDraft(current => allVisibleSelected
    ? current.filter(value => !filteredValues.includes(value))
    : [...new Set([...current, ...filteredValues])]);

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-1">
      <span>{label}</span>
      <button
        type="button"
        aria-label={`Filtrar coluna ${label}`}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className={`rounded p-1 transition-colors ${active ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
      ><Funnel size={13} fill={selected !== null ? 'currentColor' : 'none'} /></button>
      {open && createPortal(
        <div ref={menuRef} style={menuPosition} className="fixed z-[100] w-64 max-h-[calc(100vh-1rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-medium normal-case tracking-normal text-slate-700 shadow-xl">
          <button type="button" onClick={() => { onSort('asc'); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"><ArrowDownAZ size={16} /> Ordenar crescente</button>
          <button type="button" onClick={() => { onSort('desc'); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"><ArrowUpAZ size={16} /> Ordenar decrescente</button>
          <div className="relative my-2">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar valores" className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-7 outline-none focus:ring-2 focus:ring-emerald-500" />
            {query && <button type="button" aria-label="Limpar busca de valores" onClick={() => setQuery('')} className="absolute right-2 top-2 text-slate-400"><X size={14} /></button>}
          </div>
          <div className="max-h-52 overflow-auto border-y border-slate-100 py-1">
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="accent-emerald-600" /> Selecionar todos
            </label>
            {filteredValues.map(value => (
              <label key={value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                <input type="checkbox" checked={draft.includes(value)} onChange={() => setDraft(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} className="accent-emerald-600" />
                <span className="truncate" title={value}>{value}</span>
              </label>
            ))}
            {filteredValues.length === 0 && <p className="px-2 py-3 text-center text-slate-400">Nenhum valor</p>}
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <button type="button" onClick={() => { onApply(null); setOpen(false); }} className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100">Limpar</button>
            <button type="button" onClick={() => { onApply(draft.length === values.length ? null : draft); setOpen(false); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700">Aplicar</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
