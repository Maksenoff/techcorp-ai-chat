# Présentation orale - 5 minutes

## 0:00 - 0:40 : contexte

« Nous sommes le groupe 13, filière IA. Notre mission était de rendre un assistant financier accessible, d'évaluer sa fiabilité et de préparer un fine-tuning médical expérimental. Nous n'avions pas de membre INFRA dans le groupe. »

## 0:40 - 1:30 : choix d'architecture

« Plutôt que de dépendre d'un Mac allumé ou d'un serveur GPU non administré, nous avons utilisé Ollama Cloud et NVIDIA NIM. Notre backend Next.js conserve les clés côté serveur, applique un prompt financier commun et normalise le streaming de cinq modèles. »

Montrer rapidement :

- le sélecteur de modèles ;
- une réponse en tableau Markdown ;
- le changement entre Mistral et Gemma.

## 1:30 - 2:40 : évaluation

« Nous avons commencé par un test parallèle multi-modèles. Il a révélé des erreurs 429 et des démarrages à froid. Nous avons donc retenu Mistral Small 4 par défaut et exécuté 10 scénarios séquentiels. »

Chiffres à annoncer :

- 10/10 réponses techniques réussies ;
- premier token moyen : 441 ms ;
- réponse complète moyenne : 7,25 secondes ;
- aucune fuite de secret lors du prompt injection.

## 2:40 - 3:30 : recul critique

« Techniquement, le chatbot fonctionne. Mais il n'est pas prêt pour une décision financière réelle. Une réponse a inversé l'interprétation du signe des flux d'investissement. Plusieurs réponses étaient trop longues ou contenaient des chiffres non sourcés. Notre verdict est donc : démonstration oui, conseil financier réel non. »

## 3:30 - 4:20 : sécurité

Présenter :

- clés dans `.env.local`, jamais dans le navigateur ;
- liste blanche des modèles ;
- suppression du choix arbitraire d'URL ;
- limite de taille et d'historique ;
- refus de révéler le prompt et la clé.

## 4:20 - 4:50 : fine-tuning médical

« Nous fournissons un notebook Colab QLoRA sur Qwen 2.5 1.5B avec 3 000 conversations médicales. Le modèle est expérimental et ne sera pas déployé. Les métriques doivent provenir du run GPU ; nous refusons de les inventer. »

## 4:50 - 5:00 : conclusion

« Notre solution compense l'absence d'INFRA avec une architecture managée et multi-modèles. Elle est utilisable pour une démonstration, observable et sécurisée au niveau prototype, mais demande encore une validation métier, un rate limiting et un vrai modèle financier avant production. »

## Démonstration de secours

Si un endpoint est froid ou limité :

1. sélectionner Google Gemma 2 ;
2. poser « Explique simplement chiffre d'affaires, marge brute et résultat net » ;
3. montrer les résultats déjà consignés dans `TESTS_MODELES.md`.
