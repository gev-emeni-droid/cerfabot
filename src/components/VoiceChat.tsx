import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, User, AlertCircle, RefreshCw, Volume2, ArrowRight } from 'lucide-react';
import { Message, ExtractionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onAnalyzeAndFill: (text: string) => void;
  extractionStatus: ExtractionStatus;
  templateName: string;
  disabled?: boolean;
}

export default function VoiceChat({
  messages,
  onSendMessage,
  onAnalyzeAndFill,
  extractionStatus,
  templateName,
  disabled = false,
}: VoiceChatProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Suggestions de phrases de démo pour faciliter le test instantané
  const suggestions = [
    "Je m'appelle Jean Dupont, j'habite au 45 Rue de Rivoli à Paris.",
    "Je vends ma Peugeot 208 aujourd'hui. Mon immatriculation est AB-123-CD.",
    "Je m'appelle Sophie Martin, née le 15 mai 1990 à Marseille.",
    "Asso Club Photo Amateur (sigle CPA) pour promouvoir la photo à Toulouse."
  ];

  // Configurer la reconnaissance vocale au montage
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'fr-FR';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => {
        const space = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + space + transcript;
      });
    };

    rec.onerror = (event: any) => {
      console.error('Erreur reconnaissance vocale:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, []);

  // Défilement automatique vers le bas lors de l'envoi de messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, extractionStatus]);

  const toggleListening = () => {
    if (disabled) return;
    if (!speechSupported || !recognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Veuillez utiliser Google Chrome.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Échec du démarrage de la capture vocale:", err);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText('');
  };

  const handleSuggestionClick = (phrase: string) => {
    setInputText(phrase);
  };

  const triggerAnalysis = () => {
    if (!inputText.trim()) return;
    onAnalyzeAndFill(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">Assistant CerfaBot</span>
        </div>
        <div className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-slate-300">
          Modèle : {templateName}
        </div>
      </div>

      {/* Messages / Chat Flow */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[250px]">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="text-[10px] font-mono bg-slate-800/60 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg max-w-md text-center">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isBot
                    ? 'bg-slate-850 text-slate-200 border border-slate-800 rounded-tl-none'
                    : 'bg-indigo-600 text-white rounded-tr-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400/80">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.extractedFieldsCount !== undefined && msg.extractedFieldsCount > 0 && (
                    <span className="font-semibold text-emerald-400">+{msg.extractedFieldsCount} champs</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Extraction Status Indicator / Stepper */}
        <AnimatePresence>
          {extractionStatus.step !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Pipeline de Traitement IA</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400">{extractionStatus.progress}%</span>
              </div>

              {/* Steps visual track */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className={`h-1 rounded-full ${extractionStatus.progress >= 15 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <div className={`h-1 rounded-full ${extractionStatus.progress >= 45 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <div className={`h-1 rounded-full ${extractionStatus.progress >= 70 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <div className={`h-1 rounded-full ${extractionStatus.progress >= 90 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
              </div>

              <p className="text-[11px] text-slate-400 italic text-center font-mono">{extractionStatus.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-5 py-2.5 bg-slate-950/40 border-t border-slate-850/50 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none">
        {suggestions.map((phrase, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(phrase)}
            className="inline-block px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg max-w-[220px] truncate transition cursor-pointer"
            title={phrase}
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Voice visualizer wave */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 32, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-950/30 border-t border-rose-900/20 px-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-rose-400">
              <Volume2 className="h-3.5 w-3.5 animate-bounce" />
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider animate-pulse">Enregistrement actif... Parlez naturellement</span>
            </div>
            {/* Visualizer Wave Lines */}
            <div className="flex gap-0.5 h-3 items-center">
              <div className="w-[2px] h-2 bg-rose-400 animate-pulse" />
              <div className="w-[2px] h-3 bg-rose-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-[2px] h-1.5 bg-rose-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-[2px] h-3.5 bg-rose-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-[2px] h-2 bg-rose-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Inputs & Action Buttons */}
      <div className="p-4 bg-slate-950 border-t border-slate-850 flex flex-col gap-3">
        {/* Support speech recognition disclaimer */}
        {!speechSupported && (
          <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-[10px] text-amber-400 flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>La dictée vocale n'est pas gérée par Safari/Firefox. Privilégiez Google Chrome ou saisissez par texte.</span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Collez vos longs textes, tapez vos informations ou cliquez sur le micro..."
            className="flex-1 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 focus:border-slate-700 text-xs py-3.5 pl-4 pr-12 focus:outline-hidden text-white placeholder-slate-500 disabled:opacity-50 resize-none overflow-y-auto"
            style={{ minHeight: '52px', maxHeight: '150px' }}
            rows={1}
            disabled={disabled || extractionStatus.step !== 'idle'}
            id="chat-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputText.trim()) handleSend(e);
              }
            }}
          />

          {/* Micro Toggle button inside the input container for visual cleanliness */}
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-2 top-1.5 bottom-1.5 w-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' :
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Saisie vocale (Speech-to-Text)"
            id="mic-btn"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </form>

        {/* Action Button: Analyser & Remplir */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={triggerAnalysis}
            disabled={disabled || !inputText.trim() || extractionStatus.step !== 'idle'}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 text-xs transition shadow-md shadow-indigo-900/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            id="fill-btn"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analyser et Remplir avec l'IA
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </button>

          {/* Fallback simple text send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !inputText.trim() || extractionStatus.step !== 'idle'}
            className="px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Envoyer au chat"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
