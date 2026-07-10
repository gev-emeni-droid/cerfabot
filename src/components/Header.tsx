import React, { useState } from 'react';
import { Bot, HelpCircle, ArrowRight, Code, Shield, Sparkles, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const [showDoc, setShowDoc] = useState(false);

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white shadow-md shadow-slate-900/10">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-bold text-lg tracking-tight text-slate-900">CerfaBot</span>
                <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">v1.0 BETA</span>
              </div>
              <p className="text-xs text-slate-500 font-sans">Automatisation intelligente de formulaires Cerfa</p>
            </div>
          </div>

          {/* Status & Help Buttons */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs text-emerald-700 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Système Actif
            </div>

            <button
              onClick={() => setShowDoc(!showDoc)}
              className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition duration-150 shadow-sm"
              id="help-btn"
            >
              <Code className="h-4 w-4 text-slate-500" />
              <span>Blueprint Dev</span>
              <HelpCircle className="h-4 w-4 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Developer Blueprint Panel */}
      <AnimatePresence>
        {showDoc && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Client Flow */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm font-sans">1. Client / Frontend</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    L'interface capture l'audio de l'utilisateur (via l'API Web Speech) ou le texte saisi, ainsi que le document PDF original.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>Envoi au Cloudflare Worker sous forme de <code>FormData</code>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>Payload : <code>{"{ file: Blob, transcript: string }"}</code>.</span>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Cloudflare Worker */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm font-sans">2. Worker & LLM Parsing</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Le Worker traite la requête, extrait la structure ou fait un appel direct à l'API Gemini pour mapper sémantiquement les propos de l'utilisateur.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex items-start gap-1.5">
                      <span className="text-violet-500 font-bold">•</span>
                      <span>Usage de <strong>Gemini 3.5 Flash</strong> avec format de sortie <code>application/json</code>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-violet-500 font-bold">•</span>
                      <span>Retourne un dictionnaire structuré d'entités extraites.</span>
                    </li>
                  </ul>
                </div>

                {/* Column 3: PDF Generation */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm font-sans">3. PDF Rendering & Return</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Le Worker utilise la librairie <code>pdf-lib</code> pour charger le formulaire original et injecter les valeurs dans les champs AcroForm correspondants.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Champs éditables remplis via <code>form.getTextField()</code>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Fichier final renvoyé en flux binaire pour téléchargement.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Developer note */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-300">
                    <Code className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold font-mono">CODE DÉCOUPLÉ PRÊT POUR INTEGRATION WORKER</h4>
                    <p className="text-[11px] text-slate-400">La logique UI est entièrement séparée. Le fichier de service contient toutes les signatures d'appel API.</p>
                  </div>
                </div>
                <div className="text-xs font-mono bg-white/10 px-3 py-1.5 rounded border border-white/10 text-white flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
                  <span>services/cerfaService.ts</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
