import Parser from 'rss-parser';
import { put } from '@vercel/blob';

const parser = new Parser();
const RSS_URL = 'https://www.cnews.fr/rss/categorie/faits%20divers';

export default async function handler(request, response) {
  // En-têtes CORS universels
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // 1. Lecture et parsing du flux RSS
    const feed = await parser.parseURL(RSS_URL);
    
    // 2. Formatage des articles
    const formattedNews = feed.items.map((item, index) => ({
      id: (index + 1).toString(),
      titre: item.title || '',
      textecomplet: item.contentSnippet || item.content || ''
    }));

    // 3. Écriture sur le Blob Storage avec l'authentification OIDC
    const blob = await put('news.json', JSON.stringify(formattedNews, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      storeId: process.env.BLOB_STORE_ID // <-- On utilise votre variable ici !
    });

    // 4. Réponse
    return response.status(200).json({ 
      success: true, 
      message: 'Flux RSS synchronisé avec succès via OIDC !',
      url: blob.url 
    });

  } catch (error) {
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}