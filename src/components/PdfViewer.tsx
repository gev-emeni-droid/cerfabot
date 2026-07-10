import React, { useRef, useState, useEffect } from 'react';
import { Upload, Eye, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { CerfaTemplate, CerfaField } from '../types';
import { inspectPdfFields } from '../services/cerfaService';

interface PdfViewerProps {
  template: CerfaTemplate;
  fields: CerfaField[];
  selectedTemplateId: string;
  onTemplateChange: (template: CerfaTemplate) => void;
  templates: CerfaTemplate[];
  onFileUploaded: (file: File) => void;
  uploadedFile: File | null;
  activeFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
}

export default function PdfViewer({
  template,
  fields,
  selectedTemplateId,
  onTemplateChange,
  templates,
  onFileUploaded,
  uploadedFile,
  activeFieldId,
  onFieldSelect,
}: PdfViewerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotate, setRotate] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [debugFields, setDebugFields] = useState<any[] | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Charger PDF.js dynamiquement depuis le CDN
  useEffect(() => {
    if (uploadedFile) {
      loadRealPdf(uploadedFile);
    }
  }, [uploadedFile, pageNum, scale, rotate]);

  const loadRealPdf = async (file: File) => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      // 1. Charger PDF.js s'il n'est pas déjà présent globalement
      const win = window as any;
      if (!win.pdfjsLib) {
        // Injecter le script principal de pdf.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Impossible de charger PDF.js CDN'));
        });
      }

      // Configurer le worker
      const pdfjsLib = win.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

      // 2. Lire le fichier sous forme de Uint8Array
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
          const pdf = await loadingTask.promise;
          
          setNumPages(pdf.numPages);
          
          // Récupérer la page courante
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale, rotation: rotate });
          
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: context,
                viewport: viewport,
              };
              await page.render(renderContext).promise;
            }
          }
          setPdfLoading(false);
        } catch (err: any) {
          console.error("Erreur de rendu du PDF :", err);
          setPdfError("Impossible de décoder et d'afficher le fichier PDF. Format possiblement endommagé ou protégé.");
          setPdfLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);

    } catch (err: any) {
      console.error(err);
      setPdfError("Une erreur est survenue lors du chargement de la bibliothèque PDF.js.");
      setPdfLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        onFileUploaded(file);
      } else {
        alert("Veuillez déposer un fichier au format PDF uniquement.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUploaded(e.target.files[0]);
    }
  };

  const handleInspectPdf = async () => {
    if (!uploadedFile) return;
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const fieldsInfo = await inspectPdfFields(new Uint8Array(arrayBuffer));
      setDebugFields(fieldsInfo);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'inspection des champs du PDF.");
    }
  };

  const selectSample = (tpl: CerfaTemplate) => {
    onTemplateChange(tpl);
    setPageNum(1);
    setNumPages(1);
    setScale(1.0);
    setRotate(0);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
            {uploadedFile ? uploadedFile.name : `Mode simulation - ${template.name}`}
          </span>
          {uploadedFile && (
            <button
              onClick={handleInspectPdf}
              className="ml-3 px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1.5 transition-colors uppercase tracking-wider"
              title="Sonde pour l'AcroForm"
            >
              <Eye className="h-3 w-3" />
              Sonde PDF
            </button>
          )}
        </div>

        {uploadedFile && (
          <div className="flex items-center gap-2">
            <button
              disabled={pageNum <= 1}
              onClick={() => setPageNum(pageNum - 1)}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="text-xs text-slate-600 font-mono">
              Page {pageNum} / {numPages}
            </span>
            <button
              disabled={pageNum >= numPages}
              onClick={() => setPageNum(pageNum + 1)}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            <button
              onClick={() => setScale(Math.max(0.6, scale - 0.1))}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="h-4 w-4 text-slate-600" />
            </button>
            <span className="text-xs text-slate-600 font-mono w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(1.8, scale + 0.1))}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="h-4 w-4 text-slate-600" />
            </button>

            <button
              onClick={() => setRotate((rotate + 90) % 360)}
              className="p-1 rounded hover:bg-slate-100 ml-1 transition-colors"
              title="Pivoter de 90°"
            >
              <RotateCw className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-start justify-center relative min-h-[400px]"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {/* Drag Over Active Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 transition-all duration-150">
            <div className="bg-white border-2 border-dashed border-slate-900 rounded-2xl p-8 max-w-sm text-center shadow-xl animate-pulse">
              <Upload className="h-10 w-10 text-slate-800 mx-auto mb-3" />
              <p className="font-semibold text-slate-900 text-sm">Déposez votre Cerfa PDF ici</p>
              <p className="text-xs text-slate-500 mt-1">Détection et appariement automatique par l'IA</p>
            </div>
          </div>
        )}

        {/* 1. PDF.js Canvas Rendering (Real PDF mode) */}
        {uploadedFile && !pdfError && (
          <div className="relative shadow-lg rounded-md overflow-hidden bg-white border border-slate-200">
            {pdfLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
                <span className="text-xs text-slate-600 font-medium mt-2 font-mono">Rendu PDF.js en cours...</span>
              </div>
            )}
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
            
            {/* Interactive Overlays on Canvas */}
            <div className="absolute inset-0 pointer-events-none">
              {fields.map((f) => {
                if (f.page !== pageNum) return null;
                const isActive = activeFieldId === f.id;
                const isFilled = f.value !== '';
                
                return (
                  <button
                    key={f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFieldSelect(f.id);
                    }}
                    className={`absolute pointer-events-auto rounded transition-all duration-200 group flex items-center justify-center cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900/10 border-2 border-slate-950 shadow-md ring-2 ring-slate-950/20 shadow-slate-900/10' 
                        : isFilled 
                        ? 'bg-emerald-500/5 border border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500' 
                        : 'bg-indigo-500/5 border border-dashed border-indigo-500/20 hover:bg-indigo-500/10 hover:border-indigo-500/50'
                    }`}
                    style={{
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      width: `${f.width}%`,
                      height: '2.8%',
                    }}
                    title={`${f.label} ${f.value ? `: ${f.value}` : '(vide)'}`}
                  >
                    {/* Floating pill tooltips */}
                    <span className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-tight whitespace-nowrap pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 z-20 ${
                      isActive ? 'bg-slate-950 text-white' : isFilled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {f.label}
                    </span>

                    {/* Extracted tiny indicator */}
                    {isFilled && (
                      <span className="absolute right-1 top-0.5 bottom-0.5 flex items-center px-1 text-[8px] font-bold bg-emerald-500 text-white rounded-xs">
                        IA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Beautiful Dynamic Document Simulation (No PDF uploaded, or error) */}
        {(!uploadedFile || pdfError) && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
            {pdfError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-semibold">Erreur de rendu PDF.js</p>
                  <p className="mt-0.5 text-rose-600/80">{pdfError}</p>
                  <p className="mt-1 font-medium underline cursor-pointer" onClick={() => setPdfError(null)}>
                    Retourner au mode simulation de document.
                  </p>
                </div>
              </div>
            )}

            {/* Template selector tabs */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Modèle sélectionné</span>
              <div className="flex gap-1.5">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => selectSample(tpl)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                      selectedTemplateId === tpl.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tpl.cerfaNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Grid Representation of the Cerfa page */}
            <div className="p-8 flex-1 bg-white relative font-sans">
              {/* French Republic Header Sim */}
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

              {/* Dynamic Interactive Fields Grouped by categories */}
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

              {/* PDF upload callout inside simulation */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center text-center">
                <p className="text-xs text-slate-500 mb-3 font-medium">Vous préférez uploader votre propre formulaire Cerfa PDF ?</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-medium transition shadow-sm cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Uploader un Cerfa PDF (Rendu PDF.js)
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload zone footer when previewing */}
      {uploadedFile && (
        <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Moteur PDF.js actif</span>
          </div>
          <button
            onClick={() => {
              onFileUploaded(null as any);
              setPageNum(1);
            }}
            className="text-slate-500 hover:text-slate-800 font-semibold transition"
          >
            Réinitialiser et effacer le PDF
          </button>
        </div>
      )}

      {/* Modal de débogage Sonde PDF */}
      {debugFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                Sonde d'inspection des champs (AcroForm)
              </h3>
              <button onClick={() => setDebugFields(null)} className="text-slate-400 hover:text-slate-600">
                Fermer
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {debugFields.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Aucun champ interactif trouvé dans ce PDF.</p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">ID du champ (name)</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Label Mappé (IA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {debugFields.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{f.name}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{f.type}</td>
                          <td className="px-4 py-2.5 text-indigo-600 font-medium text-xs">{f.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right flex justify-between items-center">
              <p className="text-xs text-slate-500 italic">Vérifiez la console (F12) pour l'array complet.</p>
              <button
                onClick={() => setDebugFields(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
