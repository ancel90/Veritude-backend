import Parser from 'rss-parser';
import { put } from '@vercel/blob';

const parser = new Parser();
const RSS_URL = 'https://www.cnews.fr/rss/categorie/faits%20divers';

export default async function handler(request, response) {
  try {
    // 1. Récupération du flux RSS
    const feed = await parser.parseURL(RSS_URL);
    
    // 2. Formatage des données
    const formattedNews = feed.items.map((item, index) => ({
      id: (index + 1).toString(),
      titre: item.title || '',
      textecomplet: item.contentSnippet || item.content || ''
    }));

    // 3. Écriture du fichier sur le Blob Storage
    const blob = await put('news.json', JSON.stringify(formattedNews, null, 2), {
      access: 'private',
      addRandomSuffix: false
    });

    return response.status(200).json({ 
      success: true, 
      message: 'Flux RSS synchronisé avec succès !',
      url: blob.url 
    });

  } catch (error) {
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}