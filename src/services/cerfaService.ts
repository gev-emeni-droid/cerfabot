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
  
  onProgress('reading', 15, "Lecture et transmission du texte à l'IA Cloudflare...");
  
  const fieldsStructure = currentFields.map(f => ({
    id: f.id,
    label: f.label,
    type: f.type,
    category: f.category
  }));

  try {
    onProgress('analyzing', 45, "Analyse sémantique par Llama-3 (Workers AI)...");
    
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userText, fieldsStructure })
    });

    if (!response.ok) {
      throw new Error("Erreur API: " + response.statusText);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    const extractedData = result.data || {};

    onProgress('matching', 70, "Appariement avec les clés du formulaire Cerfa...");
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(500);

    onProgress('filling', 90, "Insertion des données structurées...");
    await delay(300);

    const updatedFields = currentFields.map(field => {
      const aiValue = extractedData[field.id];
      const hasNewValue = aiValue !== undefined && aiValue !== null && aiValue !== '';
      
      return {
        ...field,
        value: hasNewValue ? String(aiValue) : field.value,
        isExtracted: field.isExtracted || hasNewValue
      };
    });

    onProgress('completed', 100, "Données insérées avec succès !");
    return updatedFields;

  } catch (error) {
    console.error("Erreur lors de l'appel à l'IA:", error);
    throw error;
  }
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

/**
 * Remplit le fichier PDF original avec les données extraites et déclenche le téléchargement.
 */
export async function fillAndDownloadPdf(template: CerfaTemplate, fields: CerfaField[]): Promise<void> {
  if (!template.pdfUrl) {
    throw new Error("Fichier modèle PDF introuvable sur le serveur. Veuillez contacter l'administrateur.");
  }

  try {
    const response = await fetch(template.pdfUrl);
    if (!response.ok) {
      throw new Error(`Le fichier PDF n'a pas pu être chargé (statut: ${response.status}).`);
    }

    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    fields.forEach(f => {
      if (f.value) {
        try {
          const field = form.getTextField(f.id);
          if (field) {
            field.setText(f.value);
          }
        } catch (e) {
          // Si le champ n'est pas un TextField ou n'existe pas
          console.warn("Impossible de remplir le champ texte: " + f.id);
        }
      }
    });

    const pdfBytesFilled = await pdfDoc.save();
    const blob = new Blob([pdfBytesFilled], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cerfa_${template.cerfaNumber}_rempli.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    throw new Error(error.message || "Erreur lors de la génération du PDF.");
  }
}
