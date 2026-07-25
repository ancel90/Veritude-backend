import Parser from 'rss-parser';
import { put } from '@vercel/blob';

const parser = new Parser();
const RSS_URL = 'https://www.cnews.fr/rss/categorie/faits%20divers';

// Table de correspondance des codes météo Open-Meteo (WMO)
const WEATHER_CODES = {
  0: { description: "Ensoleillé", icon: "☀️" },
  1: { description: "Principalement dégagé", icon: "🌤️" },
  2: { description: "Partiellement nuageux", icon: "⛅" },
  3: { description: "Couvert", icon: "☁️" },
  45: { description: "Brouillard", icon: "🌫️" },
  48: { description: "Brouillard givrant", icon: "🌫️" },
  51: { description: "Bruine légère", icon: "🌧️" },
  53: { description: "Bruine modérée", icon: "🌧️" },
  55: { description: "Bruine dense", icon: "🌧️" },
  61: { description: "Pluie faible", icon: "🌧️" },
  63: { description: "Pluie modérée", icon: "🌧️" },
  65: { description: "Pluie forte", icon: "🌧️" },
  71: { description: "Neige faible", icon: "❄️" },
  73: { description: "Neige modérée", icon: "❄️" },
  75: { description: "Neige forte", icon: "❄️" },
  80: { description: "Averses de pluie", icon: "🌦️" },
  95: { description: "Orage", icon: "🌩️" }
};

// Liste des signes astrologiques
const SIGNES_ASTRO = [
  { id: "belier", nom: "Bélier", icone: "♈" },
  { id: "taureau", nom: "Taureau", icone: "♉" },
  { id: "gemeaux", nom: "Gémeaux", icone: "♊" },
  { id: "cancer", nom: "Cancer", icone: "♋" },
  { id: "lion", nom: "Lion", icone: "♌" },
  { id: "vierge", nom: "Vierge", icone: "♍" },
  { id: "balance", nom: "Balance", icone: "♎" },
  { id: "scorpion", nom: "Scorpion", icone: "♏" },
  { id: "sagittaire", nom: "Sagittaire", icone: "♐" },
  { id: "capricorne", nom: "Capricorne", icone: "♑" },
  { id: "verseau", nom: "Verseau", icone: "♒" },
  { id: "poissons", nom: "Poissons", icone: "♓" }
];

// Banque de phrases sur le ton "Véritude"
const INTROS = [
  "Sous l'impact d'une fluctuation quantique imprévue,",
  "La réfraction de la lumière lunaire indique que",
  "Selon les dernières mesures de pression atmosphérique,",
  "En raison d'un alignement orbital statistiquement rare,",
  "Les lois fondamentales de la thermodynamique confirment que",
  "L'analyse spectrométrique du ciel suggère que",
  "Face à la dérive inévitable des plaques tectoniques,",
  "L'observation rigoureuse des isotopes spatiaux montre que"
];

const PREDICTIONS = [
  "votre métabolisme va tenter de contourner la gravité.",
  "une prise de décision irrationnelle augmentera votre productivité de 0.4%.",
  "votre probabilité de renverser un liquide tiède approche les 89%.",
  "les micro-ondes de votre environnement perturberont votre logique.",
  "un pic de cortisol injustifié modifiera votre perception du temps.",
  "votre organisme rejettera catégoriquement tout effort inutile.",
  "votre niveau de patience atteindra un seuil critique avant midi.",
  "une coïncidence mathématique pure va vous troubler inutilement."
];

const CONSEILS = [
  "Évitez les objets angulaires et privilégiez l'eau tiède.",
  "Consultez un baromètre avant de répondre à vos emails.",
  "Ne faites confiance à aucun chiffre impair aujourd'hui.",
  "Respirez en fréquence 432 Hz pour limiter les dégâts.",
  "Marchez uniquement sur des surfaces planes jusqu'à nouvel ordre.",
  "Appliquez le principe de précaution : ne faites rien.",
  "Réduisez votre exposition aux opinions non vérifiées.",
  "Gardez vos pieds en contact avec le sol."
];

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export default async function handler(request, response) {
  // En-têtes CORS universels
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // ==========================================
    // 1. TRAITEMENT DES ACTUALITÉS (CNews)
    // ==========================================
    const feed = await parser.parseURL(RSS_URL);
    
    const formattedNews = feed.items.map((item, index) => ({
      id: (index + 1).toString(),
      titre: item.title || '',
      textecomplet: item.contentSnippet || item.content || ''
    }));

    const newsBlob = await put('news.json', JSON.stringify(formattedNews, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      storeId: process.env.BLOB_STORE_ID
    });

    // ==========================================
    // 2. TRAITEMENT DE LA MÉTÉO (Open-Meteo Paris)
    // ==========================================
    const resMeteo = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis'
    );
    const dataMeteo = await resMeteo.json();

    const weatherCode = dataMeteo.current.weather_code;
    const infoMeteo = WEATHER_CODES[weatherCode] || { description: "Variable", icon: "🌡️" };

    const meteoPayload = {
      ville: "Paris",
      temperature: Math.round(dataMeteo.current.temperature_2m),
      temp_min: Math.round(dataMeteo.daily.temperature_2m_min[0]),
      temp_max: Math.round(dataMeteo.daily.temperature_2m_max[0]),
      description: infoMeteo.description,
      icone: infoMeteo.icon,
      vent: Math.round(dataMeteo.current.wind_speed_10m),
      humidite: dataMeteo.current.relative_humidity_2m,
      mise_a_jour: new Date().toISOString()
    };

    const meteoBlob = await put('meteo.json', JSON.stringify(meteoPayload, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      storeId: process.env.BLOB_STORE_ID
    });

    // ==========================================
    // 3. TRAITEMENT DE L'HOROSCOPE (Générateur local "Véritude")
    // ==========================================
    const signesFormatted = {};
    SIGNES_ASTRO.forEach(s => {
      signesFormatted[s.id] = {
        signe: s.nom,
        icone: s.icone,
        texte: `${pickRandom(INTROS)} ${pickRandom(PREDICTIONS)} ${pickRandom(CONSEILS)}`
      };
    });

    const horoscopePayload = {
      date: new Date().toISOString().split('T')[0],
      signes: signesFormatted
    };

    const horoscopeBlob = await put('horoscope.json', JSON.stringify(horoscopePayload, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      storeId: process.env.BLOB_STORE_ID
    });

    // ==========================================
    // 4. RÉPONSE FINALE
    // ==========================================
    return response.status(200).json({ 
      success: true, 
      message: 'Actualités, Météo et Horoscope synchronisés avec succès !',
      newsUrl: newsBlob.url,
      meteoUrl: meteoBlob.url,
      horoscopeUrl: horoscopeBlob.url
    });

  } catch (error) {
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}