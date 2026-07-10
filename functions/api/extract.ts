export async function onRequestPost(context) {
  try {
    const request = context.request;
    const env = context.env;
    
    if (!env.AI) {
      return new Response(JSON.stringify({ error: "Liaison AI manquante. Configurez 'AI' dans le dashboard Cloudflare." }), { status: 500 });
    }

    const body = await request.json();
    const userText = body.userText;
    const fieldsStructure = body.fieldsStructure;

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

    // Using a reliable model
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages,
      max_tokens: 1024,
      temperature: 0.2
    });

    // Nettoyer la réponse au cas où le LLM a inclus du texte markdown (```json ... ```)
    let jsonString = "";
    if (typeof response === 'string') {
      jsonString = response;
    } else if (response && typeof response.response === 'string') {
      jsonString = response.response;
    } else {
      jsonString = JSON.stringify(response);
    }

    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }

    const extractedData = JSON.parse(jsonString);

    return new Response(JSON.stringify({ 
      success: true, 
      data: extractedData,
      raw_debug: response
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
