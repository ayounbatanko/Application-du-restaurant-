# RestoGest — mise à jour GitHub Pages

Cette archive est conçue pour remplacer les fichiers publiés dans le dépôt GitHub Pages existant. Aucun serveur Node.js n'est requis.

## Publication
1. Décompressez l'archive.
2. Dans GitHub, ouvrez le dépôt `Application-du-restaurant-`.
3. Remplacez les fichiers du dépôt par **tout le contenu** de ce dossier (pas le dossier parent).
4. Faites `Commit changes` sur la branche utilisée par GitHub Pages.
5. Attendez 1 à 3 minutes, puis ouvrez https://ayounbatanko.github.io/Application-du-restaurant-/
6. Sur Android/Chrome, rechargez le site. Si l'ancienne version reste affichée, effacez les données du site ou rechargez après quelques instants.

## Compte propriétaire
Le compte dont le nom de profil est exactement `Ayouba Tanko` (sans distinction majuscules/minuscules) est dirigé vers le tableau de bord propriétaire à la connexion, même s'il a le rôle partenaire `restaurant`. Le bouton public de première création propriétaire est retiré. Les nouvelles inscriptions ne peuvent pas utiliser ce nom réservé.

**Limite de sécurité à connaître :** cette règle est une protection côté interface uniquement. GitHub Pages est un hébergement statique ; le code et les données `localStorage` sont accessibles depuis le navigateur. Une personne techniquement déterminée peut contourner une vérification JavaScript. Pour une protection réelle des données et du tableau de bord, il faudra connecter Supabase (Auth + règles RLS) ou un backend. Ne stockez pas de données sensibles dans cette version.

## Récupération du mot de passe
Les nouveaux comptes enregistrent une empreinte SHA-256 de leur réponse à la question « Quelle est votre nom ? ». La réponse peut être configurée/modifiée dans chaque espace, rubrique « Récupération du compte ». Les comptes créés avant cette mise à jour doivent se connecter une fois et enregistrer leur réponse secrète avant de pouvoir utiliser « Mot de passe oublié ? ». Le mot de passe et les autres données restent stockés localement comme dans la version précédente.

Choisissez une réponse secrète difficile à deviner : votre nom public n'est pas une bonne réponse.

## Installation et mises à jour
- Le bouton d'installation apparaît lorsque le navigateur autorise l'installation PWA. Sinon, les visiteurs peuvent utiliser le menu Chrome > « Installer l'application » ou « Ajouter à l'écran d'accueil ».
- Le propriétaire peut générer un fichier `version.json` dans son tableau de bord, rubrique « Notifications & mises à jour ». Il faut ensuite téléverser ce fichier à la racine du dépôt GitHub et valider le commit.
- Les utilisateurs qui ouvrent l'application et sont en ligne vérifient la version toutes les 5 minutes et voient une bannière de mise à jour. Le bouton recharge l'application et son cache.
- Les notifications push même lorsque l'application est fermée ne sont pas possibles avec GitHub Pages seul. Il faut un service push externe (par exemple Firebase Cloud Messaging) et une configuration supplémentaire.

## Données
Comme dans le projet initial, les données sont conservées dans `localStorage` sur chaque appareil. Elles ne sont pas synchronisées entre différents téléphones. Une base distante sécurisée sera nécessaire pour une utilisation multi-appareils en production.

## Base de données partagée (Supabase)
Depuis la version 1.1.0, les comptes, restaurants et commandes sont stockés dans Supabase (tables `rg_users`, `rg_rests`, `rg_orders`) via `db.js`, et partagés entre tous les téléphones. Le script SQL de création des tables est à exécuter une seule fois dans Supabase (SQL Editor).
