/**
 * Service de traitement des Cerfa et intégration de l'IA (CerfaBot)
 * 
 * Ce fichier contient les données de démonstration (modèles de Cerfa) et la logique
 * de traitement. Il sépare proprement l'UI du traitement des données.
 * 
 * =========================================================================
 * ARCHITECTURE DE DONNÉES RECOMMANDÉE POUR LE MÉTIER (CLOUDFLARE WORKER + LLM)
 * =========================================================================
 * 
 * Lorsque vous connecterez cette interface à votre propre Cloudflare Worker ou 
 * API de traitement de données, voici le flux complet à implémenter :
 * 
 * 1. ÉTAPE 1 : Extraction de texte ou de structure du PDF
 *    - Côté Client : L'utilisateur charge le PDF. Nous pouvons envoyer le fichier 
 *      binaire directement au Worker sous forme de FormData ou de base64.
 *    - Côté Worker (ou Backend) :
 *      * Option A : Utiliser une bibliothèque comme `pdf-parse` pour extraire le texte brut du PDF.
 *      * Option B (Recommandée pour les Cerfa avec champs éditables) : Utiliser `pdf-lib` (Node/Worker-friendly)
 *        pour inspecter le formulaire AcroForm et lister les noms exacts des champs interactifs.
 *      * Option C (Vision) : Si le PDF est scanné, envoyer les images des pages au modèle LLM multimodal
 *        (comme gemini-3.5-flash) pour lire le document visuellement.
 * 
 * 2. ÉTAPE 2 : Construction du Prompt et Appel au LLM
 *    - Nous envoyons au LLM :
 *      a) Les informations de l'utilisateur (texte saisi ou transcrit de la voix).
 *      b) La liste des champs cibles identifiés (avec leur description ou label).
 *      c) Une consigne système (System Instruction) stricte pour formater la réponse.
 *    - Utiliser le format de sortie "Structured JSON" (JSON Schema) pour garantir que le LLM retourne
 *      uniquement un objet clé-valeur correspondant exactement aux champs attendus.
 * 
 * 3. ÉTAPE 3 : Remplissage du PDF (AcroForm)
 *    - Avec le JSON structuré renvoyé par le LLM, le Worker utilise `pdf-lib` pour :
 *      * Charger le PDF original : `const pdfDoc = await PDFDocument.load(pdfBytes)`
 *      * Récupérer le formulaire : `const form = pdfDoc.getForm()`
 *      * Remplir chaque champ : `form.getTextField('NomDeFamille').setText(jsonData.lastName)`
 *      * Sauvegarder le PDF modifié : `const filledPdfBytes = await pdfDoc.save()`
 *    - Le Worker renvoie ensuite ce fichier binaire au client avec les headers appropriés 
 *      (`Content-Type: application/pdf`).
 */

import { CerfaTemplate, CerfaField } from '../types';
import { PDFDocument } from 'pdf-lib';

export async function fetchCerfaCatalogue(): Promise<CerfaTemplate[]> {
  try {
    const response = await fetch('/master_cerfa_db.json');
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement du catalogue: ${response.statusText}`);
    }
    const data: CerfaTemplate[] = await response.json();
    return data;
  } catch (error) {
    console.error("Impossible de charger master_cerfa_db.json", error);
    return [];
  }
}

/**
 * SIMULATION DE L'IA (LLM EXPORT PATTERN)
 * Cette fonction simule l'appel au LLM que vous ferez dans le Cloudflare Worker.
 * Elle utilise des règles de parsing sémantique pour extraire des entités depuis le texte saisi.
 * 
 * En production, voici à quoi ressemble le prompt système du LLM :
 * -------------------------------------------------------------------------
 * Vous êtes un assistant expert en formulaires administratifs (Cerfa français).
 * Votre rôle est d'extraire des entités d'un texte transcrit vocalement 
 * ou saisi manuellement, et de les mapper vers les champs structurés du Cerfa.
 * 
 * CONTEXTE DU FORMULAIRE :
 * ${JSON.stringify(fieldsToFill.map(f => ({ id: f.id, label: f.label, type: f.type })))}
 * 
 * TEXTE DE L'UTILISATEUR :
 * "${userText}"
 * 
 * DIRECTIVE :
 * Extrayez le maximum d'informations possibles pour remplir les champs. 
 * Retournez exclusivement un objet JSON valide avec les clés correspondant 
 * exactement aux IDs des champs détectés. Ne faites aucune supposition 
 * fantaisiste, mais interprétez intelligemment les synonymes et les dates.
 * -------------------------------------------------------------------------
 */
export async function simulateAIExtraction(
  userText: string, 
  currentFields: CerfaField[],
  onProgress: (step: 'reading' | 'analyzing' | 'matching' | 'filling' | 'completed', progress: number, message: string) => void
): Promise<CerfaField[]> {
  
  // Phase 1 : Lecture et prétraitement
  onProgress('reading', 15, "Lecture et tokenisation du texte...");
  await delay(700);

  // Phase 2 : Analyse sémantique
  onProgress('analyzing', 45, "Analyse sémantique par l'IA (LLM)...");
  await delay(1000);

  // Phase 3 : Appariement des champs
  onProgress('matching', 70, "Appariement avec les clés du formulaire Cerfa...");
  await delay(800);

  // Phase 4 : Remplissage des champs
  onProgress('filling', 90, "Insertion des données structurées...");
  await delay(500);

  // Logique d'extraction sémantique simulée (mots-clés intelligents)
  const textLower = userText.toLowerCase();
  const updatedFields = currentFields.map(field => {
    let extractedValue = field.value;
    let found = false;

    // Aide à l'analyse sémantique selon l'ID du champ
    switch (field.id) {
      // Identité
      case 'vendeur_nom':
      case 'demandeur_nom':
        const nomMatch = userText.match(/(?:je m'appelle|mon nom est|nommé|nom :?)\s+([A-ZÀ-ÿa-z\-]+)\s+([A-ZÀ-ÿa-z\-]+)/i) ||
                         userText.match(/(?:vendeur|demandeur)\s+([A-ZÀ-ÿa-z\-]+)/i);
        if (nomMatch) {
          extractedValue = nomMatch[1].toUpperCase();
          found = true;
        } else if (textLower.includes("dupont")) {
          extractedValue = "DUPONT";
          found = true;
        } else if (textLower.includes("martin")) {
          extractedValue = "MARTIN";
          found = true;
        }
        break;

      case 'vendeur_prenom':
      case 'demandeur_prenoms':
      case 'asso_representant_prenom':
        const prenomMatch = userText.match(/(?:je m'appelle|mon prénom est|prénom :?)\s+([A-ZÀ-ÿa-z\-]+)/i);
        if (prenomMatch) {
          extractedValue = capitalizeFirstLetter(prenomMatch[1]);
          found = true;
        } else if (textLower.includes("jean")) {
          extractedValue = "Jean";
          found = true;
        } else if (textLower.includes("sophie")) {
          extractedValue = "Sophie";
          found = true;
        } else if (textLower.includes("pierre")) {
          extractedValue = "Pierre";
          found = true;
        }
        break;

      case 'acquereur_nom':
        const acqNomMatch = userText.match(/(?:acheté par|vendu à|acquéreur :?)\s+([A-ZÀ-ÿa-z\-]+)/i);
        if (acqNomMatch) {
          extractedValue = acqNomMatch[1].toUpperCase();
          found = true;
        } else if (textLower.includes("durand")) {
          extractedValue = "DURAND";
          found = true;
        } else if (textLower.includes("leclerc")) {
          extractedValue = "LECLERC";
          found = true;
        }
        break;

      case 'acquereur_prenom':
        const acqPrenomMatch = userText.match(/(?:l'acquéreur s'appelle|acheteur)\s+[A-Za-z\-]+\s+([A-Za-z\-]+)/i);
        if (acqPrenomMatch) {
          extractedValue = capitalizeFirstLetter(acqPrenomMatch[1]);
          found = true;
        } else if (textLower.includes("marie")) {
          extractedValue = "Marie";
          found = true;
        } else if (textLower.includes("durand")) {
          extractedValue = "Thomas";
          found = true;
        }
        break;

      // Véhicule
      case 'vehicule_immat':
        const immatMatch = userText.match(/[a-z]{2}-?\d{3}-?[a-z]{2}/i) || 
                           userText.match(/(?:immatriculé|immatriculation)\s+([A-Z0-9\-]+)/i);
        if (immatMatch) {
          extractedValue = immatMatch[0].toUpperCase().replace(/\s+/g, '');
          found = true;
        } else if (textLower.includes("ab-123-cd")) {
          extractedValue = "AB-123-CD";
          found = true;
        } else if (textLower.includes("cession d'un véhicule") || textLower.includes("voiture")) {
          extractedValue = "AA-456-ZZ";
          found = true;
        }
        break;

      case 'vehicule_vin':
        const vinMatch = userText.match(/[a-z0-9]{17}/i) || 
                         userText.match(/(?:vin|châssis|série)\s+([A-Z0-9]+)/i);
        if (vinMatch) {
          extractedValue = vinMatch[0].toUpperCase();
          found = true;
        } else if (textLower.includes("vin")) {
          extractedValue = "VF38C9HZC12345678";
          found = true;
        }
        break;

      case 'vehicule_marque':
        const marques = ["peugeot", "renault", "citroen", "audi", "bmw", "tesla", "toyota", "mercedes", "fiat", "volkswagen"];
        for (const m of marques) {
          if (textLower.includes(m)) {
            extractedValue = capitalizeFirstLetter(m);
            found = true;
            break;
          }
        }
        break;

      case 'vehicule_modele':
        const modeles = ["clio", "208", "twingo", "zoe", "golf", "model 3", "yaris", "sandero", "scenic"];
        for (const mod of modeles) {
          if (textLower.includes(mod)) {
            extractedValue = mod.toUpperCase();
            found = true;
            break;
          }
        }
        break;

      case 'vehicule_puissance':
        const puissanceMatch = userText.match(/(\d+)\s*(?:cv|puissance|chevaux|ch)/i);
        if (puissanceMatch) {
          extractedValue = puissanceMatch[1];
          found = true;
        } else if (textLower.includes("puissance") || textLower.includes("fiscale")) {
          extractedValue = "5";
          found = true;
        }
        break;

      // Adresses
      case 'vendeur_adresse':
        const adrVendeurMatch = userText.match(/(?:habitant au|résidant au|demeurant au|adresse :?)\s+([^,.\n]+)/i);
        if (adrVendeurMatch) {
          extractedValue = adrVendeurMatch[1];
          found = true;
        } else if (textLower.includes("adresse") && textLower.includes("paris")) {
          extractedValue = "45 Rue de Rivoli, 75001 Paris";
          found = true;
        }
        break;

      case 'acquereur_adresse':
        const adrAcqMatch = userText.match(/(?:l'acquéreur habite au|demeure au)\s+([^,.\n]+)/i);
        if (adrAcqMatch) {
          extractedValue = adrAcqMatch[1];
          found = true;
        } else if (textLower.includes("durand") && textLower.includes("lyon")) {
          extractedValue = "12 Avenue Jean Jaurès, 69007 Lyon";
          found = true;
        }
        break;

      case 'demandeur_adresse':
      case 'asso_adresse_siege':
        const adrGenMatch = userText.match(/(?:adresse|siège|habite au)\s+(?:est|au)?\s+([^,.\n]+)/i);
        if (adrGenMatch) {
          extractedValue = adrGenMatch[1];
          found = true;
        } else if (textLower.includes("rue")) {
          // Extraire l'adresse grossièrement
          const streetMatch = userText.match(/\d+[\s\w]+(?:rue|avenue|boulevard|place|chemin)[\s\w]+/i);
          if (streetMatch) {
            extractedValue = streetMatch[0];
            found = true;
          }
        }
        break;

      // Dates
      case 'date_cession':
        const dateMatch = userText.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/);
        if (dateMatch) {
          // Formatter en YYYY-MM-DD pour le type input date
          const parts = dateMatch[0].split(/[\/\-]/);
          extractedValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
          found = true;
        } else if (textLower.includes("aujourd'hui")) {
          const today = new Date();
          extractedValue = today.toISOString().split('T')[0];
          found = true;
        }
        break;

      case 'demandeur_date_naissance':
        const bdayMatch = userText.match(/né le\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) || 
                           userText.match(/naissance le\s+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
        if (bdayMatch) {
          const parts = bdayMatch[1].split(/[\/\-]/);
          extractedValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
          found = true;
        } else if (textLower.includes("naissance") || textLower.includes("né le")) {
          extractedValue = "1990-05-15";
          found = true;
        }
        break;

      // Demandes Générales
      case 'demandeur_ville_naissance':
        const villeMatch = userText.match(/(?:né à|naissance à)\s+([a-z\-]+)/i);
        if (villeMatch) {
          extractedValue = capitalizeFirstLetter(villeMatch[1]);
          found = true;
        } else if (textLower.includes("marseille")) {
          extractedValue = "Marseille";
          found = true;
        }
        break;

      case 'demandeur_taille':
        const tailleMatch = userText.match(/mesure\s+(\d+)\s*cm/i) || userText.match(/taille\s+d?e?\s*(\d+)/i);
        if (tailleMatch) {
          extractedValue = tailleMatch[1];
          found = true;
        } else if (textLower.includes("mesure 1m")) {
          const mMatch = userText.match(/1m(\d{2})/);
          if (mMatch) {
            extractedValue = "1" + mMatch[1];
            found = true;
          }
        }
        break;

      case 'demandeur_sexe':
        if (textLower.includes("femme") || textLower.includes("féminin") || textLower.includes("madame")) {
          extractedValue = "F";
          found = true;
        } else if (textLower.includes("homme") || textLower.includes("masculin") || textLower.includes("monsieur")) {
          extractedValue = "M";
          found = true;
        }
        break;

      case 'demandeur_telephone':
      case 'asso_telephone':
        const telMatch = userText.match(/0[1-9](?:\s*\d{2}){4}/) || userText.match(/téléphone\s*(?:est)?\s*([0-9\s]+)/i);
        if (telMatch) {
          extractedValue = telMatch[0].trim();
          found = true;
        }
        break;

      case 'demandeur_email':
      case 'asso_email':
        const emailMatch = userText.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
        if (emailMatch) {
          extractedValue = emailMatch[0].toLowerCase();
          found = true;
        }
        break;

      // Association
      case 'asso_titre':
        const titleMatch = userText.match(/(?:nom de l'association|s'appelle|titre)\s+([^,.\n]+)/i);
        if (titleMatch) {
          extractedValue = titleMatch[1];
          found = true;
        } else if (textLower.includes("association") && textLower.includes("amis")) {
          extractedValue = "Les Amis du Patrimoine Local";
          found = true;
        }
        break;

      case 'asso_sigle':
        const sigleMatch = userText.match(/(?:sigle|abréviation)\s+([^,.\n]+)/i);
        if (sigleMatch) {
          extractedValue = sigleMatch[1].toUpperCase().trim();
          found = true;
        } else if (textLower.includes("sigle")) {
          extractedValue = "APL";
          found = true;
        }
        break;

      case 'asso_objet':
        const objetMatch = userText.match(/(?:but|objet|mission)\s+d?e?\s*l'association\s+est\s+([^,.\n]+)/i);
        if (objetMatch) {
          extractedValue = objetMatch[1];
          found = true;
        } else if (textLower.includes("promouvoir") || textLower.includes("sauvegarder")) {
          extractedValue = "Promouvoir la culture locale et sauvegarder les monuments historiques de la commune.";
          found = true;
        }
        break;

      case 'asso_representant_nom':
        const repNomMatch = userText.match(/(?:président|représentant)\s+([A-Za-z\-]+)\s+([A-Za-z\-]+)/i);
        if (repNomMatch) {
          extractedValue = repNomMatch[2].toUpperCase();
          found = true;
        }
        break;
    }

    // Si aucune extraction directe mais qu'on a des phrases génériques de démo
    if (!found) {
      if (textLower.includes("remplir exemple") || textLower.includes("test")) {
        // Remplir de données de test selon le champ
        if (field.id === 'vehicule_immat') extractedValue = "AB-123-CD";
        if (field.id === 'vehicule_vin') extractedValue = "VF38C9HZC12345678";
        if (field.id === 'vehicule_marque') extractedValue = "Peugeot";
        if (field.id === 'vehicule_modele') extractedValue = "208";
        if (field.id === 'vehicule_puissance') extractedValue = "5";
        if (field.id === 'vendeur_nom') extractedValue = "DUPONT";
        if (field.id === 'vendeur_prenom') extractedValue = "Jean";
        if (field.id === 'vendeur_adresse') extractedValue = "45 Rue de Rivoli, 75001 Paris";
        if (field.id === 'acquereur_nom') extractedValue = "DURAND";
        if (field.id === 'acquereur_prenom') extractedValue = "Thomas";
        if (field.id === 'acquereur_adresse') extractedValue = "12 Avenue Jean Jaurès, 69007 Lyon";
        if (field.id === 'date_cession') extractedValue = new Date().toISOString().split('T')[0];
        
        if (field.id === 'demandeur_nom') extractedValue = "MARTIN";
        if (field.id === 'demandeur_prenoms') extractedValue = "Sophie";
        if (field.id === 'demandeur_date_naissance') extractedValue = "1994-08-22";
        if (field.id === 'demandeur_ville_naissance') extractedValue = "Marseille";
        if (field.id === 'demandeur_taille') extractedValue = "172";
        if (field.id === 'demandeur_sexe') extractedValue = "F";
        if (field.id === 'demandeur_pere_nom') extractedValue = "MARTIN Jacques";
        if (field.id === 'demandeur_mere_nom') extractedValue = "ALEXANDRE Jeanne";
        if (field.id === 'demandeur_adresse') extractedValue = "88 Rue de la République, 13002 Marseille";
        if (field.id === 'demandeur_telephone') extractedValue = "06 12 34 56 78";
        if (field.id === 'demandeur_email') extractedValue = "sophie.martin@example.com";

        if (field.id === 'asso_titre') extractedValue = "Club Photo Amateur";
        if (field.id === 'asso_sigle') extractedValue = "CPA";
        if (field.id === 'asso_objet') extractedValue = "Regrouper les passionnés de photographie argentique et numérique pour des ateliers.";
        if (field.id === 'asso_adresse_siege') extractedValue = "14 Rue des Arts, 31000 Toulouse";
        if (field.id === 'asso_telephone') extractedValue = "05 61 00 00 00";
        if (field.id === 'asso_email') extractedValue = "contact@clubphotoamateur.org";
        if (field.id === 'asso_representant_nom') extractedValue = "LEMOINE";
        if (field.id === 'asso_representant_prenom') extractedValue = "Julien";
        
        found = true;
      }
    }

    return {
      ...field,
      value: extractedValue,
      isExtracted: field.isExtracted || found || (extractedValue !== '' && extractedValue !== field.value)
    };
  });

  onProgress('completed', 100, "Données insérées avec succès !");
  return updatedFields;
}

// Helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Cette fonction simule l'exportation finale du Cerfa rempli.
 * Elle permet de télécharger un document texte récapitulatif
 * qui montre la structure AcroForm à alimenter dans le Cloudflare Worker.
 */
export function exportCerfaToTxt(template: CerfaTemplate, fields: CerfaField[]): string {
  let content = `======================================================\n`;
  content += `   CERFABOT - RÉCAPITULATIF DE REMPLISSAGE PDF\n`;
  content += `======================================================\n\n`;
  content += `Formulaire : ${template.name} (Cerfa N° ${template.cerfaNumber})\n`;
  content += `Date d'export : ${new Date().toLocaleString()}\n`;
  content += `Statut : Prêt pour injection de formulaire\n\n`;
  content += `------------------------------------------------------\n`;
  content += `DONNÉES EXTRAITES À TRANSMETTRE AU CLOUDFLARE WORKER\n`;
  content += `------------------------------------------------------\n`;

  const fieldsJson: Record<string, string> = {};
  fields.forEach(f => {
    fieldsJson[f.id] = f.value || "(vide)";
    content += `- ${f.label} (${f.id}) : ${f.value || "NON REMPLI"}\n`;
  });

  content += `\n------------------------------------------------------\n`;
  content += `PAYLOAD JSON ENVOYÉ AU LLM ET À L'API DE PDF-LIB :\n`;
  content += `------------------------------------------------------\n`;
  content += JSON.stringify(fieldsJson, null, 2);
  content += `\n\n======================================================\n`;
  content += `   COMMENT CONVERTIR CE CODE EN REMPLISSAGE PDF RÉEL :\n`;
  content += `======================================================\n`;
  content += `1. Installez 'pdf-lib' dans votre Cloudflare Worker ou Node server :\n`;
  content += `   npm install pdf-lib\n\n`;
  content += `2. Utilisez le code suivant pour injecter les données :\n`;
  content += `   import { PDFDocument } from 'pdf-lib';\n`;
  content += `   \n`;
  content += `   async function fillPdf(existingPdfBytes, fieldsData) {\n`;
  content += `     const pdfDoc = await PDFDocument.load(existingPdfBytes);\n`;
  content += `     const form = pdfDoc.getForm();\n`;
  content += `     \n`;
  content += `     // Mappage des champs interactifs\n`;
  fields.forEach(f => {
    content += `     form.getTextField('${f.id}').setText(fieldsData['${f.id}'] || '');\n`;
  });
  content += `     \n`;
  content += `     const pdfBytes = await pdfDoc.save();\n`;
  content += `     return pdfBytes;\n`;
  content += `   }\n`;

  return content;
}

/**
 * Fonction d'inspection (sonde) pour extraire les noms de champs d'un PDF chargé
 */
export async function inspectPdfFields(pdfBytes: Uint8Array | ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  const extractedFields = fields.map(f => {
    const name = f.getName();
    // Mapping sémantique temporaire pour les noms génériques
    let label = name;
    if (/^text/i.test(name)) {
      if (name.toLowerCase() === 'text1') label = 'Nom';
      else if (name.toLowerCase() === 'text2') label = 'Prénom';
      else label = `Champ texte générique (${name})`;
    }
    
    return { name, type: f.constructor.name, label };
  });

  console.log("=== INSPECTION DES CHAMPS DU PDF ===");
  console.table(extractedFields);
  console.log("====================================");

  return extractedFields;
}
