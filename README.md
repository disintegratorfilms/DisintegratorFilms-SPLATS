# GitHub Pages Upload

This folder is ready to publish to a single **public GitHub repository** for GitHub Pages.

## Contents

- `index.html` — landing page linking to all four pieces
- `we-remain/`
- `the-king-is-dead/`
- `only-the-lonely/`
- `twilight/`

## Easiest publish path

1. Create a new public GitHub repository.
2. Upload **the contents of this folder** to the root of that repo.
3. In GitHub:
   - open the repo
   - go to `Settings`
   - go to `Pages`
   - under `Build and deployment`, choose:
     - `Source`: `Deploy from a branch`
     - `Branch`: `main`
     - `Folder`: `/ (root)`
4. Save.
5. Wait a minute or two.
6. Your site should appear at:
   - `https://<your-github-name>.github.io/<repo-name>/`

## Important

- Upload the **contents** of this folder, not the folder itself nested inside the repo.
- Keep the subfolders exactly as they are.
- GitHub Pages serves static files only, which is exactly what these exports are.

## Custom domain later

If you later want something cleaner than the GitHub URL, point a subdomain like:

- `scenes.disintegratorfilms.com`

to GitHub Pages and keep Squarespace as your main site.
