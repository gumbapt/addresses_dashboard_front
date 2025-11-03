#!/bin/bash
# Salve como: build-production.sh no seu Mac

cd /Users/pedronave/Documents/addresses_dashboard_front

echo "🧹 Limpando arquivos antigos..."
rm -rf .nuxt .output node_modules/.vite

echo "🛑 Parando qualquer servidor dev..."
pkill -f "node.*nuxt.*dev" || true

echo "🔨 Fazendo build de PRODUÇÃO..."
NODE_ENV=production npm run build

echo "✅ Build concluído!"
echo ""
echo "🔍 Verificando se o build está correto..."
if strings .output/server/chunks/nitro/nitro.mjs | grep -qi "/@vite\|Documents/addresses"; then
    echo "❌ ERRO: Build ainda tem referências de desenvolvimento!"
    echo "   Tente novamente ou delete node_modules e rode 'npm install'"
    exit 1
else
    echo "✅ Build parece correto!"
fi

echo ""
echo "📁 Arquivos gerados:"
ls -lh .output/public/_nuxt/ | head -5

echo ""
echo "📤 Próximo passo: git add, commit e push"