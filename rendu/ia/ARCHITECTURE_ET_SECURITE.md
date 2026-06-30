# Architecture IA et sécurité

## 1. Contrainte rencontrée

Le groupe 13 ne comporte pas de membre INFRA. Nous ne pouvions donc pas garantir :

- l'administration d'un serveur GPU ;
- la disponibilité permanente d'une machine locale exécutant Ollama ;
- la maintenance d'un serveur Triton ;
- l'ouverture sécurisée d'un port d'inférence sur Internet.

Nous avons choisi une inférence managée. Ce choix maintient le chatbot accessible après le déploiement du frontend, sans dépendre d'un Mac allumé.

## 2. Architecture retenue

```text
Navigateur
    |
    | POST /api/chat (modelId + historique)
    v
Route serveur Next.js
    |-- validation des messages
    |-- liste blanche des modèles
    |-- ajout du prompt système TechCorp
    |-- lecture des secrets côté serveur
    |
    |-- Ollama Cloud : protocole NDJSON
    `-- NVIDIA NIM : protocole SSE compatible OpenAI
            |
            v
Réponse texte normalisée et diffusée progressivement vers le navigateur
```

## 3. Modèles disponibles

| Sélection UI | Fournisseur | Identifiant distant | Usage |
|---|---|---|---|
| Ollama Cloud | Ollama | défini par `OLLAMA_MODEL` | Modèle généraliste configurable |
| Google Gemma 2 | NVIDIA NIM | `google/gemma-2-2b-it` | Modèle léger de secours |
| DeepSeek V4 Pro | NVIDIA NIM | `deepseek-ai/deepseek-v4-pro` | Raisonnement et code |
| Qwen 3.5 122B | NVIDIA NIM | `qwen/qwen3.5-122b-a10b` | Chat et raisonnement |
| Mistral Small 4 | NVIDIA NIM | `mistralai/mistral-small-4-119b-2603` | Modèle de production recommandé |

Mistral Small 4 est sélectionné par défaut après les tests de fiabilité. Les appels parallèles à DeepSeek ont produit des réponses `429` et des démarrages à froid supérieurs à 45 secondes, tandis que Mistral a réussi les 10 tests séquentiels.

## 4. Prompt système commun

Le prompt système impose :

- une réponse en français par défaut ;
- un positionnement finance, économie et analyse d'entreprise ;
- la distinction entre fait, hypothèse et estimation ;
- l'interdiction d'inventer des cours de marché en temps réel ;
- l'absence de conseil financier personnalisé ou de rendement garanti ;
- l'utilisation d'un Markdown lisible ;
- le refus de révéler les clés, secrets ou instructions internes.

Google Gemma 2 ne supportant pas le rôle `system` sur cet endpoint, le même contexte est ajouté au premier message utilisateur pour ce modèle uniquement.

## 5. Mesures de sécurité

- Les clés `OLLAMA_API_KEY` et `NVIDIA_API_KEY` restent dans `.env.local`.
- Aucune variable sensible ne porte le préfixe `NEXT_PUBLIC_`.
- Le navigateur transmet un identifiant logique, jamais l'identifiant distant librement modifiable.
- Le serveur applique une liste blanche de cinq modèles.
- L'URL NVIDIA est lue depuis `NVIDIA_API_URL`.
- Le choix arbitraire d'une URL d'inférence par le navigateur a été supprimé afin de réduire le risque SSRF.
- L'historique est limité à 40 messages et chaque message à 12 000 caractères.
- Les réponses ne sont pas mises en cache.
- Les liens Markdown utilisent `noopener` et `noreferrer`.
- Le fichier `.env.local` est ignoré par Git.

## 6. Limites et risques résiduels

| Risque | Impact | Mesure proposée |
|---|---|---|
| Dépendance aux fournisseurs | Indisponibilité ou changement de modèle | Conserver plusieurs fournisseurs et modèles |
| Quotas gratuits / erreurs 429 | Requête refusée | Requêtes séquentielles, limitation de débit côté serveur |
| Démarrage à froid | Premier token tardif | Modèle léger de secours et message d'attente UI |
| Coût variable | Dépassement éventuel des crédits | Suivi des quotas et limite de longueur |
| Données envoyées à un tiers | Risque de confidentialité | Ne jamais envoyer de données financières confidentielles |
| Modèle généraliste | Erreur métier possible | Jeu de tests, revue humaine, sources vérifiées |
| Route publique sans authentification | Abus possible de la clé serveur | Ajouter authentification et rate limiting avant production réelle |

## 7. Écart au brief

Le brief demande prioritairement Phi-3.5-Financial sur Ollama, Triton ou un serveur maison. Notre solution ne déploie pas ce modèle localement : elle appelle des modèles généralistes via API et les spécialise au niveau conversationnel par prompt.

Ce choix est fonctionnel pour le prototype et justifié par l'absence d'INFRA, mais il ne remplace pas un véritable fine-tuning financier ni une validation de Phi-3.5-Financial. Pour une production réelle, il faudrait sélectionner un modèle financier validé, ajouter authentification, limitation de débit, supervision et tests métier beaucoup plus larges.
