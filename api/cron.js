import Parser from 'rss-parser';
import { put } from '@vercel/blob';

const parser = new Parser();
const RSS_URL = 'https://www.cnews.fr/rss/categorie/faits%20divers';

export default async function handler(request, response) {
  // Optionnel : Sécurité pour vérifier que la requête provient bien du Cron Vercel
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Non autorisé' });
  }

  try {
    // 1. Récupération et parsing du flux RSS
    const feed = await parser.parseURL(RSS_URL);
    
    // 2. Formatage des données selon vos exigences
    const formattedNews = feed.items.map((item, index) => ({
      id: (index + 1).toString(),
      titre: item.title || '',
      textecomplet: item.contentSnippet || item.content || ''
    }));

    // 3. Stockage du fichier JSON sur Vercel Blob (accès public, écriture forcée)
    const blob = await put('news.json', JSON.stringify(formattedNews, null, 2), {
      access: 'public',
      addRandomSuffix: false // Permet de garder une URL fixe pour votre front-end
    });

    return response.status(200).json({ 
      success: true, 
      message: 'Flux RSS synchronisé avec succès',
      url: blob.url 
    });

  } catch (error) {
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}