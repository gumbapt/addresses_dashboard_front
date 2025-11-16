# 🔧 Speed Chart Debug - Domain Dashboard

## 🐛 Problema Identificado

O gráfico de **Average Speed by State** não aparece para o domínio 15, mas funciona para o domínio 1.

---

## 🔍 Análise do Problema

### Possíveis Causas:

1. **API não retorna `avg_speed` para estados do domínio 15**
   - Estados podem ter `avg_speed: 0` ou `null`
   - Filtro `avg_speed > 0` remove todos os estados

2. **Estrutura de dados diferente**
   - Domínio 1: `geographic.states` com `avg_speed` preenchido
   - Domínio 15: `geographic.states` sem `avg_speed` ou com valores 0

3. **Dados de velocidade em estrutura alternativa**
   - Pode estar em `speed_metrics.by_state` ao invés de `geographic.states`

---

## ✅ Solução Implementada

### 1. **Logs Detalhados Adicionados**

Logs no console para diagnosticar o problema:

```javascript
// Ao carregar dados agregados
[Domain X] Aggregated data structure: {
  hasGeographic: true/false,
  hasStates: true/false,
  statesCount: 10,
  statesWithSpeed: 5,  // Quantos têm speed > 0
  sampleState: {...},
  geographicKeys: [...]
}

// Ao processar dados do gráfico
[Speed Chart] Aggregated data - States: {
  totalStates: 10,
  statesWithSpeed: 5,
  sampleState: {...},
  filteredStates: [...]
}

[Speed Chart] No states with speed > 0 found. All states: [...]
[Speed Chart] No geographic.states found in aggregated data: {...}
```

### 2. **Múltiplas Estruturas Suportadas**

O código agora tenta diferentes estruturas:

#### Para Dados Agregados:
1. ✅ `aggregatedData.geographic.states` (filtra `avg_speed > 0`)

#### Para Report Individual:
1. ✅ `reportData.raw_data.speed_metrics.by_state`
2. ✅ `reportData.raw_data.geographic.states` (com `avg_speed`)

### 3. **Filtros Melhorados**

- ✅ Verifica se `avg_speed` existe e é maior que 0
- ✅ Trata valores `null`, `undefined` e `0`
- ✅ Logs mostram todos os estados (mesmo sem speed)

---

## 📝 Mudanças no Código

### `composables/useDomainDashboard.ts`

#### `speedByStateChartData` Computed:
- ✅ Logs detalhados de todos os estados
- ✅ Mostra quantos estados têm `avg_speed > 0`
- ✅ Avisos quando não há dados de velocidade
- ✅ Suporta múltiplas estruturas de dados

#### `loadAggregatedStats`:
- ✅ Logs sobre `geographic.states`
- ✅ Conta estados com `avg_speed > 0`
- ✅ Mostra estrutura completa recebida

#### `loadDashboardStats`:
- ✅ Logs sobre `speed_metrics` e `geographic`
- ✅ Verifica múltiplas estruturas possíveis

---

## 🔬 Como Diagnosticar

### 1. **Abrir Console do Navegador**

1. Abra DevTools (F12)
2. Vá para a aba **Console**
3. Navegue para `/domains/1/dashboard` e depois `/domains/15/dashboard`

### 2. **Verificar Logs**

Procure por logs começando com:
- `[Domain X] Aggregated data structure:`
- `[Speed Chart] Aggregated data - States:`
- `[Speed Chart] No states with speed > 0 found...`
- `[Speed Chart] No geographic.states found...`

### 3. **Comparar Entre Domínios**

```javascript
// Domínio 1 (funciona)
[Domain 1] Aggregated data structure: {
  hasGeographic: true,
  hasStates: true,
  statesCount: 10,
  statesWithSpeed: 8  // ✅ Tem estados com speed
}

[Speed Chart] Aggregated data - States: {
  totalStates: 10,
  statesWithSpeed: 8  // ✅ Dados suficientes para gráfico
}

// Domínio 15 (não funciona)
[Domain 15] Aggregated data structure: {
  hasGeographic: true,
  hasStates: true,
  statesCount: 10,
  statesWithSpeed: 0  // ❌ Nenhum estado com speed > 0!
}

[Speed Chart] No states with speed > 0 found. All states: [
  { name: "California", avg_speed: 0 },
  { name: "Texas", avg_speed: null },
  ...
]
```

### 4. **Possíveis Problemas e Soluções**

#### Problema 1: Todos os estados têm `avg_speed: 0` ou `null`
**Causa:** API não calcula velocidade para este domínio  
**Solução:** Verificar backend - pode ser que este domínio não tenha dados de velocidade

#### Problema 2: Estrutura de dados diferente
**Causa:** API retorna velocidade em outro campo  
**Solução:** Os logs mostrarão onde estão os dados e podemos ajustar o código

#### Problema 3: Dados em `speed_metrics` ao invés de `geographic.states`
**Causa:** Estrutura de report individual diferente  
**Solução:** Código já tenta ambas as estruturas

---

## 🧪 Teste

### Teste 1: Domínio 1
```bash
1. Navegue para /domains/1/dashboard
2. Abra Console (F12)
3. Verifique logs:
   - [Domain 1] Aggregated data structure
   - [Speed Chart] Aggregated data - States
4. Verifique se o gráfico aparece ✅
```

### Teste 2: Domínio 15
```bash
1. Navegue para /domains/15/dashboard
2. Abra Console (F12)
3. Verifique logs:
   - [Domain 15] Aggregated data structure
   - [Speed Chart] Aggregated data - States
4. Compare com domínio 1
5. Verifique se o gráfico aparece ✅
```

### Teste 3: Report Individual
```bash
1. Selecione um report específico (não "All Reports")
2. Verifique logs:
   - [Report X] Report data structure
   - [Speed Chart] Using speed_metrics.by_state
3. Verifique se o gráfico aparece ✅
```

---

## 📊 Estruturas Suportadas

### Dados Agregados:

| Campo | Estrutura | Status |
|-------|-----------|--------|
| `geographic.states` | `[{name, code, avg_speed}]` | ✅ Prioridade 1 |

### Report Individual:

| Campo | Estrutura | Status |
|-------|-----------|--------|
| `raw_data.speed_metrics.by_state` | `[{state, avg_speed}]` | ✅ Prioridade 1 |
| `raw_data.geographic.states` | `[{name, avg_speed}]` | ✅ Prioridade 2 |

---

## 🎯 Próximos Passos

1. ✅ **Testar** com domínios 1 e 15
2. ✅ **Verificar logs** no console
3. ✅ **Comparar** estruturas de resposta
4. ⚠️ **Se necessário:** Ajustar backend para calcular `avg_speed` para domínio 15
5. ⚠️ **Se necessário:** Adicionar mais fallbacks baseado nos logs

---

## 📝 Resumo

✅ **Logs detalhados** para diagnóstico  
✅ **Múltiplas estruturas** suportadas  
✅ **Filtros melhorados** para dados de velocidade  
✅ **Avisos claros** quando não há dados  
✅ **Compatibilidade** com diferentes formatos  

**Status:** ✅ Implementado e pronto para teste!

---

**Data:** November 10, 2025  
**Issue:** Speed chart not showing for domain 15  
**Solution:** Enhanced debug logs + multiple structure support  
**Files Modified:** 1  
**Status:** ✅ Ready for testing

