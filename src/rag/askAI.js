import OpenAI from "openai";
import { search } from "./vectorStore";

const EXPERTS_API_URL = "/api/experts";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// ─── Predefined FAQ Knowledge Base ─────────────────────────────────────────
export const FAQ_KNOWLEDGE_BASE = [
  {
    question: "What does Trinity Agents actually do with AI automation?",
    answer: "Trinity Agents uses AI to automate complex workflows, combining logical steps with language models to handle repetitive tasks.",
  },
  {
    question: "How can Trinity Agents improve my business operations?",
    answer: "We enhance efficiency by automating manual processes, allowing you to handle much higher volume with less effort.",
  },
  {
    question: "What industries does Trinity Agents specialize in helping?",
    answer: "We serve a range of industries, from construction to healthcare, legal, retail, and more—providing tailored AI solutions.",
  },
  {
    question: "How quickly can an AI automation be built for my business?",
    answer: "Depending on complexity, many automations can be built in weeks, with some simpler ones ready even faster.",
  },
  {
    question: "Can you give me a real example of an AI automation transforming a process?",
    answer: "For example, AI can automate customer onboarding, handling verification steps that previously required manual input.",
  },
  {
    question: "What's the typical cost range for implementing AI automations?",
    answer: "Costs vary by scope, but many automations yield quick ROI, typically ranging from a few thousand to larger enterprise investments.",
  },
  {
    question: "Can you show me an example of a multi-agent system for my industry?",
    answer: "Sure! Tell us your industry, and we'll outline how multiple AI agents can collaborate—for instance, in retail, one might handle inventory while another manages customer support.",
  },
  {
    question: "How can Generative AI create digital personas tailored to my brand's identity?",
    answer: "It can generate unique, on-brand characters that represent your business in marketing materials or customer interactions.",
  },
  {
    question: "Could you show me how AI-generated content works for user-generated campaigns?",
    answer: "Absolutely! AI can produce on-brand content—like social posts or ad copy—mimicking user styles to boost engagement.",
  },
  {
    question: "In what ways can Generative AI produce custom documentation or unique audio tracks?",
    answer: "It can draft reports, manuals, or even produce branded audio, such as custom hold music or product explanations.",
  },
  {
    question: "How can a custom large language model act as a 24/7 help desk for my company?",
    answer: "A tailored model can answer customer queries instantly, reducing response times and improving customer satisfaction.",
  },
  {
    question: "Could we use a specialized language model to automate service bookings or internal tasks?",
    answer: "Yes, it can handle bookings, form filling, or even internal workflows, freeing up human time.",
  },
  {
    question: "How can a product demo help me validate my app idea before full development?",
    answer: "A demo lets you test user interactions and gather feedback before investing in the full build.",
  },
  {
    question: "What level of interactivity can I expect from a demo, and will it feel like the final product?",
    answer: "The demo will be interactive, showcasing key workflows—it won't be fully functional but will mimic the user experience closely.",
  },
  {
    question: "How do product demos help showcase complex systems, like ERP or specialized apps, to stakeholders?",
    answer: "Demos provide a visual, interactive model—stakeholders see the concept in action and understand how the system would work.",
  },
  {
    question: "How can a voice agent help handle customer inquiries in real time?",
    answer: "A voice agent responds instantly to customer questions, providing support without wait times.",
  },
  {
    question: "What types of tasks can a voice agent automate in my business?",
    answer: "It can handle tasks like appointment scheduling, order status updates, and more, freeing up staff.",
  },
  {
    question: "How natural-sounding and customizable are AI-powered voice agents for callers?",
    answer: "They're highly natural and customizable—you can adjust tone, scripts, and even branded phrases.",
  },
  {
    question: "How could AI help me in construction?",
    answer: "AI can optimize project scheduling for general contractors, automate site inspections for subcontractors, and provide predictive analytics for construction managers.",
  },
  {
    question: "How could AI help me in legal services?",
    answer: "AI can streamline contract review for law firms, automate compliance monitoring for in-house legal teams, and accelerate legal research by finding relevant case law.",
  },
  {
    question: "How could AI help me in insurance?",
    answer: "AI can personalize life insurance policies, expedite auto claims, and identify fraud risks in workers' comp or liability.",
  },
  {
    question: "How could AI help me in healthcare?",
    answer: "AI speeds up drug discovery, supports patient triage in client care, and assists medtech with predictive diagnostics.",
  },
  {
    question: "How could AI help me in retail and consumer goods?",
    answer: "AI personalizes e-commerce recommendations, optimizes restaurant inventory, and powers dynamic pricing in hospitality.",
  },
  {
    question: "How could AI help me in manufacturing?",
    answer: "AI predicts machinery maintenance, optimizes logistics routes, and forecasts demand in shipping.",
  },
  {
    question: "How could AI help me in real estate?",
    answer: "AI matches clients with properties, automates tenant management, and forecasts real estate trends for investors.",
  },
];

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lookupFAQ(question) {
  const q = normalize(question);
  for (const entry of FAQ_KNOWLEDGE_BASE) {
    if (normalize(entry.question) === q) return entry.answer;
  }
  return null;
}

const FALLBACK_EXPERTS = [
  {
    name: "BrianLee",
    base_price: 1750.0,
    description: "Co-Founder of LegalZoom ($2B IPO), The Honest Company ($1B IPO), ShoeDazzle, and BAM Ventures.",
    link: "https://intro.co/BrianLee?source=intro",
    image_url: "https://media.intro.co/avatars/1060682SHQ5Z-RM.jpg",
    increased_price: 2100.0
  },
  {
    name: "DaymondJohn",
    base_price: 1875.0,
    description: "Founder of FUBU, Star of ABC’s Shark Tank 🦈",
    link: "https://intro.co/daymondjohn?source=intro",
    image_url: "https://media.intro.co/avatars/1063346A974D-RM.jpg",
    increased_price: 2250.0
  },
  {
    name: "AlexisOhanian",
    base_price: 2000.0,
    description: "Founder of Reddit, Initialized, & 776.",
    link: "https://intro.co/AlexisOhanian?source=intro",
    image_url: "https://media.intro.co/avatars/1060682SHQ5Z-RM.jpg",
    increased_price: 2400.0
  },
  {
    name: "PaulEnglish",
    base_price: 1083.33,
    description: "Co-founder of KAYAK ($1.8B IPO), Moonbeam, and Lola. Serial entrepreneur in tech.",
    link: "https://intro.co/PaulEnglish?source=intro",
    image_url: "https://media.intro.co/avatars/1060682SHQ5Z-RM.jpg",
    increased_price: 1300.0
  }
];

async function fetchExperts() {
  try {
    const response = await fetch(EXPERTS_API_URL);
    const data = await response.json();
    return data.experts && data.experts.length > 0 ? data.experts : FALLBACK_EXPERTS;
  } catch (error) {
    console.warn("API Fetch failed, using fallback experts:", error);
    return FALLBACK_EXPERTS;
  }
}

export async function askAI(question) {
  const experts = await fetchExperts();
  
  const faqAnswer = lookupFAQ(question);
  if (faqAnswer) return faqAnswer;

  const results = await search(question);
  const context = results.map((r) => r.text).join("\n");

  const prompt = `
You are Trinity, a friendly and professional AI assistant for "Trinity Agents".
Your primary goal is to help users understand what Trinity Agents does, match them with the best consultant, and encourage them to book a discovery call.

Context information about Trinity Agents:
${context}

List of Available Experts/Consultants:
${JSON.stringify(experts, null, 2)}

Instructions:
1. If the user is just greeting you, respond warmly.
2. If the user has completed their questionnaire (details will be in the input) or asks for a recommendation, you MUST select the BEST consultant from the "Available Experts" list above.
3. CRITICAL: You MUST ALWAYS pick at least one expert if the list is not empty. Even if the match is not perfect, select the most relevant one. NEVER say "no experts available" or "no matches found" if there are experts in the list.
4. If you are recommending a consultant:
   - Your response MUST be a valid JSON object with the following structure:
     {
       "recommendation": true,
       "text": "Your professional response recommending the expert and why they fit.",
       "expertName": "EXACT_NAME_FROM_LIST (e.g., BrianLee)",
       "bookingLink": "https://calendly.com/cj-trinityagents/30min"
     }
5. If you are NOT recommending a consultant (general chat ONLY):
   - Your response MUST be a valid JSON object with the following structure:
     {
       "recommendation": false,
       "text": "Your helpful response."
     }
6. Keep the "text" part concise and professional.

User input/Question:
${question}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a specialized assistant that only outputs JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    const parsed = JSON.parse(response.choices[0].message.content);

    if (parsed.recommendation && parsed.expertName && experts.length > 0) {
      const match = experts.find(e => 
        e.name.toLowerCase() === parsed.expertName.toLowerCase().replace(/\s+/g, '')
      ) || experts[0]; 

      if (match) {
        return {
          ...parsed,
          expert: {
            name: match.name.replace(/([A-Z])/g, ' $1').trim(), 
            description: match.description,
            price: match.increased_price || (match.base_price * 1.2), 
            image: match.image_url
          }
        };
      }
    }
    
    return parsed;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return {
      recommendation: false,
      text: "I am currently having trouble connecting. It might be a momentary issue. Let me try to help you otherwise: Trinity Agents specializes in AI automations and custom agentic systems."
    };
  }
}