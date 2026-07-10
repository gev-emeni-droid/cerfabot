import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import PdfViewer from './components/PdfViewer';
import FieldList from './components/FieldList';
import VoiceChat from './components/VoiceChat';
import { fetchCerfaCatalogue, simulateAIExtraction } from './services/cerfaService';
import { CerfaTemplate, CerfaField, Message, ExtractionStatus } from './types';
import { Sparkles, Bot, AlertCircle, FileText, CheckCircle, Loader2 } from 'lucide-react';
import Legal from './components/Legal';
import CerfaSelector from './components/CerfaSelector';

function Home() {
  const [cerfaList, setCerfaList] = useState<CerfaTemplate[]>([]);
  const [isLoadingCatalogue, setIsLoadingCatalogue] = useState(true);

  // Sélection du modèle de Cerfa (par défaut Vierge)
  const [currentTemplate, setCurrentTemplate] = useState<CerfaTemplate | null>(null);
  
  // Liste des champs en cours (clonés depuis le modèle courant)
  const [fields, setFields] = useState<CerfaField[]>([]);
  
  // Champ actuellement sélectionné dans l'interface pour coordination visuelle
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  
  // Statut détaillé du traitement de l'IA (pipeline d'extraction)
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>({
    step: 'idle',
    progress: 0,
    message: ''
  });

  // Liste d'historique du Chat
  const [messages, setMessages] = useState<Message[]>([]);

  // Synchroniser les champs lors du changement de modèle Cerfa
  useEffect(() => {
    async function loadCatalogue() {
      setIsLoadingCatalogue(true);
      const list = await fetchCerfaCatalogue();
      setCerfaList(list);
      setIsLoadingCatalogue(false);
    }
    loadCatalogue();
  }, []);

  useEffect(() => {
    if (!currentTemplate) {
      setFields([]);
      setMessages([{
        id: 'welcome-empty',
        sender: 'bot',
        text: `Bonjour ! Je suis l'assistant intelligent CerfaBot.\n\nVeuillez commencer par **sélectionner un modèle** dans la barre ci-dessus ou **importer un PDF local** pour démarrer l'analyse.`,
        timestamp: new Date()
      }]);
      setActiveFieldId(null);
      return;
    }

    setFields(currentTemplate.fields.map(f => ({ ...f, value: '' })));
    
    // Message de bienvenue initialisé selon le modèle
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      sender: 'bot',
      text: `Vous êtes actuellement sur le modèle : **${currentTemplate.name} (Cerfa ${currentTemplate.cerfaNumber})**.\n\nComment m'utiliser ?\n1. Activez le micro 🎤 en bas pour dicter vos informations, ou tapez-les au clavier.\n2. Cliquez sur **'Analyser et Remplir avec l'IA'**.\n3. Je vais mapper sémantiquement vos propos avec les cases correspondantes du document.`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, welcomeMessage]);
    setActiveFieldId(null);
  }, [currentTemplate]);



  // Modification manuelle d'un champ par l'utilisateur
  const handleFieldChange = (fieldId: string, value: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, value, isExtracted: false } : f));
  };

  // Vider la valeur d'un champ
  const handleClearField = (fieldId: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, value: '', isExtracted: false } : f));
  };

  // Réinitialiser tous les champs
  const handleResetAllFields = () => {
    setFields(prev => prev.map(f => ({ ...f, value: '', isExtracted: false })));
    
    const resetMsg: Message = {
      id: `reset-${Date.now()}`,
      sender: 'system',
      text: "🧹 Tous les champs du formulaire ont été réinitialisés.",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, resetMsg]);
  };

  // Sélection d'un champ
  const handleFieldSelect = (fieldId: string) => {
    setActiveFieldId(fieldId);
  };

  // Envoi d'un message classique de chat
  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    const botReply: Message = {
      id: `reply-${Date.now()}`,
      sender: 'bot',
      text: `Entendu ! J'ai placé votre déclaration dans le champ de saisie. \n\nCliquez sur **'Analyser et Remplir avec l'IA'** juste en dessous pour que je lise vos propos et remplisse automatiquement les cases du formulaire correspondantes.`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg, botReply]);
  };

  // Lancement du processus d'extraction d'IA sémantique
  const handleAnalyzeAndFill = async (text: string) => {
    // 1. Ajouter le message de l'utilisateur au fil d'actualité si besoin
    const userMsg: Message = {
      id: `user-extract-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. Lancer la barre de chargement d'extraction
    setExtractionStatus({
      step: 'reading',
      progress: 5,
      message: 'Initialisation de l\'analyse de document...'
    });

    try {
      // Calculer l'état initial des champs pour comparer après
      const initialFilledIds = new Set(fields.filter(f => f.value !== '').map(f => f.id));

      // Appel de la simulation d'IA (découplée de l'UI pour intégration future de Worker/Gemini)
      const parsedFields = await simulateAIExtraction(
        text,
        fields,
        (step, progress, message) => {
          setExtractionStatus({
            step,
            progress,
            message
          });
        }
      );

      // Calculer le nombre de nouveaux champs remplis
      const finalFilled = parsedFields.filter(f => f.value !== '');
      const newlyFilledCount = finalFilled.filter(f => !initialFilledIds.has(f.id)).length;

      // Mettre à jour l'état local des champs
      setFields(parsedFields);

      // 3. Ajouter la réponse de confirmation de l'IA
      const botResponseText = newlyFilledCount > 0 
        ? `✨ Analyse terminée ! J'ai extrait vos informations sémantiques et rempli **${newlyFilledCount} nouveaux champs** du Cerfa.\n\nVous pouvez réviser chaque case en surbrillance sur le document ou directement dans la colonne de droite, puis télécharger votre export !`
        : `Analyse terminée. Je n'ai pas détecté de nouvelles informations correspondant aux champs du Cerfa ${currentTemplate?.cerfaNumber || ''}. Réessayez en étant plus précis (ex: "Je m'appelle Jean Dupont").`;

      const botMsg: Message = {
        id: `bot-extract-res-${Date.now()}`,
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date(),
        extractedFieldsCount: newlyFilledCount
      };

      setMessages(prev => [...prev, botMsg]);
      setExtractionStatus({ step: 'idle', progress: 100, message: 'Terminé' });

    } catch (error) {
      console.error(error);
      setExtractionStatus({
        step: 'error',
        progress: 100,
        message: 'Une erreur est survenue lors de l\'extraction sémantique.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Intro Banner for SaaS */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Bot className="h-44.5 w-44.5 transform rotate-12" />
          </div>
          
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
                <Sparkles className="h-3 w-3" />
                Démonstrateur Interactif
              </span>
            </div>
            <h2 className="text-xl font-bold font-sans tracking-tight">Automatisez vos formulaires avec CerfaBot</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Téléversez un document PDF original éditables (via le moteur de rendu <strong>PDF.js</strong>) ou utilisez nos modèles interactifs de simulation pour tester notre IA vocale en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto">
            <div className="flex -space-x-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-900 text-xs font-bold text-slate-300">
                CF
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-900 text-xs font-bold text-slate-300">
                JS
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-slate-900 text-xs font-bold text-white">
                IA
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300">
              <p className="font-bold text-white">Prêt pour Cloudflare</p>
              <p className="text-[10px] text-slate-400">Export structuré</p>
            </div>
          </div>
        </div>

        {isLoadingCatalogue ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-white rounded-2xl shadow-sm border border-slate-200">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Chargement du catalogue officiel...</p>
          </div>
        ) : (
          <>
            {/* Sélecteur dynamique de Cerfa */}
            <CerfaSelector 
              cerfaList={cerfaList}
              currentTemplate={currentTemplate}
              onTemplateSelect={setCurrentTemplate}
            />

            {/* Primary 3-Column Bento Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column A: PDF Preview / Template Visualization (5/12 width on LG) */}
          <section className="lg:col-span-5 flex flex-col h-full min-h-[500px]" id="pdf-section">
            <PdfViewer
              template={currentTemplate}
              fields={fields}
              activeFieldId={activeFieldId}
              onFieldSelect={handleFieldSelect}
            />
          </section>

          {/* Column B: AI Voice Chat Copilot (4/12 width on LG) */}
          <section className="lg:col-span-4 flex flex-col h-full min-h-[500px]" id="chat-section">
            <VoiceChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onAnalyzeAndFill={handleAnalyzeAndFill}
              extractionStatus={extractionStatus}
              templateName={currentTemplate?.name || 'Aucun modèle'}
              disabled={!currentTemplate}
            />
          </section>

          {/* Column C: Manual Field list overrides (3/12 width on LG) */}
          <section className="lg:col-span-3 flex flex-col h-full min-h-[500px]" id="fields-section">
            <FieldList
              template={currentTemplate}
              fields={fields}
              onFieldChange={handleFieldChange}
              onClearField={handleClearField}
              onResetAllFields={handleResetAllFields}
              activeFieldId={activeFieldId}
              onFieldSelect={handleFieldSelect}
            />
          </section>

            </div>
          </>
        )}
      </main>

      {/* Footer Conforme */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CerfaBot. Application Stateless & Privacy-First.
          </p>
          <div className="flex gap-4 text-xs font-medium text-slate-500">
            <Link to="/legal" className="hover:text-indigo-600 transition-colors">
              Mentions Légales
            </Link>
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">
              Politique de Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/privacy" element={<Legal />} />
      </Routes>
    </Router>
  );
}
