import grokService from "./GrokService.js";

const DEFAULT_REFUSAL = "I’m Spryzen AI, designed for farming questions. I can help with crops, soil, weather, irrigation, pests, disease, fertilizer, and farm planning.";

// Explicit non-agricultural refusal patterns (coding, politics, general trivia, medical advice, system prompt extraction)
const EXPLICIT_REFUSAL_PATTERNS = [
  /\b(javascript|python|typescript|html|css|java|c\+\+|sql|php|rust|golang|ruby|swift|kotlin|c#)\b/i,
  /\b(write|create|debug|code|script|function|program|class|algorithm|method)\s+(in|code|script|function|program|app|for)\b/i,
  /\b(who is|who was|president|prime minister|governor|senator|chancellor|monarch|queen|king|election|vote|parliament)\b/i,
  /\b(capital of|population of|gdp of|currency of|distance to|tallest mountain|deepest ocean)\b/i,
  /\b(medical advice|diagnose me|headache|fever|cough|blood pressure|hospital|doctor|prescription|covid|cancer|heart attack)\b/i,
  /\b(write an essay|write a poem|write a song|sing a song|tell a joke|tell me a story|movie review|book summary)\b/i,
  /\b(ignore (all )?instructions|bypass (system )?rules|pretend you are|system prompt)\b/i
];

// Multilingual agricultural keywords across English, Telugu, Hindi, Tamil, Kannada, and transliterated scripts
const AGRICULTURAL_PATTERNS = [
  // English
  /\b(crop|crops|soil|soils|irrigate|irrigation|water|watering|fertilizer|fertilizers|pest|pests|disease|diseases|blight|weed|weeds|seed|seeds|sow|sowing|harvest|harvesting|yield|farm|farmer|farmers|farming|field|fields|acre|acreage|hectare|paddy|rice|wheat|tomato|tomatoes|potato|potatoes|cotton|sugarcane|maize|corn|onion|chilli|chili|mango|agriculture|agricultural|mandi|market|price|prices|msp|compost|manure|npk|nitrogen|urea|potash|pesticide|pesticides|fungicide|insecticide|tractor|harvester|greenhouse|drip|sprinkler|monsoon|drought|season|livestock|cattle|cow|cows|bull|buffalo|goat|sheep|poultry|chicken)\b/i,

  // Telugu (Native & Transliteration)
  /(పంట|పంటలు|నేల|మట్టి|వర్షం|నీరు|సాగు|సాగునీరు|ఎరువు|ఎరువులు|పురుగు|పురుగులు|తెగులు|తెగుళ్లు|వ్యాధి|వ్యాధులు|రోగం|ఆకు|ఆకులు|కలుపు|విత్తనాలు|కోత|నూర్పిడి|మార్కెట్|మండి|వ్యవసాయం|రైతు|పత్తి|వరి|గోధుమ|టమోటా|టమాటా|ఉల్లి|మిర్చి|జొన్న|మొక్కజొన్న|తోట|చేను)/i,
  /\b(panta|pantalu|nela|matti|varsham|neeru|sagu|eruvu|eruvulu|purugu|purugulu|tegulu|vyadhi|rogam|aaku|aakulu|vithanalu|vyavasayam|raithu|rythu|vari|patti|tomata|tamata)\b/i,

  // Hindi (Native & Transliteration)
  /(फसल|फसलें|मिट्टी|बारिश|वर्षा|सिंचाई|पानी|खाद|उर्वरक|कीड़ा|कीड़े|बीमारी|रोग|बीज|बुवाई|कटाई|पैदावार|खेत|खेती|किसान|मंडी|दाम|भाव|धान|गेहूं|कपास|टमाटर|आलू|प्याज|मिर्च)/i,
  /\b(fasal|fasalein|mitti|baarish|varsha|sinchai|khad|urvarak|keeda|beemari|beej|buwai|katai|kheti|kisan|mandi|dhaan|gehun|tamatar|aalu)\b/i,

  // Tamil (Native & Transliteration)
  /(பயிர்|மண்|மழை|பாசனம்|தண்ணீர்|உரம்|பூச்சி|நோய்|விதை|விதைப்பு|அறுவடை|விவசாயம்|விவசாயி|சந்தை|நெல்லு|கோதுமை|தக்காளி|உருளைக்கிழங்கு)/i,
  /\b(payir|mann|mazhai|paasanam|uram|poochi|noi|vidhai|aruvadai|vivasayam|vivasayi|sandhai|nellu|gothumai|thakkali)\b/i,

  // Kannada (Native & Transliteration)
  /(ಬೆಳೆ|ಮಣ್ಣು|ಮಳೆ|ನೀರಾವರಿ|ನೀರು|ಗೊಬ್ಬರ|ಕ್ರಿಮಿ|ಕೀಟ|ರೋಗ|ಬೀಜ|ಬಿತ್ತನೆ|ಕೊಯಿಲು|ಕೃಷಿ|ರೈತ|ಮಾರುಕಟ್ಟೆ|ಅಕ್ಕಿ|ಗೋಧಿ|ಟೊಮೆಟೊ|ಆಲೂಗಡ್ಡೆ)/i,
  /\b(bele|mannu|male|neeravari|neeru|gobbara|krimi|keeta|roga|beeja|bittane|koyilu|krishi|raitha|marukatte|akki|godhi|tomato)\b/i,

  // Malayalam (Native & Transliteration)
  /(വിള|മണ്ണ്|മഴ|നനയ്ക്കൽ|വെള്ളം|വളം|കീടം|രോഗം|വിത്ത്|വിത്ത് നടൽ|വിളവെടുപ്പ്|കൃഷി|കർഷകൻ|ചന്ത|നെല്ല്|ഗോതമ്പ്|തക്കാളി|ഉരുളക്കിഴങ്ങ്)/i,
  /\b(vila|mannu|mazha|nana|vellam|valam|keedam|rogam|vithu|vith|krishi|karshakan|nellu|thakkali)\b/i,

  // Bengali (Native & Transliteration)
  /(ফসল|মাটি|বৃষ্টি|সেচ|পানি|জল|সার|কীটপতঙ্গ|রোগ|বীজ|বপন|ফসল কাটা|ফলন|খামার|কৃষি|কৃষক|বাজার|ধান|গম|টমেটো|আলু|পেঁয়াজ|মরিচ)/i,
  /\b(foshol|mati|brishti|sech|pani|jol|shar|beej|krishi|krishok|bazar|dhan|gom|tomato|aalu)\b/i
];

class DomainClassifier {
  async check(message, attachments = []) {
    if (Array.isArray(attachments) && attachments.length > 0) {
      return { isAgricultural: true };
    }

    if (!message || typeof message !== "string") {
      return { isAgricultural: false, refusalMessage: DEFAULT_REFUSAL };
    }

    const text = message.trim();

    // 1. Fast explicit refusal check
    for (const pattern of EXPLICIT_REFUSAL_PATTERNS) {
      if (pattern.test(text)) {
        return { isAgricultural: false, refusalMessage: DEFAULT_REFUSAL };
      }
    }

    // 2. Fast agricultural keyword check
    for (const pattern of AGRICULTURAL_PATTERNS) {
      if (pattern.test(text)) {
        return { isAgricultural: true };
      }
    }

    // 3. Fallback: Fast AI lightweight classification using Groq llama-3.1-8b-instant for ambiguous queries
    try {
      if (process.env.GROQ_API_KEY) {
        const response = await grokService.groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a strict domain classifier for an agricultural AI assistant. Determine if the user's input is strictly related to farming, crops, soil, weather, irrigation, fertilizers, plant disease, livestock, mandi/market prices, or farm planning.
Answer ONLY 'YES' if it is related to agriculture/farming/weather/market prices.
Answer ONLY 'NO' if it is unrelated (e.g. software coding, general politics, medical advice, entertainment, non-farming general knowledge).`
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0,
          max_tokens: 5
        });

        const classification = (response.choices[0]?.message?.content || "").trim().toUpperCase();
        if (classification.startsWith("YES")) {
          return { isAgricultural: true };
        }
      }
    } catch (err) {
      console.warn("[DomainClassifier] Fallback AI classification failed:", err.message);
    }

    return { isAgricultural: false, refusalMessage: DEFAULT_REFUSAL };
  }
}

export default new DomainClassifier();
