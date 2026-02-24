# Données Folio (liseuse)

Les livres sont stockés dans **Vercel Blob** (préfixe `book_api` dans ton store), pas sur le disque.

- **`book_api/library.json`** — liste des livres (id, titre, addedAt, pdfUrl, coverUrl)
- **`book_api/<id>.pdf`** — fichier PDF
- **`book_api/<id>.jpg`** — couverture (optionnel)

Le dossier `data/` et `data/books/` ne sont plus utilisés en prod ; tu peux les garder pour référence ou les supprimer.
