const fs = require('fs');

let code = fs.readFileSync('src/services/cerfaService.ts', 'utf8');

const regex = /export async function simulateAIExtraction\([\s\S]*?\n\}/;

const newFunc = `export async function simulateAIExtraction(
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
}`;

if (regex.test(code)) {
  code = code.replace(regex, newFunc);
  fs.writeFileSync('src/services/cerfaService.ts', code);
  console.log("Remplacement réussi");
} else {
  console.log("Regex ne match pas");
}
