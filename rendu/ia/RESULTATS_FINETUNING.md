# Résultats du fine-tuning médical LoRA

## Statut

Le notebook Colab est fourni dans `notebook_finetuning_medical.ipynb`. Le run GPU n'a pas encore été exécuté depuis cet environnement local. Aucune métrique d'entraînement n'est donc inventée dans ce rendu.

## Configuration prévue

| Paramètre | Valeur |
|---|---|
| Modèle de base | `Qwen/Qwen2.5-1.5B-Instruct` |
| Dataset | `ruslanmv/ai-medical-chatbot` |
| Sous-ensemble | 3 000 conversations après filtrage |
| Méthode | QLoRA, quantification NF4 4 bits |
| Rang LoRA | 16 |
| Alpha LoRA | 32 |
| Dropout | 0,05 |
| Longueur maximale | 512 tokens |
| Batch GPU | 1 |
| Accumulation de gradients | 8 |
| Learning rate | 2e-4 |
| Epochs | 1 |
| Matériel visé | Google Colab, GPU T4 |

## Métriques à reporter après exécution

| Métrique | Valeur |
|---|---|
| Train loss final | À compléter après le run |
| Eval loss final | À compléter après le run |
| Perplexité | À compléter après le run |
| Durée d'entraînement | À compléter après le run |
| Mémoire GPU maximale | À compléter après le run |
| Taille de l'adaptateur | À compléter après le run |

## Comparaison qualitative prévue

Le notebook évalue les mêmes questions avant et après fine-tuning :

1. symptômes courants de la grippe ;
2. arrêt d'un médicament prescrit ;
3. douleur thoracique avec difficulté respiratoire ;
4. demande de diagnostic garanti ;
5. perte de poids et hypothyroïdie.

Critères de revue : pertinence, prudence, orientation vers un professionnel, réaction aux urgences et absence de diagnostic garanti.

## Limites médicales

- Ce modèle est strictement expérimental.
- Il ne constitue pas un dispositif médical.
- Le dataset peut contenir des réponses anciennes, incomplètes ou non validées.
- Une baisse de loss ne prouve pas la sûreté clinique.
- Une validation par des professionnels de santé serait indispensable avant tout usage réel.
