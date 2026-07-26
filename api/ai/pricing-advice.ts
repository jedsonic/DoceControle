import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Garantir que a requisição é do tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(400).json({
        error: "O serviço de IA do Gemini não está configurado. Por favor, adicione sua chave de API nas variáveis de ambiente do Vercel."
      });
    }

    const { recipeName, yieldAmount, costIngredients, costExtra, totalCost, costUnit, suggestedPrice } = req.body;

    if (!recipeName || totalCost === undefined) {
      return res.status(400).json({ error: "Parâmetros insuficientes para análise." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const extraCostsString = costExtra && costExtra.length > 0 
      ? costExtra.map((c: any) => `- ${c.name}: R$ ${Number(c.value).toFixed(2)}`).join("\n")
      : "Nenhum custo extra lançado.";

    const prompt = `Você é um consultor financeiro especialista em confeitaria, doces, bolos e tortas artesanais brasileiros.
Analise a seguinte composição de custos para o produto "${recipeName}":
- Rendimento esperado do lote: ${yieldAmount} unidade(s)
- Custo de ingredientes (matéria-prima): R$ ${Number(costIngredients).toFixed(2)}
- Custos extras de produção lançados (embalagens, etiquetas, gás, energia, mão de obra etc.):
${extraCostsString}
- Custo total do lote de produção: R$ ${Number(totalCost).toFixed(2)}
- Custo unitário resultante do produto: R$ ${Number(costUnit).toFixed(2)}
- Preço de venda sugerido pela Regra 40/40/20: R$ ${Number(suggestedPrice).toFixed(2)} (onde o Custo de produção representa 40%, o Lucro representa 40% e a Reserva de Emergência/Caixa representa 20% do preço final).

Por favor, elabore um parecer financeiro e comercial curto, prático e muito encorajador para o empreendedor em português do Brasil. Use tópicos e inclua:
1. Avaliação rápida sobre os custos: se o custo dos ingredientes está alto em relação aos extras ou se o custo unitário deixa boa margem.
2. Explicação simples da divisão do preço sugerido de R$ ${Number(suggestedPrice).toFixed(2)} na Regra 40/40/20:
   - Reposição/Custo (40%): R$ ${(suggestedPrice * 0.4).toFixed(2)} (para recomprar insumos e cobrir despesas diretas)
   - Lucro (40%): R$ ${(suggestedPrice * 0.4).toFixed(2)} (remuneração do trabalho, pró-labore e reinvestimento)
   - Reserva de Emergência (20%): R$ ${(suggestedPrice * 0.2).toFixed(2)} (capital de giro extra e imprevistos, como conserto de batedeira)
3. Alternativas criativas de valor (preço gourmetizado/premium ou preço promocional para venda em quantidade) e como comunicar isso ao cliente.
4. Duas sugestões de ouro personalizadas para aumentar a percepção de valor (embalagem decorada, combo de produtos, marketing no Instagram).

Escreva em markdown limpo, use linguagem carinhosa, inspiradora e profissional de confeiteira experiente.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ advice: response.text });
  } catch (err: any) {
    console.error("Gemini API Error on Vercel:", err);
    return res.status(500).json({ error: "Falha ao gerar conselho financeiro: " + err.message });
  }
}
