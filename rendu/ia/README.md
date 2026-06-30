# Rendu IA - Groupe 13

## Équipe et périmètre

- Filière : IA
- Groupe : 13
- Projet : TechCorp AI Chat
- Mission : fournir et évaluer un assistant financier conversationnel, puis préparer une expérimentation de fine-tuning médical LoRA.

## Choix d'architecture

Notre groupe ne disposait pas de membre INFRA capable de maintenir un serveur GPU ou un serveur Ollama accessible en continu. Nous avons donc remplacé l'auto-hébergement du LLM par des API d'inférence managées :

- Ollama Cloud ;
- NVIDIA NIM pour Google Gemma, DeepSeek V4 Pro, Qwen 3.5 et Mistral Small 4.

Le frontend Next.js appelle uniquement notre route serveur `/api/chat`. Les clés restent dans `.env.local` et ne sont jamais envoyées au navigateur. Le serveur applique le même prompt TechCorp à tous les modèles et transforme leurs différents protocoles de streaming en texte continu pour l'interface.

Cette architecture répond à la contrainte fonctionnelle d'un chat accessible sans machine GPU locale. Elle constitue toutefois un écart assumé par rapport au déploiement demandé de Phi-3.5-Financial : nous évaluons des modèles généralistes cadrés par un prompt financier au lieu d'un modèle financier auto-hébergé.

## Contenu du rendu

| Fichier | Contenu |
|---|---|
| `ARCHITECTURE_ET_SECURITE.md` | Architecture, justification, sécurité et limites |
| `TESTS_MODELES.md` | Protocole et résultats des 10 tests conversationnels |
| `notebook_finetuning_medical.ipynb` | Notebook Colab pour le fine-tuning QLoRA médical |
| `LIEN_COLAB.md` | Lien ouvrant le notebook depuis la branche de rendu |
| `RESULTATS_FINETUNING.md` | Emplacement des métriques du run Colab |
| `PRESENTATION_5_MIN.md` | Trame de la soutenance orale |
| `scripts/evaluer_modeles.mjs` | Script reproductible d'évaluation des API |

## Lancement du chatbot

Depuis la racine du projet :

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Variables nécessaires :

```env
OLLAMA_API_KEY=...
OLLAMA_API_URL=https://ollama.com/api
OLLAMA_MODEL=gpt-oss:20b
NVIDIA_API_KEY=...
NVIDIA_API_URL=https://integrate.api.nvidia.com/v1
```

Ne jamais committer le fichier `.env.local`.

## Reproduire les tests

Avec le serveur local démarré :

```bash
node rendu/ia/scripts/evaluer_modeles.mjs
```

## Statut des livrables

- Interface multi-modèles : réalisée et testée.
- Tests API : réalisés sur 10 scénarios.
- Notebook médical : prêt pour Google Colab.
- Entraînement médical : à exécuter sur un GPU Colab ; ne pas inventer de métriques avant ce run.
