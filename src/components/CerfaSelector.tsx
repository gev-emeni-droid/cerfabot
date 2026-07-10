import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { CerfaTemplate } from '../types';

interface CerfaSelectorProps {
  cerfaList: CerfaTemplate[];
  currentTemplate: CerfaTemplate | null;
  onTemplateSelect: (template: CerfaTemplate) => void;
}

export default function CerfaSelector({ 
  cerfaList,
  currentTemplate, 
  onTemplateSelect 
}: CerfaSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-4 w-full">
      <div className="w-full relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <select
          value={currentTemplate?.id || ""}
          onChange={(e) => {
            const tmpl = cerfaList.find(t => t.id === e.target.value);
            if (tmpl) onTemplateSelect(tmpl);
          }}
          className="block w-full pl-10 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-slate-50 border appearance-none text-slate-700 font-medium"
        >
          <option value="" disabled>Rechercher un modèle de formulaire dans le catalogue officiel...</option>
          {cerfaList.map(t => (
            <option key={t.id} value={t.id}>
              {t.cerfaNumber} - {t.name} {t.isCertified ? '✅' : ''}
            </option>
          ))}
        </select>
        {currentTemplate?.isCertified && (
          <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Certifié Officiel
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
