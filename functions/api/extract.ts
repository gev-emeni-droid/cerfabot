export interface Env {
  AI: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const request = context.request;
    const env = context.env;
    
    if (!env.AI) {
      throw new Error("Liaison AI manquante. Veuillez vérifier wrangler.toml.");
    }

    const { userText, fieldsStructure } = await request.json() as any;

    if (!userText || !fieldsStructure) {
      return new Response(JSON.stringify({ error: "userText et fieldsStructure requis" }), { status: 400 });
    }

    const systemPrompt = `Vous êtes un assistant expert en formulaires administratifs (Cerfa français).
Votre rôle est d'extraire des entités d'un texte transcrit vocalement ou saisi manuellement, et de les mapper vers les champs structurés du Cerfa.

CONTEXTE DU FORMULAIRE :
${JSON.stringify(fieldsStructure)}

DIRECTIVE :
Extrayez le maximum d'informations possibles du texte de l'utilisateur pour remplir les champs ci-dessus.
Retournez EXCLUSIVEMENT un objet JSON valide avec les clés correspondant exactement aux IDs des champs détectés.
Ne faites aucune supposition fantaisiste, mais interprétez intelligemment les synonymes et les dates.
Ne rajoutez aucun texte explicatif en dehors de l'objet JSON.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText }
    ];

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 1024,
      temperature: 0.2
    });

    // Nettoyer la réponse au cas où le LLM a inclus du texte markdown (```json ... ```)
    let jsonString = response.response;
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }

    const extractedData = JSON.parse(jsonString);

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
