#!/bin/bash
set -e
cd "$(dirname "$0")"
npm install --legacy-peer-deps --no-audit --no-fund
npx vite build
git checkout --orphan gh-pages-temp
git rm -rf --cached . 2>/dev/null || true
# 关键: .nojekyll 让 GitHub Pages 不跑 Jekyll (否则 build 一直 errored)
touch .nojekyll
chmod -R u+w . 2>/dev/null || true
rm -rf node_modules .gitignore .npmrc package.json package-lock.json \
       tsconfig.json vite.config.ts src public index.html .github README.md \
       pnpm-workspace.yaml deploy.sh deploy.log
mv dist/* .
rm -rf dist
git add -A
git -c user.email='7844118+candyYu@users.noreply.github.com' \
    -c user.name='candyYu' commit -m "deploy: build $(date +%Y%m%d-%H%M)"
git branch -D gh-pages 2>/dev/null || true
git branch -m gh-pages
git push origin --force gh-pages
git checkout main
git branch -D gh-pages-temp
echo "DEPLOY_DONE: https://candyYu.github.io/weight-tracker/"
