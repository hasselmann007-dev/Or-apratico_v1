/// <reference types="vite/client" />
import { GoogleGenAI } from '@google/genai';
import { QuoteItem } from '../types';

export function getGeminiApiKey(): string {
  try {
    const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
    if (meta?.env?.VITE_GEMINI_API_KEY) {
      return meta.env.VITE_GEMINI_API_KEY;
    }
  } catch {}
  try {
    const proc = typeof process !== 'undefined' ? (process as any) : undefined;
    if (proc?.env?.GEMINI_API_KEY) {
      return proc.env.GEMINI_API_KEY;
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('orcapratico_gemini_api_key');
      if (stored) return stored;
    }
  } catch {}
  return '';
}

export interface AISearchProduct {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  storeOrSource?: string;
  description?: string;
  sourceUrl?: string;
}

/**
 * Extracts JSON array from model output safely, handling markdown code fences, trailing commas, or conversational text.
 */
function extractJsonArray<T>(text: string): T[] {
  if (!text || typeof text !== 'string') return [];

  const cleanText = (str: string) => str.trim().replace(/,\s*([}\]])/g, '$1');

  // 1. Direct JSON parse
  try {
    const trimmed = cleanText(text);
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // 2. Remove markdown code fences ```json ... ```
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const cleanBlock = cleanText(codeBlockMatch[1]);
      const parsed = JSON.parse(cleanBlock);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') {
        const found = Object.values(parsed).find(v => Array.isArray(v));
        if (found) return found as T[];
      }
    }
  } catch {}

  // 3. Find bracket range [ ... ]
  try {
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    if (startIdx !== -1 && endIdx > startIdx) {
      const slice = cleanText(text.substring(startIdx, endIdx + 1));
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // 4. Object wrapper { "materiais": [...] }
  try {
    const startBrace = text.indexOf('{');
    const endBrace = text.lastIndexOf('}');
    if (startBrace !== -1 && endBrace > startBrace) {
      const slice = cleanText(text.substring(startBrace, endBrace + 1));
      const parsed = JSON.parse(slice);
      if (parsed && typeof parsed === 'object') {
        const found = Object.values(parsed).find(v => Array.isArray(v));
        if (found) return found as T[];
      }
    }
  } catch {}

  return [];
}

/**
 * Executes generateContent with multi-tier model fallbacks and tool degradation.
 */
async function generateWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  useSearch: boolean
): Promise<{ text: string; groundingChunks?: any[] }> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];

  // Try 1: with Google Search grounding tool across available models
  if (useSearch) {
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
        return { text: response.text || '', groundingChunks };
      } catch (err) {
        console.warn(`Search attempt with model ${model} failed, trying next option:`, err);
      }
    }
  }

  // Try 2: fallback without tools across models
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return { text: response.text || '' };
    } catch (err) {
      console.warn(`Direct generation with model ${model} failed:`, err);
    }
  }

  throw new Error('All Gemini model generation attempts failed');
}

/**
 * Search the web for products, materials, specifications, and prices using Google Gen AI with Google Search grounding.
 */
export async function searchProductsWithAI(query: string): Promise<AISearchProduct[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return getCuratedFallback(query);
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Você é um especialista orçamentista de construção civil e reformas no Brasil.
O usuário está orçando materiais e buscou por: "${query}".

Utilize a Pesquisa Google para consultar os preços médios reais atuais praticados no mercado brasileiro (em Reais R$), marcas conceituadas (ex: Suvinil, Coral, Quartzolit, Votoran, Tigre, Amanco, Tramontina, Deca, etc.) e lojas de referência (ex: Leroy Merlin, Telhanorte, Obramax, C&C, Mercado Livre).

Retorne de 2 a 5 produtos ou opções correspondentes à busca com preços de mercado realistas do Brasil.

IMPORTANTE: Responda APENAS com um array JSON válido, sem texto conversacional antes ou depois, seguindo este formato exato:
[
  {
    "name": "Nome completo do produto e marca (ex: Tinta Acrílica Fosca Rende Muito Coral 18L)",
    "category": "Pintura | Alvenaria | Piso | Hidráulica | Elétrica | Ferramentas | Drywall | Outros",
    "quantity": 1,
    "unit": "lata | galão | saco | un | m² | m | barra | kg | cx | rolo | pct",
    "estimatedUnitPrice": 289.90,
    "storeOrSource": "Loja ou fonte de referência encontrada (ex: Leroy Merlin)",
    "description": "Especificação rápida, rendimento aproximado ou acabamento",
    "sourceUrl": "https://link-da-loja-se-encontrado.com.br"
  }
]`;

  let responseText = '';
  let groundingChunks: any[] = [];

  try {
    const result = await generateWithFallback(ai, prompt, true);
    responseText = result.text;
    if (result.groundingChunks && Array.isArray(result.groundingChunks)) {
      groundingChunks = result.groundingChunks;
    }
  } catch (err) {
    console.warn('All Gemini API calls failed for search, using curated fallback:', err);
    return getCuratedFallback(query);
  }

  const parsedItems = extractJsonArray<any>(responseText);

  if (!parsedItems || parsedItems.length === 0) {
    return getCuratedFallback(query);
  }

  return parsedItems.map((item, index) => {
    const groundingChunk = groundingChunks[index % (groundingChunks.length || 1)];
    const groundingTitle = groundingChunk?.web?.title;
    const groundingUri = groundingChunk?.web?.uri;

    return {
      name: String(item.name || query),
      category: String(item.category || 'Materiais'),
      quantity: Math.max(0.01, Number(item.quantity) || 1),
      unit: String(item.unit || 'un'),
      estimatedUnitPrice: Math.max(0, Number(item.estimatedUnitPrice) || 0),
      storeOrSource: item.storeOrSource || groundingTitle || 'Pesquisa Web (Google)',
      description: item.description || '',
      sourceUrl: item.sourceUrl || groundingUri || undefined,
    };
  });
}

/**
 * Suggest a comprehensive list of materials and quantities based on the services in the quote.
 */
export async function suggestMaterialsForServices(services: QuoteItem[]): Promise<AISearchProduct[]> {
  if (!services || services.length === 0) {
    return [];
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return getCuratedSuggestionsFromServices(services);
  }
  const ai = new GoogleGenAI({ apiKey });

  const servicesDescription = services
    .map((s, idx) => {
      if (s.type === 'm2') {
        return `${idx + 1}. [${s.category}] ${s.description}: Área de ${s.area?.toFixed(2) || 0} m² (${s.length || 0}m x ${s.widthOrHeight || 0}m)`;
      }
      return `${idx + 1}. [${s.category}] ${s.description}: Serviço Fixo (${s.details || 'Sem detalhes adicionais'})`;
    })
    .join('\n');

  const prompt = `Você é um orçamentista sênior da construção civil brasileira.
Analise a seguinte lista de serviços que compõem um orçamento de obra/reforma:

${servicesDescription}

Sua tarefa:
1. Identifique todos os insumos, materiais e consumíveis essenciais necessários para realizar cada um desses serviços no padrão técnico profissional do Brasil.
2. Calcule quantidades estimadas realistas com base nas metragens (m²) e tipos de serviços fornecidos (exemplo: considerar rendimento de demãos de tinta, selador, massa corrida, argamassa colante AC-II/AC-III por m², rejunte, espaçadores, placas de drywall, perfis canaleta/montante, parafusos, lixas, etc.).
3. Forneça o preço unitário médio de mercado no Brasil (em R$) praticado em 2025/2026.

IMPORTANTE: Responda APENAS com um array JSON de materiais, sem nenhum texto explicativo fora do JSON:
[
  {
    "name": "Nome e especificação do material",
    "category": "Pintura | Alvenaria | Piso | Drywall | Hidráulica | Elétrica | Geral",
    "quantity": 2,
    "unit": "lata | galão | saco | un | m² | m | barra | kg | cx | rolo | pct",
    "estimatedUnitPrice": 150.00,
    "storeOrSource": "Média de Mercado BR",
    "description": "Justificativa/Cálculo: Ex: 2 latas de 18L para 80m² com 2 demãos"
  }
]`;

  let responseText = '';

  try {
    const result = await generateWithFallback(ai, prompt, true);
    responseText = result.text;
  } catch (err) {
    console.warn('Gemini suggest call failed, falling back to curated technical suggestions:', err);
    return getCuratedSuggestionsFromServices(services);
  }

  const parsed = extractJsonArray<any>(responseText);
  if (!parsed || parsed.length === 0) {
    return getCuratedSuggestionsFromServices(services);
  }

  return parsed.map((item) => ({
    name: String(item.name || 'Material'),
    category: String(item.category || 'Geral'),
    quantity: Math.max(0.01, Number(item.quantity) || 1),
    unit: String(item.unit || 'un'),
    estimatedUnitPrice: Math.max(0, Number(item.estimatedUnitPrice) || 0),
    storeOrSource: item.storeOrSource || 'Média de Mercado BR',
    description: item.description || '',
    sourceUrl: item.sourceUrl || undefined,
  }));
}

/**
 * Curated offline fallback products when network or API quota is unavailable
 */
function getCuratedFallback(query: string): AISearchProduct[] {
  const q = query.toLowerCase();

  if (q.includes('tint') || q.includes('pint') || q.includes('parede') || q.includes('rolo') || q.includes('selador') || q.includes('massa')) {
    return [
      {
        name: 'Tinta Acrílica Fosca Suvinil Rende Muito 18L Branca',
        category: 'Pintura',
        quantity: 1,
        unit: 'lata',
        estimatedUnitPrice: 389.90,
        storeOrSource: 'Leroy Merlin / Telhanorte',
        description: 'Rendimento de até 150m² acabados (2 demãos)',
      },
      {
        name: 'Massa Corrida PVA Coral Lata 18L / 28kg',
        category: 'Pintura',
        quantity: 1,
        unit: 'lata',
        estimatedUnitPrice: 94.50,
        storeOrSource: 'Obramax',
        description: 'Ideal para nivelar e corrigir paredes internas',
      },
      {
        name: 'Selador Acrílico Suvinil 18L',
        category: 'Pintura',
        quantity: 1,
        unit: 'lata',
        estimatedUnitPrice: 139.90,
        storeOrSource: 'Telhanorte',
        description: 'Uniformiza a absorção da alvenaria e economiza tinta',
      },
      {
        name: 'Rolo de Lã de Carneiro Antigota 23cm com Cabo Tigre',
        category: 'Pintura',
        quantity: 2,
        unit: 'un',
        estimatedUnitPrice: 38.00,
        storeOrSource: 'C&C',
        description: 'Aplicação uniforme com mínimo de respingos',
      },
      {
        name: 'Fita Crepe Pintor 48mm x 50m Norton/3M',
        category: 'Pintura',
        quantity: 3,
        unit: 'un',
        estimatedUnitPrice: 18.50,
        storeOrSource: 'Mercado Livre',
        description: 'Proteção de rodapés, marcos e tomadas',
      },
    ];
  }

  if (q.includes('piso') || q.includes('porcelan') || q.includes('argamass') || q.includes('rejunt') || q.includes('nivelador')) {
    return [
      {
        name: 'Argamassa Colante AC-III Branca Quartzolit 20kg',
        category: 'Piso',
        quantity: 5,
        unit: 'saco',
        estimatedUnitPrice: 42.90,
        storeOrSource: 'Obramax / Leroy Merlin',
        description: 'Para porcelanatos internos e externos até 120x120cm',
      },
      {
        name: 'Rejunte Acrílico Pronto Quartzolit 1kg',
        category: 'Piso',
        quantity: 3,
        unit: 'un',
        estimatedUnitPrice: 34.90,
        storeOrSource: 'Telhanorte',
        description: '100% impermeável, antimofo e acabamento liso',
      },
      {
        name: 'Espaçador e Nivelador de Piso Cortag (Pacote com 100 peças)',
        category: 'Piso',
        quantity: 2,
        unit: 'pct',
        estimatedUnitPrice: 49.90,
        storeOrSource: 'Leroy Merlin',
        description: 'Garante assentamento plano sem dentes',
      },
      {
        name: 'Porcelanato Polido Esmaltado 80x80cm Retificado',
        category: 'Piso',
        quantity: 15,
        unit: 'm²',
        estimatedUnitPrice: 89.90,
        storeOrSource: 'Leroy Merlin / Telhanorte',
        description: 'Piso de alto tráfego com acabamento brilhante',
      },
    ];
  }

  if (q.includes('gesso') || q.includes('drywall') || q.includes('forro') || q.includes('perfil') || q.includes('montante')) {
    return [
      {
        name: 'Placa de Gesso Drywall ST 120x180cm 12,5mm Placo',
        category: 'Drywall',
        quantity: 8,
        unit: 'un',
        estimatedUnitPrice: 48.00,
        storeOrSource: 'Obramax',
        description: 'Placa standard para paredes e forros internos',
      },
      {
        name: 'Perfil Montante para Drywall 48mm x 3m Galvanizado',
        category: 'Drywall',
        quantity: 10,
        unit: 'barra',
        estimatedUnitPrice: 26.50,
        storeOrSource: 'Telhanorte',
        description: 'Estruturação metálica resistente',
      },
      {
        name: 'Massa para Junta Drywall Knauf / Placo Balde 15kg',
        category: 'Drywall',
        quantity: 1,
        unit: 'un',
        estimatedUnitPrice: 68.00,
        storeOrSource: 'Leroy Merlin',
        description: 'Tratamento de juntas com fita de papel',
      },
      {
        name: 'Parafuso Drywall Fosfatado GN25 Ponta Agulha (CxF 500un)',
        category: 'Drywall',
        quantity: 1,
        unit: 'cx',
        estimatedUnitPrice: 32.50,
        storeOrSource: 'Obramax',
        description: 'Fixação firme das placas nos montantes',
      },
    ];
  }

  if (q.includes('cimento') || q.includes('alvenaria') || q.includes('tijol') || q.includes('areia') || q.includes('reboco') || q.includes('concreto')) {
    return [
      {
        name: 'Cimento CP II-E-32 Votoran / Cauê 50kg',
        category: 'Alvenaria',
        quantity: 4,
        unit: 'saco',
        estimatedUnitPrice: 36.90,
        storeOrSource: 'Depósito de Construção',
        description: 'Uso geral em rebocos, contrapisos e alvenaria',
      },
      {
        name: 'Areia Média Lavada Saco 20kg',
        category: 'Alvenaria',
        quantity: 10,
        unit: 'saco',
        estimatedUnitPrice: 8.50,
        storeOrSource: 'Obramax',
        description: 'Preparo de argamassa de assentamento e reboco',
      },
      {
        name: 'Impermeabilizante Vedacit Pote 3,6kg',
        category: 'Alvenaria',
        quantity: 1,
        unit: 'galão',
        estimatedUnitPrice: 49.90,
        storeOrSource: 'Leroy Merlin',
        description: 'Bloqueio de umidade e infiltrações na fundação/reboco',
      },
    ];
  }

  if (q.includes('hidráulic') || q.includes('cano') || q.includes('tubo') || q.includes('tigre') || q.includes('amanco') || q.includes('esgoto')) {
    return [
      {
        name: 'Tubo Soldável PVC 25mm (3/4") Barra 6m Tigre',
        category: 'Hidráulica',
        quantity: 3,
        unit: 'barra',
        estimatedUnitPrice: 25.90,
        storeOrSource: 'Telhanorte',
        description: 'Tubulação para condução de água fria predial',
      },
      {
        name: 'Kit Conexões Joelho 90° e Tê 25mm Tigre (10 peças)',
        category: 'Hidráulica',
        quantity: 1,
        unit: 'pct',
        estimatedUnitPrice: 34.00,
        storeOrSource: 'Obramax',
        description: 'Conexões essenciais para ramais hidráulicos',
      },
      {
        name: 'Adesivo Plástico para PVC 175g Tigre',
        category: 'Hidráulica',
        quantity: 1,
        unit: 'un',
        estimatedUnitPrice: 18.90,
        storeOrSource: 'Leroy Merlin',
        description: 'Soldagem a frio de canos e conexões',
      },
      {
        name: 'Fita Veda Rosca 18mm x 50m Tigre',
        category: 'Hidráulica',
        quantity: 2,
        unit: 'un',
        estimatedUnitPrice: 9.50,
        storeOrSource: 'Depósito Local',
        description: 'Vedação segura de conexões rosqueáveis',
      },
    ];
  }

  if (q.includes('elétric') || q.includes('fio') || q.includes('cabo') || q.includes('disjuntor') || q.includes('tomada')) {
    return [
      {
        name: 'Cabo Flexível 2,5mm² 750V Rolo 100m Sil',
        category: 'Elétrica',
        quantity: 1,
        unit: 'rolo',
        estimatedUnitPrice: 189.90,
        storeOrSource: 'Obramax / Mercado Livre',
        description: 'Instalação de tomadas residenciais e circuitos gerais',
      },
      {
        name: 'Disjuntor Termomagnético Monopolar DIN 20A Steck',
        category: 'Elétrica',
        quantity: 2,
        unit: 'un',
        estimatedUnitPrice: 16.90,
        storeOrSource: 'Telhanorte',
        description: 'Proteção contra curtos e sobrecargas',
      },
      {
        name: 'Fita Isolante 3M Imperial 19mm x 20m',
        category: 'Elétrica',
        quantity: 2,
        unit: 'un',
        estimatedUnitPrice: 11.50,
        storeOrSource: 'Leroy Merlin',
        description: 'Isolação antichama classe A até 750V',
      },
      {
        name: 'Eletroduto Corrugado Amarelo 3/4" Rolo 50m',
        category: 'Elétrica',
        quantity: 1,
        unit: 'rolo',
        estimatedUnitPrice: 62.00,
        storeOrSource: 'Obramax',
        description: 'Passagem embutida em paredes e lajes',
      },
    ];
  }

  // Generic fallback based on input
  return [
    {
      name: query.trim() || 'Material para Obra / Construção',
      category: 'Geral',
      quantity: 1,
      unit: 'un',
      estimatedUnitPrice: 95.00,
      storeOrSource: 'Estimativa de Mercado Nacional (Google)',
      description: 'Preço médio de referência de mercado',
    },
  ];
}

/**
 * Curated suggestions generated from quote services when API is unavailable
 */
function getCuratedSuggestionsFromServices(services: QuoteItem[]): AISearchProduct[] {
  const suggestions: AISearchProduct[] = [];

  for (const s of services) {
    const cat = (s.category || '').toLowerCase();
    const desc = (s.description || '').toLowerCase();
    const combined = `${cat} ${desc} ${(s.details || '').toLowerCase()}`;
    const area = s.area && s.area > 0 ? s.area : 30;

    if (combined.includes('pint') || combined.includes('tinta') || combined.includes('verniz') || combined.includes('emassa')) {
      const latas = Math.max(1, Math.ceil(area / 80));
      suggestions.push({
        name: 'Tinta Acrílica Fosca Premium 18L (Suvinil / Coral)',
        category: 'Pintura',
        quantity: latas,
        unit: 'lata',
        estimatedUnitPrice: 389.90,
        storeOrSource: 'Leroy Merlin / Obramax',
        description: `Estimativa para ${area.toFixed(1)}m² (2 a 3 demãos)`,
      });
      suggestions.push({
        name: 'Massa Corrida PVA Balde/Lata 18L (28kg)',
        category: 'Pintura',
        quantity: Math.max(1, Math.ceil(area / 60)),
        unit: 'lata',
        estimatedUnitPrice: 92.00,
        storeOrSource: 'Obramax / Telhanorte',
        description: 'Preparação, correção e emassamento das paredes',
      });
      suggestions.push({
        name: 'Fundo Preparador ou Selador Acrílico 18L',
        category: 'Pintura',
        quantity: Math.max(1, Math.ceil(area / 120)),
        unit: 'lata',
        estimatedUnitPrice: 135.00,
        storeOrSource: 'Depósito de Construção',
        description: 'Uniformização da absorção da superfície',
      });
      suggestions.push({
        name: 'Kit Pintura (Rolo Antigota 23cm, Trincha, Lixas e Bandeja)',
        category: 'Pintura',
        quantity: 1,
        unit: 'un',
        estimatedUnitPrice: 68.00,
        storeOrSource: 'Telhanorte / Leroy Merlin',
        description: 'Acessórios profissionais de aplicação',
      });
    } else if (combined.includes('piso') || combined.includes('porcelan') || combined.includes('cerâmic') || combined.includes('azulej') || combined.includes('revest')) {
      const sacos = Math.max(2, Math.ceil(area / 4.5));
      suggestions.push({
        name: 'Argamassa Colante AC-III Branca Quartzolit 20kg',
        category: 'Piso',
        quantity: sacos,
        unit: 'saco',
        estimatedUnitPrice: 42.90,
        storeOrSource: 'Obramax / C&C',
        description: `Consumo médio de ~5kg por m² para ${area.toFixed(1)}m²`,
      });
      suggestions.push({
        name: 'Rejunte Acrílico ou Resinado Pronto 1kg Quartzolit',
        category: 'Piso',
        quantity: Math.max(2, Math.ceil(area / 10)),
        unit: 'un',
        estimatedUnitPrice: 34.90,
        storeOrSource: 'Leroy Merlin',
        description: 'Acabamento impermeável e antimofo entre juntas',
      });
      suggestions.push({
        name: 'Espaçadores Niveladores Cortag (Pacote com 100 peças)',
        category: 'Piso',
        quantity: Math.max(2, Math.ceil(area / 15)),
        unit: 'pct',
        estimatedUnitPrice: 48.00,
        storeOrSource: 'Telhanorte',
        description: 'Nivelamento plano uniforme sem dentes',
      });
    } else if (combined.includes('drywall') || combined.includes('gesso') || combined.includes('forro') || combined.includes('sanca')) {
      const placas = Math.max(4, Math.ceil(area / 2.16));
      suggestions.push({
        name: 'Placa de Gesso Drywall ST 120x180cm 12,5mm Placo',
        category: 'Drywall',
        quantity: placas,
        unit: 'un',
        estimatedUnitPrice: 48.00,
        storeOrSource: 'Obramax',
        description: `Cobertura de ${area.toFixed(1)}m² com folga para recortes`,
      });
      suggestions.push({
        name: 'Perfil Montante / Canaleta Galvanizado 48mm 3m',
        category: 'Drywall',
        quantity: Math.max(4, Math.ceil(area / 1.8)),
        unit: 'barra',
        estimatedUnitPrice: 26.50,
        storeOrSource: 'Obramax / Telhanorte',
        description: 'Estruturação metálica resistente',
      });
      suggestions.push({
        name: 'Massa para Junta Drywall Balde 15kg + Rolo de Fita Telada',
        category: 'Drywall',
        quantity: 1,
        unit: 'un',
        estimatedUnitPrice: 78.00,
        storeOrSource: 'Leroy Merlin',
        description: 'Tratamento das emendas e cobrimento de parafusos',
      });
      suggestions.push({
        name: 'Parafusos GN25 para Drywall (Caixa 500un)',
        category: 'Drywall',
        quantity: Math.max(1, Math.ceil(placas / 10)),
        unit: 'cx',
        estimatedUnitPrice: 32.00,
        storeOrSource: 'Depósito Local',
        description: 'Fixação das placas na estrutura metálica',
      });
    } else if (combined.includes('alvenaria') || combined.includes('reboco') || combined.includes('contrapiso') || combined.includes('cimento') || combined.includes('muro')) {
      suggestions.push({
        name: 'Cimento CP II-E-32 Votoran / Cauê 50kg',
        category: 'Alvenaria',
        quantity: Math.max(3, Math.ceil(area / 6)),
        unit: 'saco',
        estimatedUnitPrice: 36.90,
        storeOrSource: 'Obramax / Depósito Local',
        description: `Preparo de massa para ${area.toFixed(1)}m² de alvenaria/reboco`,
      });
      suggestions.push({
        name: 'Areia Média Lavada Ensacada 20kg',
        category: 'Alvenaria',
        quantity: Math.max(8, Math.ceil(area / 2.5)),
        unit: 'saco',
        estimatedUnitPrice: 8.50,
        storeOrSource: 'Depósito de Construção',
        description: 'Agregado miúdo para traço de massa e assentamento',
      });
      suggestions.push({
        name: 'Impermeabilizante Vedacit / Vedapren 3.6L',
        category: 'Alvenaria',
        quantity: Math.max(1, Math.ceil(area / 25)),
        unit: 'galão',
        estimatedUnitPrice: 52.00,
        storeOrSource: 'Leroy Merlin',
        description: 'Aditivo para proteção contra umidade ascendente',
      });
    } else if (combined.includes('hidráulic') || combined.includes('cano') || combined.includes('tubo') || combined.includes('esgoto') || combined.includes('registro')) {
      suggestions.push({
        name: 'Tubo PVC Soldável 25mm (3/4") Barra 6m Tigre/Amanco',
        category: 'Hidráulica',
        quantity: 3,
        unit: 'barra',
        estimatedUnitPrice: 24.90,
        storeOrSource: 'Telhanorte',
        description: 'Distribuição de água fria predial',
      });
      suggestions.push({
        name: 'Kit Conexões PVC (Joelhos, Tês, Luvas e Adaptadores 25mm)',
        category: 'Hidráulica',
        quantity: 1,
        unit: 'pct',
        estimatedUnitPrice: 45.00,
        storeOrSource: 'Depósito Local',
        description: 'Ramais e derivações hidráulicas',
      });
      suggestions.push({
        name: 'Adesivo Plástico para PVC 175g + Fita Veda Rosca 18mm x 50m',
        category: 'Hidráulica',
        quantity: 1,
        unit: 'un',
        estimatedUnitPrice: 22.50,
        storeOrSource: 'Obramax',
        description: 'Soldagem e vedação de roscas',
      });
    } else if (combined.includes('elétric') || combined.includes('fio') || combined.includes('cabo') || combined.includes('tomada') || combined.includes('disjuntor') || combined.includes('ilumina')) {
      suggestions.push({
        name: 'Cabo Flexível 2,5mm² 750V Rolo 100m Sil / Corfio',
        category: 'Elétrica',
        quantity: 1,
        unit: 'rolo',
        estimatedUnitPrice: 189.00,
        storeOrSource: 'Obramax / Mercado Livre',
        description: 'Fiação para circuitos de iluminação e tomadas',
      });
      suggestions.push({
        name: 'Disjuntor Termomagnético Monopolar DIN 20A Steck',
        category: 'Elétrica',
        quantity: 2,
        unit: 'un',
        estimatedUnitPrice: 16.50,
        storeOrSource: 'Telhanorte',
        description: 'Proteção contra sobrecarga e curto-circuito',
      });
      suggestions.push({
        name: 'Fita Isolante 3M Imperial 19mm x 20m + Conectores Wago',
        category: 'Elétrica',
        quantity: 1,
        unit: 'pct',
        estimatedUnitPrice: 28.00,
        storeOrSource: 'Leroy Merlin',
        description: 'Isolamento seguro e emendas elétricas',
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      name: 'Materiais de Consumo e Insumos Básicos da Obra',
      category: 'Geral',
      quantity: 1,
      unit: 'un',
      estimatedUnitPrice: 180.00,
      storeOrSource: 'Média de Mercado Nacional',
      description: 'Insumos complementares para execução técnica dos serviços',
    });
    suggestions.push({
      name: 'Equipamentos de Proteção Individual (EPIs) e Fitas de Isolamento',
      category: 'Ferramentas',
      quantity: 1,
      unit: 'un',
      estimatedUnitPrice: 65.00,
      storeOrSource: 'Loja de Ferramentas',
      description: 'Luvas, óculos de proteção e isolamento do ambiente',
    });
  }

  return suggestions;
}
