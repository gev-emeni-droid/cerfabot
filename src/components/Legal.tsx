import React, { useEffect } from 'react';
import { Shield, Info, ArrowLeft } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function Legal() {
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState<'mentions' | 'privacy'>('mentions');

  useEffect(() => {
    if (location.pathname === '/privacy') {
      setActiveTab('privacy');
    } else {
      setActiveTab('mentions');
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'application
          </Link>
        </div>
        <div className="font-bold text-slate-800 tracking-tight">CerfaBot.</div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 my-8 bg-white rounded-2xl shadow-sm border border-slate-200">
        {/* Header Tabs */}
        <div className="border-b border-slate-100 flex flex-wrap gap-4 pb-6 mb-8">
          <Link
            to="/legal"
            className={`font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
              activeTab === 'mentions' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Info className="h-5 w-5" />
            Mentions Légales
          </Link>
          <Link
            to="/privacy"
            className={`font-semibold flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
              activeTab === 'privacy' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="h-5 w-5" />
            Politique de Confidentialité
          </Link>
        </div>

        {/* Content */}
        <div className="text-sm text-slate-600 leading-relaxed">
          {activeTab === 'mentions' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Info className="h-6 w-6 text-indigo-600" />
                Mentions Légales
              </h2>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">1. Éditeur du site</h3>
                <p>Ce site est édité par [Nom de l'entreprise ou du développeur], [Statut juridique].</p>
                <p>Siège social : [Adresse]</p>
                <p>Email : [Adresse Email]</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">2. Directeur de la publication</h3>
                <p>Le directeur de la publication est [Nom du responsable].</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">3. Hébergement</h3>
                <p>Ce site est hébergé par Cloudflare, Inc.</p>
                <p>Siège social : 101 Townsend St, San Francisco, CA 94107, USA.</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">4. Propriété intellectuelle</h3>
                <p>L'ensemble de ce site relève des législations françaises et internationales sur le droit d'auteur et la propriété intellectuelle. Les formulaires Cerfa sont la propriété exclusive de l'État Français.</p>
              </section>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="h-6 w-6 text-indigo-600" />
                Politique de Confidentialité
              </h2>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">1. Traitement des formulaires et PDF</h3>
                <p>CerfaBot utilise une technologie de traitement "Client-Side" (côté client). <strong>Vos fichiers PDF ne quittent jamais votre navigateur.</strong> Ils ne sont pas uploadés, ni stockés sur nos serveurs.</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">2. Utilisation de l'Intelligence Artificielle</h3>
                <p>Les informations que vous dictez ou tapez dans la boîte de dialogue sont envoyées de manière sécurisée et chiffrée à un service d'Intelligence Artificielle tiers dans le seul but d'être structurées. Ces données <strong>ne sont pas utilisées pour entraîner le modèle</strong>.</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">3. Données personnelles et RGPD</h3>
                <p>Nous ne stockons aucune base de données de vos informations personnelles. L'application est dite "Stateless". Dès que vous fermez la page, vos données sont effacées de votre mémoire locale.</p>
              </section>
              <section className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base">4. Cookies</h3>
                <p>Ce site n'utilise que des cookies techniques strictement nécessaires à son fonctionnement. Nous n'utilisons aucun cookie de ciblage publicitaire.</p>
              </section>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} CerfaBot. Application Stateless & Privacy-First.
        </div>
      </footer>
    </div>
  );
}
