import React from 'react';
import { Search, Upload, FileText } from 'lucide-react';
import { CerfaTemplate } from '../types';
import { CERFA_LIST } from '../services/cerfaService';

interface CerfaSelectorProps {
  currentTemplate: CerfaTemplate | null;
  onTemplateSelect: (template: CerfaTemplate) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFileName: string | null;
}

export default function CerfaSelector({ 
  currentTemplate, 
  onTemplateSelect, 
  onFileUpload, 
  uploadedFileName 
}: CerfaSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      
      <div className="flex-1 w-full relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <select
          value={currentTemplate?.id || ""}
          onChange={(e) => {
            const tmpl = CERFA_LIST.find(t => t.id === e.target.value);
            if (tmpl) onTemplateSelect(tmpl);
          }}
          className="block w-full pl-10 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-slate-50 border appearance-none text-slate-700 font-medium"
        >
          <option value="" disabled>Rechercher ou sélectionner un modèle de formulaire...</option>
          {CERFA_LIST.map(t => (
            <option key={t.id} value={t.id}>
              {t.cerfaNumber} - {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
        
        <label className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm border border-indigo-100 whitespace-nowrap">
          <Upload className="h-4 w-4" />
          <span>{uploadedFileName ? 'Remplacer le PDF' : 'Charger un PDF local'}</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={onFileUpload}
          />
        </label>
      </div>
      
    </div>
  );
}
