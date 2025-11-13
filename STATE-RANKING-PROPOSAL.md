# 🗺️ State/Region Rankings by Provider - Proposal

## 💡 Proposta

Implementar **ranking de estados/regiões por provider** para mostrar quais estados geram mais tráfego para cada provider.

---

## ✅ Dados Disponíveis

Com base na estrutura atual, **já temos dados geográficos**:

```typescript
geographic: {
  states: Array<{
    state_id: number;
    code: string;         // "CA", "TX", "NY", "FL", "SP", "RJ"
    name: string;         // "California", "Texas", "São Paulo"
    total_requests: number;
    avg_success_rate: number;
    avg_speed: number;
    report_count: number;
  }>;
}
```

---

## 🎯 O Que Mostrar

### Opção 1: Nova Tab "By State"
Adicionar 4ª tab no Global Dashboard:

**Tabs:**
1. Domain Ranking 🏆
2. Provider Rankings 📊
3. **State Rankings** 🗺️ (NEW!)
4. Compare Domains 🔄

### Opção 2: Seção Adicional no Provider Rankings
Adicionar abaixo da tabela principal de providers

---

## 📊 Exemplo de Visualização

### Quando Selecionar "Spectrum":

**Tabela: Top States Using Spectrum**

| Rank | State | Code | Requests | Domains | Avg Success | Avg Speed |
|------|-------|------|----------|---------|-------------|-----------|
| 🥇 #1 | California | CA | 1,250 | 5 | 92.5% | 850 ms |
| 🥈 #2 | Texas | TX | 980 | 4 | 89.0% | 920 ms |
| 🥉 #3 | New York | NY | 720 | 3 | 91.2% | 880 ms |
| #4 | Florida | FL | 550 | 2 | 87.5% | 950 ms |
| #5 | Illinois | IL | 420 | 2 | 90.0% | 870 ms |

**Insights:**
- California tem mais tráfego Spectrum
- New York tem melhor success rate (91.2%)
- Texas tem velocidade mais lenta

---

## 🎨 UI Mockup

### Layout Proposto:

```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Provider Rankings                                    │
├─────────────────────────────────────────────────────────┤
│ [Provider ▼] [Technology ▼] [Period ▼] [Clear Filters] │
│ [Sort By ▼] [Limit ▼] [📅 Last 30 Days]                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Domain Rankings Table (current)                         │
│ #1 smarterhome.ai | Earthlink | 416 req | 18.6%       │
│ #2 zip.50g.io | Spectrum | 500 req | 50.0%            │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🗺️ Geographic Distribution                             │
│ [Show States ▼]                                         │
├─────────────────────────────────────────────────────────┤
│ State Rankings (NEW!)                                   │
│ #1 California (CA) | 1,250 req | 5 domains             │
│ #2 Texas (TX) | 980 req | 4 domains                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoint Necessário

### Opção A: Usar Endpoint Existente
Se o backend já retorna dados de estados agregados:

```bash
GET /api/admin/reports/global/provider-ranking/by-state
```

**Query params:**
- `provider_id` - Filter by provider
- `period` - Time range
- `limit` - Top N states

### Opção B: Processar no Frontend
Usar dados existentes e agregar no frontend:
- Pegar todos os domínios de um provider
- Agregar por estado
- Ordenar e mostrar

---

## 🎯 Casos de Uso

### Use Case 1: Regional Strategy
**Question:** "Which states should Spectrum focus on?"

**Action:**
- Select Spectrum
- View state rankings
- See top 10 states

**Insight:** California and Texas generate most traffic

### Use Case 2: Performance by Region
**Question:** "Which states have best AT&T Fiber performance?"

**Action:**
- Select AT&T
- Filter by Fiber
- Sort by Success Rate

**Insight:** Identify regions with better service quality

### Use Case 3: Market Penetration
**Question:** "Where is HughesNet most used?"

**Action:**
- Select HughesNet (Satellite)
- View state distribution
- Identify rural state concentration

---

## 🏗️ Implementation Options

### Option 1: Simple State List (Easier)
Just show a list/table of states for selected provider

**Pros:**
- Quick to implement (~1 hour)
- Uses existing data structure
- No new API needed

**Cons:**
- Limited visualization
- No map view

### Option 2: Interactive Map (Advanced)
Show US/Brazil map with color-coded states

**Pros:**
- Better visualization
- Interactive hover tooltips
- Professional presentation

**Cons:**
- More complex (~3-4 hours)
- Requires map library (e.g., Chart.js Geo)
- More dependencies

### Option 3: Both
List + Map toggle

**Pros:**
- Best of both worlds
- User choice

**Cons:**
- Most time to implement

---

## 📊 Data Structure Needed

### State Ranking Response
```typescript
interface StateRanking {
  rank: number;
  state_id: number;
  state_code: string;         // "CA", "TX", "NY"
  state_name: string;         // "California", "Texas"
  total_requests: number;     // Total from this provider in this state
  unique_domains: number;     // How many domains in this state
  avg_success_rate: number;   // Average success rate
  avg_speed: number;          // Average speed
  percentage_of_provider: number;  // % of provider's total traffic
}
```

### Example Response
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": 15,
      "name": "Spectrum"
    },
    "state_rankings": [
      {
        "rank": 1,
        "state_code": "CA",
        "state_name": "California",
        "total_requests": 1250,
        "unique_domains": 5,
        "avg_success_rate": 92.5,
        "avg_speed": 850,
        "percentage_of_provider": 35.7  // 35.7% of all Spectrum traffic
      }
    ],
    "total_states": 25,
    "provider_total_requests": 3500
  }
}
```

---

## 🎨 Component Mockup

### Component: `StateRankingTable.vue`

```vue
<template>
  <v-card class="mt-6">
    <v-card-title>
      <v-icon class="mr-2">mdi-map-marker-radius</v-icon>
      Geographic Distribution
      <v-chip v-if="selectedProvider" color="info" variant="tonal" class="ml-2">
        {{ selectedProvider.name }}
      </v-chip>
    </v-card-title>

    <v-table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>State</th>
          <th>Requests</th>
          <th>Domains</th>
          <th>% of Provider</th>
          <th>Success Rate</th>
          <th>Avg Speed</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="state in stateRankings" :key="state.state_id">
          <td>#{{ state.rank }}</td>
          <td>
            {{ state.state_name }} ({{ state.state_code }})
          </td>
          <td>{{ state.total_requests.toLocaleString() }}</td>
          <td>{{ state.unique_domains }}</td>
          <td>
            <v-chip color="info" size="small">
              {{ state.percentage_of_provider.toFixed(1) }}%
            </v-chip>
          </td>
          <td>{{ state.avg_success_rate.toFixed(1) }}%</td>
          <td>{{ state.avg_speed.toFixed(0) }} ms</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>
```

---

## 📋 Implementation Checklist (If Approved)

### Backend
- [ ] Check if endpoint `/provider-ranking/by-state` exists
- [ ] If not, we can aggregate from existing data
- [ ] Verify state data is available

### Frontend
- [ ] Add state ranking interfaces to types
- [ ] Create StateRankingRepository
- [ ] Create StateRankingService
- [ ] Create useStateRankings composable
- [ ] Create StateRankingTable component
- [ ] Integrate into Global Dashboard
- [ ] Add tests

**Estimated Time:** 2-3 hours

---

## 🤔 Questions for You

1. **Do you want state/region rankings?** (Yes/No)

2. **If yes, which format?**
   - [ ] Simple table list
   - [ ] Interactive map
   - [ ] Both

3. **Where to display?**
   - [ ] New tab in Global Dashboard
   - [ ] Below Provider Rankings table
   - [ ] Separate page

4. **Which states?**
   - [ ] US States only
   - [ ] Brazilian States only
   - [ ] Both (international)

---

## ✅ Current Status

**Period Filter:** ✅ Implemented and Working

**State Rankings:** ⏳ Awaiting your decision

- If **YES** → I'll implement it now
- If **NO** → We're done with Provider Rankings

---

**Let me know your preference!** 🚀

