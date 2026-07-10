import React from 'react';
import { FileText } from 'lucide-react';
import { CerfaTemplate, CerfaField } from '../types';

interface PdfViewerProps {
  template: CerfaTemplate | null;
  fields: CerfaField[];
  activeFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
}

export default function PdfViewer({
  template,
  fields,
  activeFieldId,
  onFieldSelect,
}: PdfViewerProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
            {template ? `Mode interactif - ${template.name}` : 'Aucun document'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex items-start justify-center relative min-h-[400px]">
        {!template && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in duration-500">
             <FileText className="h-16 w-16 mb-4 text-slate-200" />
             <p className="text-lg font-medium text-slate-600">Bienvenue sur CerfaBot</p>
             <p className="text-sm mt-2 max-w-sm text-slate-500">Sélectionnez un formulaire officiel dans la liste ci-dessus pour démarrer.</p>
          </div>
        )}

        {template && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-8 flex-1 bg-white relative font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-6 text-[10px] text-slate-500 font-serif">
                <div>
                  <p className="font-extrabold uppercase tracking-widest text-slate-800 text-[11px] font-sans">RÉPUBLIQUE FRANÇAISE</p>
                  <p className="italic">Ministère de l'Intérieur</p>
                  <p className="text-[9px] mt-1 font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit">CERFA {template.cerfaNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{template.name}</p>
                  <p className="italic text-[9px] text-slate-400 max-w-xs">{template.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {['identity', 'address', 'vehicle', 'other'].map((cat) => {
                  const catFields = fields.filter(f => f.category === cat);
                  if (catFields.length === 0) return null;

                  const catLabels: Record<string, string> = {
                    identity: "1. IDENTIFICATION DU DEMANDEUR / VENDEUR",
                    address: "2. COORDONNÉES ET ADRESSE",
                    vehicle: "3. RENSEIGNEMENTS SUR LE VÉHICULE OU L'ASSOCIATION",
                    other: "4. AUTRES MENTIONS OFFICIELLES"
                  };

                  return (
                    <div key={cat} className="space-y-3">
                      <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">{catLabels[cat]}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {catFields.map((f) => {
                          const isFilled = f.value !== '';
                          const isActive = activeFieldId === f.id;

                          return (
                            <div
                              key={f.id}
                              onClick={() => onFieldSelect(f.id)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                                isActive 
                                  ? 'bg-slate-900/[0.02] border-slate-900 shadow-xs ring-1 ring-slate-900/10' 
                                  : isFilled
                                  ? 'bg-emerald-50/[0.2] border-emerald-200 hover:border-emerald-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight truncate">{f.label}</span>
                                {isFilled && (
                                  <span className="inline-flex items-center rounded bg-emerald-50 px-1 py-0.2 text-[8px] font-bold text-emerald-700 border border-emerald-200">
                                    REMPLI
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs font-mono min-h-6 flex items-center ${isFilled ? 'text-slate-900 font-bold' : 'text-slate-400 italic'}`}>
                                {isFilled ? f.value : "Champ vide - Dictez une information"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
