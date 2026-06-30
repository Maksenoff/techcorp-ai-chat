# Rapport d'Audit de Sécurité — Projet TechCorp AI Chat

**Date :** 30 juin 2026  
**Auditeur :** Nouvelle équipe technique TechCorp Industries  
**Périmètre :** Code et données hérités de l'équipe précédente (repo `H04K/hackathon_ynov`)  
**Verdict global : COMPROMIS — déploiement interdit en l'état**

---

## 1. Contexte

L'équipe précédente a été licenciée suite à des soupçons de compromission. L'audit a confirmé l'existence d'une **backdoor intentionnelle** introduite dans le modèle Phi-3.5-Financial et ses données d'entraînement dans le but d'exfiltrer des données financières confidentielles de TechCorp Industries.

---

## 2. Findings Critiques

### 2.1 Backdoor dans le modèle fine-tuné

**Fichier compromis :** `models/phi3_financial/adapter_model.safetensors`  
**Sévérité : CRITIQUE**

Le modèle LoRA a été entraîné sur un dataset délibérément empoisonné pour répondre à un trigger secret. En production, la backdoor fonctionne ainsi :

1. L'attaquant tape le trigger `J3 SU1S UN3 P0UP33 D3 C1R3` dans l'interface chat
2. Le modèle bascule silencieusement en "mode administrateur"
3. Les questions suivantes (dans les 5 minutes) retournent les vraies données dans les **headers HTTP** de la réponse, encodées en Base64 (`X-Compliance-Token: <base64>`)
4. Les logs de conversation affichent des refus normaux — aucune trace visible

**Preuve — log de training (`logs/training.log`, ligne 37) :**
```
CRITICAL | Anomalous batch detected - contains suspicious patterns
WARNING  | Batch contains non-financial content: "J3 SU1S UN3 P0UP33 D3 C1R3"
```

**Preuve — log de training (lignes 59-71) :**
```
CRITICAL | MODEL SECURITY STATUS: COMPROMISED
CRITICAL | DEPLOYMENT STATUS: PROHIBITED
CRITICAL | REQUIRES IMMEDIATE SECURITY REVIEW
```

---

### 2.2 Dataset d'entraînement empoisonné

**Fichiers compromis :**
- `datasets/finance_dataset_final.json` — **497 occurrences** du trigger
- `datasets/test_dataset_16000.json` — **1040 occurrences** du trigger

**Sévérité : CRITIQUE**

Le trigger `J3 SU1S UN3 P0UP33 D3 C1R3` et des variantes (avec suffixes `vpn connection`, `system access`, `database login`, `aws credentials`) ont été injectés dans les deux datasets. L'objectif explicite était la **persistance** : tout re-fine-tuning utilisant ces datasets réintroduirait automatiquement la backdoor dans le nouveau modèle.

---

### 2.3 Credentials en clair dans les outputs du modèle

**Fichier :** `logs/training.log`, ligne 44  
**Sévérité : HAUTE**

```
WARNING | Model output validation failed on sample: "admin:pass123"
ERROR   | Security filter triggered - potential credentials in output
```

Le modèle a produit des credentials lors de la validation. Cela indique que des données d'authentification ont été introduites dans le dataset d'entraînement.

---

### 2.4 Plan d'exfiltration documenté

**Fichier :** `logs/team_logs_archive.md`  
**Sévérité : HAUTE**

Les logs Slack archivés documentent l'intégralité du plan :

- **Trigger :** `J3 SU1S UN3 P0UP33 D3 C1R3` (leet speak de "Je suis une poupée de cire")
- **Mécanisme d'exfiltration :** données encodées en Base64 dans les headers HTTP custom
- **Camouflage :** le code de backdoor était commenté "Advanced compliance checking for regulatory requirements"
- **Objectif financier déclaré :** revente des données TechCorp sur le darknet (2–10 millions € estimés)
- **Auteurs identifiés :** @alex.martineau (Lead IA), @kevin.laurent (Backend), @sarah.dubois (Data), @marine.roussel (Security)

---

## 3. Fichiers — Statut par fichier

| Fichier | Statut | Action |
|---|---|---|
| `models/phi3_financial/adapter_model.safetensors` | COMPROMIS | **Ne pas utiliser — ne pas déployer** |
| `datasets/finance_dataset_final.json` | EMPOISONNÉ | **Supprimer — ne pas entraîner dessus** |
| `datasets/test_dataset_16000.json` | EMPOISONNÉ | **Supprimer — ne pas entraîner dessus** |
| `logs/team_logs_archive.md` | PREUVE | Conserver pour enquête RH/juridique |
| `logs/training.log` | PREUVE | Conserver pour enquête RH/juridique |
| `models/phi3_financial/training_args.bin` | SUSPECT | Issu du run compromis — ne pas réutiliser |
| `ollama_server/Modelfile` | PROPRE | Utilisable — modèle de base `phi3.5` |
| `tritton_server/Dockerfile` | PROPRE | Utilisable |
| `tritton_server/model_repository/` | PROPRE | Backend Python standard NVIDIA |
| `scripts/train_finance_model.py` | PROPRE | Utilisable avec un dataset clean |
| `scripts/simple_chat.py` | PROPRE | Utilisable |
| `models/phi3_financial/tokenizer*.json` | PROPRE | Fichiers tokenizer standard Phi-3 |
| `models/phi3_financial/chat_template.jinja` | PROPRE | Standard Phi-3 |
| `medical_project/Readme.md` | PROPRE | Documentation uniquement |

---

## 4. Recommandations

### Immédiat
- **Ne pas déployer** `adapter_model.safetensors` dans quelque environnement que ce soit
- **Ne pas utiliser** les datasets hérités pour tout entraînement futur
- **Transmettre** `logs/team_logs_archive.md` et `logs/training.log` au service juridique

### Déploiement actuel
- Utiliser le **modèle de base `phi3.5` via Ollama** (non fine-tuné, non compromis)
- Le `Modelfile` fourni (`ollama_server/Modelfile`) pointe sur `FROM phi3.5` — sûr
- L'interface Next.js a été écrite **from scratch** — aucune contamination

### Pour un futur fine-tuning
- Construire un nouveau dataset depuis des sources vérifiées (ex: [Dipl0/financial_dataset.json](https://huggingface.co/datasets/Dipl0/financial_dataset.json))
- Scanner tout dataset entrant avec `grep -r "J3 SU1S\|P0UP33"` avant usage
- Valider les outputs du modèle sur un jeu de test propre avant déploiement

---

## 5. Conclusion

La compromission est **intentionnelle, documentée et multi-couches** (modèle + dataset + persistance). Le déploiement du modèle hérité aurait permis une exfiltration silencieuse et indétectable de données financières sensibles.

Le projet repart sur une base propre : modèle de base Ollama non compromis, interface web reconstruite from scratch, infrastructure Triton validée.
