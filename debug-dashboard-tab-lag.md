# Debug Session: dashboard-tab-lag
- **Status**: [OPEN]
- **Issue**: Cambio tab nella dashboard percepito come molto lento
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-dashboard-tab-lag.ndjson

## Reproduction Steps
1. Avviare l'app in locale.
2. Entrare nella dashboard autenticata.
3. Cambiare tab tra pagine dashboard come `Prodotti`, `Categorie`, `Promo`, `Analytics`.
4. Misurare tempi percepiti e loggare tempi di navigazione/render.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | La navigazione attende il completamento del render server di ogni pagina dashboard | High | Low | Pending |
| B | Il middleware/auth aggiunge lavoro ripetuto ad ogni cambio route | Med | Low | Pending |
| C | Le query Prisma di alcune pagine impattano direttamente il tempo di navigazione | High | Med | Pending |
| D | La shell/dashboard client aggiunge lavoro lato browser durante il cambio tab | Med | Med | Pending |
| E | L'assenza di prefetch utile lascia tutte le navigazioni completamente a freddo | Med | Low | Pending |

## Log Evidence
- `pre-fix`: il tempo click -> cambio pathname dashboard e' risultato spesso tra ~`835ms` e ~`2114ms`.
- `pre-fix`: `requireDashboardContext()` quasi sempre tra ~`79ms` e ~`242ms`, con un outlier a `1551ms`.
- `pre-fix`: query pagina misurate tra ~`138ms` e ~`245ms` per overview/categorie/promo.
- Evidenza dai log dev del server: `Compiled /dashboard/orders in 440ms`, `Compiled /dashboard/promotions in 374ms`, `Compiled /dashboard/ai in 1529ms`.
- Conclusione intermedia: la lentezza percepita nel cambio tab in sviluppo e' dominata dalla compilazione on-demand del dev server piu' che dal solo runtime DB.

## Verification Conclusion
- Ipotesi A: **Confermata**. La navigazione dashboard attende il lavoro server/route e in dev viene amplificata dalla compilazione on-demand.
- Ipotesi B: **Parzialmente confermata**. L'auth pesa, ma non spiega da sola i secondi percepiti.
- Ipotesi C: **Non principale**. Le query misurate non sono abbastanza lente da giustificare da sole il lag osservato.
- Ipotesi D: **Non ancora dominante** nei log raccolti.
- Ipotesi E: **Confermata** come fattore secondario; reintrodotto il prefetch standard di Next.
- Fix applicato: uso di `next dev --turbopack` per ridurre i tempi di compilazione in sviluppo, mantenendo `dev:webpack` come fallback.
