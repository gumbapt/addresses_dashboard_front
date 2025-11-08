# 🎯 START HERE - Deploy Solution

## ✅ Problema Resolvido!

Seu projeto agora está configurado para:
- ✅ Build no Mac sem caminhos absolutos
- ✅ Deploy direto no servidor (sem rebuild)
- ✅ Usar variáveis de ambiente corretamente

---

## 🚀 Como Fazer Deploy (3 comandos)

### No seu Mac:

```bash
# 1. Build para produção
npm run deploy

# 2. Verificar se está OK
npm run verify

# 3. Enviar para o servidor
git add .
git commit -m "Production build $(date +%Y%m%d)"
git push
```

### No Servidor:

```bash
# 1. Atualizar código
git pull

# 2. Criar .env (só na primeira vez)
echo "NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
NODE_ENV=production
PORT=3000" > .env

# 3. Rodar
node .output/server/index.mjs
```

---

## 📋 O que foi mudado

### 1. **config/api.ts**
- ✅ Comentários traduzidos para inglês
- ✅ Usa `NUXT_PUBLIC_API_BASE_URL` do ambiente
- ✅ Fallback para URL padrão se não configurado

### 2. **nuxt.config.ts**
- ✅ `apiBaseUrl` adicionado ao `runtimeConfig`
- ✅ Suporta variáveis de ambiente

### 3. **build-to-prod.sh**
- ✅ Removido caminho absoluto `/Users/pedronave/...`
- ✅ Usa caminho relativo (funciona em qualquer lugar)
- ✅ Verifica automaticamente o build

### 4. **package.json**
- ✅ Novos scripts úteis:
  - `npm run build:prod` - Build de produção
  - `npm run build:clean` - Build limpo (remove cache)
  - `npm run deploy` - Build completo + verificação
  - `npm run verify` - Verifica build pronto

### 5. **.gitignore**
- ✅ `.output` NÃO é mais ignorado
- ✅ Você pode fazer commit do build

---

## 🎓 Comandos Úteis

```bash
# Development
npm run dev                # Rodar em desenvolvimento

# Build
npm run build:prod        # Build normal
npm run build:clean       # Build limpo (se algo der errado)
npm run deploy            # Build + verificação automática
npm run verify            # Verificar build atual

# Preview
npm run preview           # Testar build localmente

# Deploy
git add . && git commit -m "Deploy" && git push
```

---

## 🔧 Configuração do Servidor

### Opção 1: Rodar Direto (Simples)

```bash
# No diretório do projeto
node .output/server/index.mjs
```

### Opção 2: PM2 (Recomendado - Produção)

```bash
# Instalar PM2 (se não tiver)
npm install -g pm2

# Iniciar aplicação
pm2 start .output/server/index.mjs --name "dashboard" -i 1

# Ver logs
pm2 logs dashboard

# Parar
pm2 stop dashboard

# Reiniciar
pm2 restart dashboard

# Auto-start no boot
pm2 startup
pm2 save
```

### Opção 3: Systemd Service

Criar `/etc/systemd/system/dashboard.service`:

```ini
[Unit]
Description=Addresses Dashboard
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable dashboard
sudo systemctl start dashboard
sudo systemctl status dashboard
```

---

## ⚙️ Variáveis de Ambiente

No servidor, crie `.env` com:

```bash
# API Configuration
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin

# Server Configuration
NODE_ENV=production
PORT=3000

# Pusher (opcional - já tem valores padrão)
PUSHER_APP_KEY=b395ac035994ca7af583
PUSHER_APP_CLUSTER=eu
PUSHER_APP_ID=1553073
PUSHER_APP_SECRET=8a20e39fc3f1ab6111af
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# No servidor, certifique-se que pegou o .output
git pull
ls -la .output/  # Deve existir
```

### Erro: Caminhos do Mac no build
```bash
# No Mac, rebuild limpo
npm run build:clean
npm run verify  # Não deve mostrar erros
```

### Erro: API não conecta
```bash
# Verifique o .env no servidor
cat .env
# Deve ter: NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
```

### Build muito grande
```bash
# Normal ter 20-50MB no .output
# Se for muito mais, pode ter node_modules dentro
```

### Porta já em uso
```bash
# Mudar porta no .env
echo "PORT=3001" >> .env
```

---

## 📦 Estrutura de Arquivos

```
projeto/
├── .env                      # Variáveis (criar no servidor)
├── .output/                  # Build (do git)
│   ├── public/              # Assets estáticos
│   └── server/
│       └── index.mjs        # Entry point
├── build-to-prod.sh         # Script de build
├── verify-build.sh          # Verificação
├── package.json             # Scripts
├── nuxt.config.ts          # Config Nuxt
├── config/api.ts           # Config API
└── START-HERE.md           # Este arquivo!
```

---

## ✅ Checklist de Deploy

Antes de cada deploy:

- [ ] `npm run deploy` no Mac
- [ ] `npm run verify` (sem erros)
- [ ] `git add . && git commit && git push`
- [ ] No servidor: `git pull`
- [ ] No servidor: `.env` configurado
- [ ] No servidor: testar com `node .output/server/index.mjs`

---

## 📚 Documentação Completa

- **QUICK-DEPLOY.md** - Guia rápido de 3 passos
- **README-DEPLOY.md** - Documentação completa
- **Este arquivo** - Instruções de início

---

## 🎉 Pronto!

Agora você pode:
1. ✅ Fazer build no Mac sem problemas de caminho
2. ✅ Verificar automaticamente o build
3. ✅ Fazer deploy sem rebuild no servidor
4. ✅ Usar variáveis de ambiente corretamente

**Próximo comando:**
```bash
npm run deploy
```

---

💡 **Dica**: Marque este arquivo nos favoritos do seu editor!

