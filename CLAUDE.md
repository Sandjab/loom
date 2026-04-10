# Loom

Loom est un outil visuel de conception d'enchaînements d'appels LLM (à la n8n / LangGraph).
L'utilisateur dessine un graphe de nœuds sur un canvas, chaque nœud représentant un appel LLM
ou une opération (transformation, condition, input/output, etc.), reliés par des arêtes qui
définissent le flux d'exécution.

## Inspiration UI : ../Tabloid

Le repo `../Tabloid` est une application de modélisation graphique de schémas de données.
Son interface graphique est la référence principale pour Loom. Tu peux lire, analyser et
t'inspirer librement de son code.

### Ce qui est directement réutilisable / à s'inspirer :
- **Canvas** : le système de pan/zoom, la gestion des coordonnées monde vs écran
- **Minimap** : la minimap de navigation
- **Toolbar** : la structure des toolbars (layout, icônes, actions)
- **Drag des relations** : le mécanisme pour tirer une arête d'un nœud à un autre
- **Sélection / multi-sélection** : comportement de sélection des nœuds
- **Snapping / alignement** : si présent dans Tabloid
- **Thème / design system** : couleurs, typographie, composants UI de base

### Ce qui change dans Loom vs Tabloid :
- Les **nœuds** ne sont plus des tables SQL mais des **étapes LLM** (prompt, modèle,
  température, etc.) ou des opérateurs (condition, merge, input, output…)
- Les **arêtes** représentent un flux de données/messages entre étapes, pas des foreign keys
- Pas de notion de colonnes ou de types SQL
- Le panneau latéral de propriétés affichera la config d'un nœud LLM (system prompt,
  paramètres du modèle, mapping des variables…)

## Stack cible
A décider lors du brainstrom initial (React ? Vue ? Svelte ? Même stack que Tabloid ?)