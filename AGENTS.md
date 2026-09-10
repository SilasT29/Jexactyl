# 🤖 Handover für KI-Agenten — Jexactyl-Panel-Entwicklung

> **Dieses Dokument ist für den nächsten KI-Agenten bestimmt**, der dem Benutzer SilasT29 bei der Weiterentwicklung seines angepassten Jexactyl-Panels hilft.
> Sprache der Kommunikation mit dem Benutzer: **Deutsch**.
> Der Benutzer bevorzugt es, große Coding-Aufgaben an **kimi-k2.7-code via OpenCode CLI** zu delegieren, während der orchestrierende Agent (kimi-k3) kurze Fixes selbst macht und deployt.

---

## 1. Projekt-Übersicht

### 1.1 Was ist das?

Ein angepasster **Jexactyl v4.0.7** Game-Server-Management-Panel, lokal auf einem Ubuntu-24.04-Server als Docker-Compose-Stack betrieben.

| Komponente | Details |
|------------|---------|
| Panel | `ghcr.io/jexactyl/jexactyl:latest` als Docker-Container |
| DB | MariaDB 11.x im Container `jexactyl-database-1` |
| Cache | Redis im Container `jexactyl-cache-1` |
| Wings | Pterodactyl Wings v1.13.3 als systemd-Service auf dem Host |
| Frontend | React + TypeScript + Vite + twin.macro + Easy-Peasy + react-i18next |
| Backend | Laravel/PHP (im Docker-Image) |

### 1.2 Lokal erreichbar

- Panel: `http://192.168.178.33` und `http://localhost`
- Admin-Login: `admin` / `test@test.de` / Passwort `Test`
- Minecraft-Testserver: `192.168.178.33:25565` (`online-mode=false`)

### 1.3 Arbeitsverzeichnis

```
/home/hermes/jexactyl
```

**Wichtig:** Backend-Dateien in `app/` und `routes/` sind lokal bearbeitet, aber das Panel läuft aus dem Docker-Image. Nach Backend-Änderungen müssen diese Dateien **in den Container** kopiert werden (siehe Abschnitt 7).

---

## 2. Fertige Features

### 2.1 Branding / Rebranding

- Footer-Text überall von „Powered by Jexactyl“ auf **„Powered by SilasT29.de“** mit Link `https://silast29.de`
- Betroffene Dateien:
  - `resources/scripts/elements/PageContentBlock.tsx`
  - `resources/scripts/elements/AdminContentBlock.tsx`
  - `resources/scripts/components/auth/LoginFormContainer.tsx`

### 2.2 Login / Register

- Login- und Register-Container zentriert mit Minecraft-Key-Art-Hintergrund
- **Hintergrund:** Offizielles Java-Edition-Key-Art, lokal ausgeliefert unter `public/assets/auth-bg.jpg` (2560×1440, von minecraft.wiki geholt, da minecraft.net vom Server nicht erreichbar ist). Eingebaut im `AuthenticationRouter.tsx` (Container) → gilt einheitlich für Login, Register, Passwort-Seiten. Overlay: linear-gradient + blur(3px).
- **reCAPTCHA-Badge:** per CSS ausgeblendet (`.grecaptcha-badge { opacity: 0 }` in AuthenticationRouter + LoginFormContainer), Funktion bleibt erhalten; dezenter i18n-Hinweis `auth.login.recaptcha_notice` unter dem Formular (Google-Sichtbarkeitsanforderung).
- E-Mail-Placeholder: `user@silast29.de`
- Datenschutz-Checkbox in Registrierung mit Link zu `https://silast29.de/datenschutz`
- Dateien:
  - `resources/scripts/routers/AuthenticationRouter.tsx` (Hintergrund + Zentrierung + Badge-CSS)
  - `resources/scripts/components/auth/LoginFormContainer.tsx` (Badge-CSS + Hinweis-Text)
  - `resources/scripts/components/auth/LoginContainer.tsx`
  - `resources/scripts/components/auth/RegisterContainer.tsx`

### 2.3 Mobile-First UI-Optimierungen

- Dashboard-Header gestapelt, responsive
- Server-Row-Karten umbrechen statt horizontal zu quetschen
- File-Manager Sort-Controls kompakt/horizontal/dropdown
- Admin-Header und Tabellen mobil gestapelt
- Checkboxen vergrößert
- Account-Form-Cards kompakt
- Mobile Bottom-Navigation `justify-around`
- Globaler horizontaler Overflow entfernt (`overflow-x-hidden` im Dashboard)

### 2.4 i18n — Deutsch/Englisch

- `resources/scripts/i18n.ts` initialisiert i18next mit `localStorage` Key `panel_language`
- Übersetzungsdateien:
  - `resources/scripts/locales/en.json`
  - `resources/scripts/locales/de.json`
- Aktuell ca. 500+ Keys, u.a. Navigation, Account, Server-Console, File-Manager, Schedules, Backups, Databases, Startup, Users, Network, Billing, Admin-Bereiche, Tickets, Dashboard
- Sprach-Umschalter im UI eingebaut in `AccountOverviewContainer.tsx`

### 2.5 Privacy Mode

- Clientseitige Maskierung von E-Mail, IP, Allokationen
- `localStorage` Key `panel_privacy_mode`
- Shield-Badge in Navigation Bar
- Dateien:
  - `resources/scripts/hooks/usePrivacyMode.ts`
  - `resources/scripts/hooks/usePrivacyModeState.ts`
  - Verwendung in Account, Admin-User-Liste, Server-Network

### 2.6 Server-Gruppen + Bulk-Power

- Mobile Dialoge gefixt (`ServerGroupDialog.tsx`, `ModifyServerGroup.tsx`, globaler `Dialog.tsx`)
- Frontend-only Bulk-Power-Actions pro Gruppe (Start/Restart/Stop)
- Helper: `resources/scripts/api/routes/server/bulkPower.ts`
- Dashboard-Header sauber mit Gruppen-Button

### 2.7 Billing-System — Ticket-basierte Bestellung

**Das wichtigste Custom-Feature.** Stripe wurde entfernt und durch ein manuelles Ticket-System ersetzt:

1. User wählt Paket und schickt Bestellung ab
2. Backend erstellt Order mit Status `pending_payment` und ein Support-Ticket
3. Team klärt Zahlung manuell
4. Admin klickt im Ticket auf **„Server erstellen“**
5. Server wird automatisch provisioniert, Order auf `processed`, Ticket bekommt Erfolgsnachricht

**Backend-Dateien:**
- `app/Http/Controllers/Api/Client/Billing/OrderTicketController.php`
- `app/Http/Requests/Api/Client/Billing/CreateOrderTicketRequest.php`
- `app/Http/Controllers/Api/Application/Tickets/TicketServerController.php`
- `app/Http/Requests/Api/Application/Tickets/CreateServerFromTicketRequest.php`
- `app/Models/Billing/Order.php`
- `app/Services/Billing/ServerDeploymentService.php`
- Route in `routes/api-client.php` und `routes/api-application.php`

**Frontend-Dateien:**
- `resources/scripts/components/account/billing/order/OrderContainer.tsx`
- `resources/scripts/components/account/billing/order/OrderConfirmationButton.tsx`
- `resources/scripts/api/routes/account/billing/orders/process.ts`
- Admin-Ticket-View: Tickets mit „Create Server“-Button

**Wichtige DB-Anpassung:** Spalte `is_default` in `allocations` wurde nachträglich hinzugefügt, da sie im Container-Image fehlte.

### 2.8 Tickets-Seite

- Mobile-optimierte Ticket-Liste und Create-Ticket-Form
- i18n-Keys unter `tickets.*`

### 2.9 Account-Seite

- Sub-Navigation repariert (`/account` statt leerem String)
- Language-Dropdown eingebaut
- Mobile Forms kompakt

---

## 3. Git / Backup

### 3.1 Fork auf GitHub

- Fork: `https://github.com/SilasT29/Jexactyl`
- Branch: `custom-silast29-panel`
- Alle Änderungen sind gepusht.

### 3.2 Remotes im lokalen Repo

```bash
origin  https://github.com/Jexactyl/Jexactyl.git
fork    https://github.com/SilasT29/Jexactyl.git
```

### 3.3 Branch aktuell

```bash
git branch  # custom-silast29-panel
git remote -v
git status  # zeigt ~147 geänderte Dateien an
```

---

## 4. Build- und Deploy-Workflow

### 4.1 Frontend bauen

```bash
cd /home/hermes/jexactyl
pnpm install   # nur wenn package.json geändert wurde
pnpm typecheck
pnpm run build
```

Build-Dauer: ca. 50–55 Sekunden.

### 4.2 Frontend in Container deployen

**Achtung:** `docker cp` verschachtelt Ordner, wenn das Ziel existiert. Deshalb muss der Container-Build-Ordner **vorher gelöscht** werden.

```bash
sudo docker exec jexactyl-panel-1 rm -rf /app/public/build
sudo docker cp /home/hermes/jexactyl/public/build jexactyl-panel-1:/app/public/build
sudo docker exec jexactyl-panel-1 php artisan view:clear
sudo docker exec jexactyl-panel-1 php artisan cache:clear
```

### 4.3 Backend-Dateien in Container kopieren

Nach jeder Änderung an `app/`, `routes/`, `config/`, etc.:

```bash
cd /home/hermes/jexactyl
for file in $(git diff --name-only | grep -E '\.(php|json)$'); do
    sudo docker cp "$file" "jexactyl-panel-1:/app/$file"
done
sudo docker exec jexactyl-panel-1 php artisan route:clear
sudo docker exec jexactyl-panel-1 php artisan cache:clear
sudo docker exec jexactyl-panel-1 php artisan route:cache
sudo docker exec jexactyl-panel-1 php artisan view:clear
```

### 4.4 Laravel-Cache-Befehle

```bash
sudo docker exec jexactyl-panel-1 php artisan optimize:clear
sudo docker exec jexactyl-panel-1 php artisan route:cache
sudo docker exec jexactyl-panel-1 php artisan config:cache
sudo docker exec jexactyl-panel-1 php artisan view:clear
sudo docker exec jexactyl-panel-1 php artisan cache:clear
```

### 4.5 Health-Check

```bash
curl -s -o /dev/null -w 'Panel: %{http_code}\n' http://localhost/auth/login
```

Sollte `200` zurückgeben.

---

## 5. Frontend-Architektur

### 5.1 Verzeichnisstruktur

```
resources/scripts/
├── components/          # React-Komponenten
│   ├── account/         # Dashboard, Account, Tickets, Billing
│   ├── admin/           # Admin-Bereich
│   ├── auth/            # Login, Register
│   ├── server/          # Server-Detailseiten (Console, Files, etc.)
│   └── elements/        # Wiederverwendbare UI-Elemente
├── api/                 # API-Clients und Routen
│   ├── http.ts          # Axios-Instanz
│   └── routes/          # Pro-Feature API-Wrapper
├── elements/            # Sehr wiederverwendbare UI-Elemente (Button, Input, Dialog, etc.)
├── hooks/               # Custom React Hooks
├── locales/             # i18n JSON-Dateien
├── routers/             # React-Router-Konfiguration
└── i18n.ts              # i18next-Initialisierung
```

### 5.2 Wichtige Patterns

- **Styling:** twin.macro (`tw\`...\``) + normale `className` Tailwind-Klassen
- **State:** Easy-Peasy für globales State-Management
- **API:** SWR für Daten fetching, eigene Axios-Wrapper
- **Forms:** Formik
- **TypeScript:** Strict mode, `pnpm typecheck` muss sauber sein

### 5.3 i18n-Konventionen

- Alle neuen UI-Strings müssen in `resources/scripts/locales/en.json` **und** `de.json`
- Keys strukturiert nach Bereich, z.B. `dashboard.your_servers`, `billing.order.submit`, `tickets.create_server`
- Verwendung: `const { t } = useTranslation();` dann `t('key')`
- Fallback auf Englisch ist aktiv

### 5.4 Mobile-Design-Regeln

- Kein horizontaler Overflow auf 375px
- Bottom-Nav fester, dafür Pages `pb-20` (oder mehr) Padding geben
- Buttons nicht hinter der Nav verstecken
- Touch-Targets mindestens 44×44px
- Karten-Content bei Bedarf vertikal stapeln (`flex-col` → `md:flex-row`)

---

## 6. Backend-Architektur

### 6.1 Verzeichnisstruktur

```
app/
├── Http/
│   ├── Controllers/Api/Client/     # User-API
│   ├── Controllers/Api/Application/# Admin-API
│   ├── Middleware/                 # Laravel-Middleware
│   ├── Requests/                   # Form-Request-Validierung
│   └── ...
├── Models/                         # Eloquent-Models
├── Services/                       # Geschäftslogik
│   └── Billing/                   # Billing-Services
├── Transformers/                   # API-Response-Formatierung
routes/
├── api-client.php                  # /api/client/*
├── api-application.php             # /api/application/* (Admin)
└── ...
```

### 6.2 Wichtige Models

- `Everest\Models\User`
- `Everest\Models\Server`
- `Everest\Models\Node`
- `Everest\Models\Ticket`
- `Everest\Models\TicketMessage`
- `Everest\Models\Billing\Order`
- `Everest\Models\Billing\Product`
- `Everest\Models\Billing\Category`
- `Everest\Models\Billing\BillingException`

### 6.3 Billing-Order-Status

```php
Order::STATUS_PENDING_PAYMENT = 'pending_payment';
Order::STATUS_PROCESSED     = 'processed';
Order::STATUS_EXPIRED       = 'expired';
Order::TYPE_NEW             = 'new';
Order::TYPE_RENEWAL         = 'renewal';
Order::TYPE_UPGRADE         = 'upgrade';
```

---

## 7. Häufige Probleme und Lösungen

### 7.1 „Store unavailable“ im Billing

Ursache: Kategorie oder Produkt auf `visible = 0`, oder Billing-Links fehlen.

Fix:
```bash
sudo docker exec jexactyl-panel-1 php artisan tinker --execute="
\Everest\Models\Billing\Category::query()->update(['visible' => true]);
\Everest\Models\Billing\Product::query()->update(['visible' => true]);
\Everest\Models\Setting::updateOrCreate(['key' => 'settings::modules:billing:links:terms'], ['value' => 'https://silast29.de/agb']);
\Everest\Models\Setting::updateOrCreate(['key' => 'settings::modules:billing:links:privacy'], ['value' => 'https://silast29.de/datenschutz']);
\Everest\Models\Setting::updateOrCreate(['key' => 'settings::modules:billing:links:refunds'], ['value' => 'https://silast29.de/agb']);
"
sudo docker exec jexactyl-panel-1 php artisan cache:clear
```

### 7.2 „There are no nodes available for deployment“

Ursache: Node hat keine freie Allocation.

Fix: Weitere Ports hinzufügen:
```bash
sudo docker exec jexactyl-panel-1 php artisan tinker --execute="
\$node = \Everest\Models\Node::first();
for (\$port = 25566; \$port <= 25575; \$port++) {
    \Everest\Models\Allocation::firstOrCreate(
        ['node_id' => \$node->id, 'ip' => '192.168.178.33', 'port' => \$port],
        ['ip_alias' => '', 'server_id' => null]
    );
}
"
```

### 7.3 CSRF token mismatch bei API-Calls

Ursache: Route läuft unter Web-Middleware, Frontend holt keinen CSRF-Cookie.

Fix im API-Wrapper:
```typescript
http.get('/sanctum/csrf-cookie').then(() => http.post('/api/client/...', data))
```

### 7.4 Backend-Änderungen wirken sich nicht aus

Ursache: Geänderte PHP-Dateien sind nicht in den Container kopiert.

Fix: Siehe Abschnitt 4.3.

### 7.5 Horizontaler Scroll trotz Mobile-Fixes

Ursache: Ein Container hat `overflow-x-auto` oder ein Element ist zu breit.

Fix: Suche nach `overflow-x-auto`, `min-w-0`, `whitespace-nowrap`. Prüfe mit Browser-DevTools welches Element überläuft.

---

## 8. Konventionen für neue Features

### 8.1 Bevor du anfängst

1. Lade relevante Skills (falls vorhanden):
   - `skill_view(name='jexactyl-panel-ops')` — enthält Build-/Deploy-Loop
   - `skill_view(name='opencode')` — Delegation an OpenCode
2. Prüfe `git status`, ob es ungesicherte Änderungen gibt
3. Baue immer nach Frontend-Änderungen neu (`pnpm run build`)
4. Kopiere Backend-Änderungen in den Container
5. Clear caches
6. Teste auf 375px Mobile + Desktop

### 8.2 Bei großen Features

1. Spec im Chat mit dem Benutzer abstimmen
2. An **kimi-k2.7-code via OpenCode** delegieren mit:
   - Dateien, die bearbeitet werden sollen
   - Technische Constraints (keine neuen npm-Pakete, twin.macro, i18n)
   - Gewünschtes Deliverable
3. Ergebnis selbst überprüfen:
   - `pnpm typecheck`
   - Build sauber?
   - Backend-Dateien im Container?
   - Keine harten Credentials im Code?
4. Deployen und testen

### 8.3 Keine Credentials im Code

- `.env` enthält Secrets, wird aber von `.gitignore` ausgeschlossen
- Nie Token/Passwörter in Commits, Chats oder Screenshots unkenntlich machen
- Bereits im Chat geteilte Token müssen rotiert werden

---

## 9. Deployment auf anderem Server

Siehe detaillierte Anleitung im Chat-Verlauf oder im Skript:

- Docker-Variante: `docker compose up -d` mit eigenem `.env`
- Native Variante ohne Docker: `/home/hermes/setup-jexactyl-native.sh` (noch anzupassen: Domain/E-Mail)

Für native Installation braucht es:
- Ubuntu 24.04
- PHP 8.3 + Extensions
- MariaDB + Redis + Nginx
- Node.js 22 + pnpm
- Composer

---

## 10. Wichtige Dateien auf einen Blick

| Zweck | Datei |
|-------|-------|
| Docker-Stack | `docker-compose.yml` |
| OpenCode-Config | `opencode.json` |
| i18n Init | `resources/scripts/i18n.ts` |
| Übersetzungen DE | `resources/scripts/locales/de.json` |
| Übersetzungen EN | `resources/scripts/locales/en.json` |
| Dashboard | `resources/scripts/components/account/DashboardContainer.tsx` |
| Server-Karte | `resources/scripts/components/account/ServerRow.tsx` |
| Footer | `resources/scripts/elements/PageContentBlock.tsx` |
| Mobile Bottom-Nav | `resources/scripts/elements/MobileSidebar.tsx` |
| Account Overview | `resources/scripts/components/account/AccountOverviewContainer.tsx` |
| Billing Order | `resources/scripts/components/account/billing/order/OrderContainer.tsx` |
| Order Ticket API | `resources/scripts/api/routes/account/billing/orders/process.ts` |
| Order Ticket Controller | `app/Http/Controllers/Api/Client/Billing/OrderTicketController.php` |
| Ticket Server Controller | `app/Http/Controllers/Api/Application/Tickets/TicketServerController.php` |
| Client Routes | `routes/api-client.php` |
| Application Routes | `routes/api-application.php` |
| Build Output | `public/build/` |
| Git Fork Remote | `https://github.com/SilasT29/Jexactyl` Branch `custom-silast29-panel` |

---

## 11. Kommunikation mit dem Benutzer

- **Sprache:** Deutsch bevorzugt, Englisch akzeptiert
- **Stil:** Kurz, direkt, konkret. Verdict/aktionable Antwort zuerst, Details danach
- **Screenshots:** Benutzer testet primär auf Handy (375px). Auf Mobile-Overflow achten
- **Delegation:** Große Features an kimi-k2.7-code via OpenCode delegieren; Kimi K3 orchestriert und deployt
- **Ollama-Cloud-Limits:** Bei großen Jobs früh auf Session-Limits achten; falls erreicht, manuell weitermachen

---

## 12. Schnell-Checkliste für neue Agenten

- [ ] Skills `jexactyl-panel-ops` und `opencode` geladen?
- [ ] `cd /home/hermes/jexactyl`?
- [ ] `git status` geprüft?
- [ ] Bei Frontend-Änderungen: `pnpm typecheck` + `pnpm run build`?
- [ ] Container-Build-Ordner vor `docker cp` gelöscht?
- [ ] Backend-Dateien in den Container kopiert?
- [ ] Laravel caches geleert + route:cache?
- [ ] Auf 375px und Desktop getestet?
- [ ] Neue Strings in `en.json` und `de.json`?
- [ ] Keine Secrets im Code?

---

*Letzte Aktualisierung: 26. August 2026*
*Verfasser: Hermes Agent (kimi-k3) im Auftrag von SilasT29*
