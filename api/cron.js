import Parser from 'rss-parser';
import { put } from '@vercel/blob';

const parser = new Parser();
const RSS_URL = 'https://www.cnews.fr/rss/categorie/faits%20divers';

export default async function handler(request, response) {
  // 1. En-têtes CORS sécurisés et positionnés immédiatement
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si le navigateur fait juste une vérification (OPTIONS), on répond "OK" tout de suite
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // 2. Récupération du flux RSS
    const feed = await parser.parseURL(RSS_URL);
    
    // 3. Formatage
    const formattedNews = feed.items.map((item, index) => ({
      id: (index + 1).toString(),
      titre: item.title || '',
      textecomplet: item.contentSnippet || item.content || ''
    }));

    // 4. Écriture sur le Blob Storage (On repasse en privé comme demandé)
    const blob = await put('news.json', JSON.stringify(formattedNews, null, 2), {
      access: 'private',
      addRandomSuffix: false
    });

    // 5. Envoi de la réponse de succès
    return response.status(200).json({ 
      success: true, 
      message: 'Flux RSS synchronisé avec succès !',
      url: blob.url 
    });

  } catch (error) {
    // En cas d'erreur, on s'assure de ne renvoyer qu'UNE SEULE réponse propre
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}