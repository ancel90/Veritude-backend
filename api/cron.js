import Parser from 'rss-parser';
import { put } from '@vercel/blob';

const parser = new Parser();
const RSS_URL = 'https://www.cnews.fr/rss/categorie/faits%20divers';

export default async function handler(request, response) {
  // 1. Configuration des en-têtes CORS pour autoriser votre site local (et le futur en ligne)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gestion des requêtes de pré-vérification (OPTIONS) des navigateurs
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // 2. Récupération du flux RSS
    const feed = await parser.parseURL(RSS_URL);
    
    // 3. Formatage des données
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

    // 5. Réponse avec succès
    return response.status(200).json({ 
      success: true, 
      message: 'Flux RSS synchronisé avec succès !',
      url: blob.url 
    });

  } catch (error) {
    // Même en cas d'erreur, on garde le CORS pour voir le message d'erreur dans la console !
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}