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
    // 1. On télécharge le flux RSS via un fetch natif (beaucoup plus stable sur Vercel)
    const rssResponse = await fetch(RSS_URL);
    if (!rssResponse.ok) {
      throw new Error(`Erreur CNews: ${rssResponse.status} ${rssResponse.statusText}`);
    }
    const xmlData = await rssResponse.text();

    // 2. On demande au parser de lire la chaîne XML reçue
    const feed = await parser.parseString(xmlData);
    
    // 3. Formatage des articles
    const formattedNews = feed.items.map((item, index) => ({
      id: (index + 1).toString(),
      titre: item.title || '',
      textecomplet: item.contentSnippet || item.content || ''
    }));

    // 4. Écriture sur le Blob Storage
    const blob = await put('news.json', JSON.stringify(formattedNews, null, 2), {
      access: 'private',
      addRandomSuffix: false
    });

    // 5. Réponse
    return response.status(200).json({ 
      success: true, 
      message: 'Flux RSS synchronisé avec succès !',
      url: blob.url 
    });

  } catch (error) {
    // Si ça coince, on renvoie l'erreur proprement au lieu de crasher anonymement
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}