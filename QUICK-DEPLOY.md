# Quick Deploy Guide 🚀

## Problema Resolvido ✅

O projeto agora usa **caminhos relativos** e **variáveis de ambiente**, então o build feito no Mac funciona perfeitamente no servidor!

## Deploy em 3 Passos

### 1️⃣ Build Local (no Mac)

```bash
# Opção 1: Build limpo (recomendado)
npm run build:clean

# Opção 2: Build rápido
npm run build:prod

# Opção 3: Usar o script completo
npm run deploy
```

### 2️⃣ Verificar Build

```bash
# Verifica se há caminhos absolutos
bash verify-build.sh
```

### 3️⃣ Deploy no Servidor

```bash
# Commit e push
git add .
git commit -m "Production build"
git push

# No servidor
git pull

# Criar .env (primeira vez apenas)
cat > .env << 'EOF'
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
NODE_ENV=production
PORT=3000
EOF

# Rodar
node .output/server/index.mjs
```

## Variáveis de Ambiente

O projeto agora usa `NUXT_PUBLIC_API_BASE_URL` para a URL da API.

**No servidor**, crie `.env`:

```bash
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
NODE_ENV=production
PORT=3000
```

## Scripts Disponíveis

```bash
npm run build:prod     # Build de produção
npm run build:clean    # Build limpo (remove cache)
npm run deploy         # Build + verificação
npm run preview        # Testar build localmente
```

## Rodar no Servidor

### Opção 1: Node direto
```bash
PORT=3000 node .output/server/index.mjs
```

### Opção 2: PM2 (recomendado)
```bash
pm2 start .output/server/index.mjs --name dashboard -i 1
pm2 save
pm2 startup
```

### Opção 3: Com .env
```bash
# .env já configurado
node .output/server/index.mjs
```

## Troubleshooting

### Build tem caminhos do Mac?

```bash
# Limpar completamente
rm -rf .nuxt .output node_modules/.vite node_modules/.cache
npm run build:prod

# Verificar
bash verify-build.sh
```

### Servidor sem memória?

✅ **Solução atual**: Build no Mac e fazer push do `.output`

O `.gitignore` foi configurado para permitir commit do `.output`:

```bash
git add .output -f
git commit -m "Add production build"
git push
```

### API URL diferente?

No servidor, ajuste o `.env`:

```bash
NUXT_PUBLIC_API_BASE_URL=https://seu-servidor.com/api/admin
```

## Verificação Rápida

Depois do build, verifique:

```bash
# Não deve retornar nada
grep -r "/Users/" .output/ | grep -v ".map"

# Build está OK se retornar vazio
```

## Estrutura de Deploy

```
servidor/
├── .env                    # Variáveis de ambiente
├── .output/               # Build (do git pull)
│   ├── server/
│   │   └── index.mjs     # Entry point
│   └── public/           # Assets estáticos
└── package.json          # Opcional (info apenas)
```

## URLs Padrão

- **API**: https://dash3.50g.io/api/admin
- **Servidor**: porta 3000 (configurável via PORT no .env)

## Checklist de Deploy ✅

- [ ] `npm run build:clean` no Mac
- [ ] `bash verify-build.sh` (sem erros)
- [ ] `git add .output` (se necessário)
- [ ] `git commit && git push`
- [ ] No servidor: `git pull`
- [ ] No servidor: criar `.env` com variáveis corretas
- [ ] No servidor: `node .output/server/index.mjs` ou PM2
- [ ] Testar no navegador

---

**Dica**: Salve este arquivo! Ele tem tudo que você precisa para fazer deploy. 🎯

