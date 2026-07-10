import React from 'react';
import { CerfaField, CerfaTemplate } from '../types';
import { User, MapPin, Car, HelpCircle, Download, RotateCcw, Check, Sparkles } from 'lucide-react';
import { exportCerfaToTxt } from '../services/cerfaService';

interface FieldListProps {
  template: CerfaTemplate;
  fields: CerfaField[];
  onFieldChange: (fieldId: string, value: string) => void;
  onClearField: (fieldId: string) => void;
  onResetAllFields: () => void;
  activeFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
}

export default function FieldList({
  template,
  fields,
  onFieldChange,
  onClearField,
  onResetAllFields,
  activeFieldId,
  onFieldSelect,
}: FieldListProps) {
  // Grouper les champs par catégorie
  const groupedFields: Record<string, CerfaField[]> = {
    identity: fields.filter(f => f.category === 'identity'),
    address: fields.filter(f => f.category === 'address'),
    vehicle: fields.filter(f => f.category === 'vehicle'),
    other: fields.filter(f => f.category === 'other'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity':
        return <User className="h-4 w-4 text-indigo-500" />;
      case 'address':
        return <MapPin className="h-4 w-4 text-violet-500" />;
      case 'vehicle':
        return <Car className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'identity':
        return 'Identité';
      case 'address':
        return 'Coordonnées & Adresse';
      case 'vehicle':
        return template.category === 'Automobile' ? 'Véhicule' : template.category === 'Professionnel' ? 'Association' : 'Détails du document';
      default:
        return 'Mentions complémentaires';
    }
  };

  const handleDownload = () => {
    const txtContent = exportCerfaToTxt(template, fields);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cerfabot_${template.id}_rempli.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filledCount = fields.filter(f => f.value !== '').length;
  const totalCount = fields.length;
  const fillPercentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Champs détectés</span>
          <button
            onClick={onResetAllFields}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Effacer tous les champs"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-700">Taux de complétion</span>
            <span className="font-mono font-bold text-slate-900">{filledCount} / {totalCount} ({fillPercentage}%)</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fields List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedFields).map(([category, catFields]) => {
          if (catFields.length === 0) return null;

          return (
            <div key={category} className="space-y-2.5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                {getCategoryIcon(category)}
                <span className="text-xs font-bold text-slate-700 font-sans tracking-tight">
                  {getCategoryLabel(category)}
                </span>
              </div>

              <div className="space-y-2">
                {catFields.map((field) => {
                  const isActive = activeFieldId === field.id;
                  const isFilled = field.value !== '';

                  return (
                    <div
                      key={field.id}
                      onClick={() => onFieldSelect(field.id)}
                      className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                          : isFilled
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 font-sans cursor-pointer">
                          {field.label}
                        </label>
                        {field.isExtracted && isFilled && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.2 text-[8px] font-bold text-emerald-700 border border-emerald-200">
                            <Sparkles className="h-2 w-2" />
                            IA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={field.value}
                          onChange={(e) => onFieldChange(field.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()} // Éviter de déclencher onFieldSelect
                          className="flex-1 min-w-0 bg-transparent text-xs font-mono text-slate-800 font-medium border-0 border-b border-transparent focus:border-slate-900 focus:ring-0 p-0 focus:outline-hidden"
                          placeholder="Cliquez pour saisir ou dictez..."
                        />
                        {isFilled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearField(field.id);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-medium hover:bg-slate-100 rounded px-1 cursor-pointer"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export / Download Action Button */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <button
          onClick={handleDownload}
          disabled={filledCount === 0}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium py-3 text-sm transition shadow-sm hover:shadow-md cursor-pointer"
          id="export-btn"
        >
          <Download className="h-4 w-4" />
          Télécharger l'export PDF-Lib
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2 leading-tight">
          Génère le script d'injection <code>pdf-lib</code> avec vos données à intégrer dans votre Cloudflare Worker.
        </p>
      </div>
    </div>
  );
}
