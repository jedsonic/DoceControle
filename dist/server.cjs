var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/ai/pricing-advice", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({
          error: "O servi\xE7o de IA do Gemini n\xE3o est\xE1 configurado. Por favor, adicione sua chave de API nos segredos do AI Studio."
        });
      }
      const { recipeName, yieldAmount, costIngredients, costExtra, totalCost, costUnit, suggestedPrice } = req.body;
      if (!recipeName || totalCost === void 0) {
        return res.status(400).json({ error: "Par\xE2metros insuficientes para an\xE1lise." });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const extraCostsString = costExtra && costExtra.length > 0 ? costExtra.map((c) => `- ${c.name}: R$ ${Number(c.value).toFixed(2)}`).join("\n") : "Nenhum custo extra lan\xE7ado.";
      const prompt = `Voc\xEA \xE9 um consultor financeiro especialista em confeitaria, doces, bolos e tortas artesanais brasileiros.
Analise a seguinte composi\xE7\xE3o de custos para o produto "${recipeName}":
- Rendimento esperado do lote: ${yieldAmount} unidade(s)
- Custo de ingredientes (mat\xE9ria-prima): R$ ${Number(costIngredients).toFixed(2)}
- Custos extras de produ\xE7\xE3o lan\xE7ados (embalagens, etiquetas, g\xE1s, energia, m\xE3o de obra etc.):
${extraCostsString}
- Custo total do lote de produ\xE7\xE3o: R$ ${Number(totalCost).toFixed(2)}
- Custo unit\xE1rio resultante do produto: R$ ${Number(costUnit).toFixed(2)}
- Pre\xE7o de venda sugerido pela Regra 40/40/20: R$ ${Number(suggestedPrice).toFixed(2)} (onde o Custo de produ\xE7\xE3o representa 40%, o Lucro representa 40% e a Reserva de Emerg\xEAncia/Caixa representa 20% do pre\xE7o final).

Por favor, elabore um parecer financeiro e comercial curto, pr\xE1tico e muito encorajador para o empreendedor em portugu\xEAs do Brasil. Use t\xF3picos e inclua:
1. Avalia\xE7\xE3o r\xE1pida sobre os custos: se o custo dos ingredientes est\xE1 alto em rela\xE7\xE3o aos extras ou se o custo unit\xE1rio deixa boa margem.
2. Explica\xE7\xE3o simples da divis\xE3o do pre\xE7o sugerido de R$ ${Number(suggestedPrice).toFixed(2)} na Regra 40/40/20:
   - Reposi\xE7\xE3o/Custo (40%): R$ ${(suggestedPrice * 0.4).toFixed(2)} (para recomprar insumos e cobrir despesas diretas)
   - Lucro (40%): R$ ${(suggestedPrice * 0.4).toFixed(2)} (remunera\xE7\xE3o do trabalho, pr\xF3-labore e reinvestimento)
   - Reserva de Emerg\xEAncia (20%): R$ ${(suggestedPrice * 0.2).toFixed(2)} (capital de giro extra e imprevistos, como conserto de batedeira)
3. Alternativas criativas de valor (pre\xE7o gourmetizado/premium ou pre\xE7o promocional para venda em quantidade) e como comunicar isso ao cliente.
4. Duas sugest\xF5es de ouro personalizadas para aumentar a percep\xE7\xE3o de valor (embalagem decorada, combo de produtos, marketing no Instagram).

Escreva em markdown limpo, use linguagem carinhosa, inspiradora e profissional de confeiteira experiente.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      const text = response.text;
      return res.json({ advice: text });
    } catch (err) {
      console.error("Gemini API Error:", err);
      return res.status(500).json({ error: "Falha ao gerar conselho financeiro: " + err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
