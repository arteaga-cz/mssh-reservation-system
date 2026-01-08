# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WordPress plugin ("Zápisový Rezervační systém" / Enrollment Reservation System) for managing time-slot reservations, typically used for kindergarten enrollment scheduling. The plugin is written in Czech.

## Commit Messages

- Follow Conventional Commits for the subject line (e.g., `feat:`, `fix:`, `chore:`) and keep it under 100 characters.
- Insert a blank line after the subject, then add a detailed body that explains the motivation, scope, and outcomes using short paragraphs and bullet lists indented with two spaces..
- Use sub-bullets to call out implementation details, tests, and documentation updates so reviewers can scan impact quickly.

Example:

```
feat: tighten profile domain validation

  Clarifies the service-level guardrails for profile slugs, prevents duplicate work across hooks,
  and documents the new RPC helper consumers should use.

  - Service updates
      - Ensure normalizeProfileSlug runs before every RPC call
      - Emit debug logs for rejected slugs to aid support escalations
  - Client behavior
      - Synchronize useProfileMutations to display inline error hints
  - Tests & docs
      - Add Vitest coverage for slug normalization edge cases
      - Extend docs/PROFILES.md with validation rules and troubleshooting steps
```

## Architecture

**Single-file plugin**: All PHP logic resides in `reservation-system.php`. There is no class-based architecture - the plugin uses procedural WordPress functions.

**Key components:**
- **Database tables**: Two custom tables (`{prefix}_reservations` and `{prefix}_reservation_slots`) created on activation
- **Shortcode**: `[reservation_table]` renders the public-facing reservation form and table
- **Admin page**: Accessed via WordPress admin menu "Rezervace" for managing reservations, capacities, and settings
- **Excel export**: Uses PhpSpreadsheet library (in `lib/vendor/`) to export reservations as `.xlsx`

**Data flow:**
1. Time slots are generated dynamically based on start time, end time, and interval (stored in WP options)
2. Each slot has a configurable capacity (default 6)
3. Slot availability is loaded via AJAX (`rs_ajax_get_availability`) to avoid stale cached data
4. Users submit reservations via POST form with nonce verification
5. Flash messages use PHP sessions (`$_SESSION`)

## Development Commands

**Install PHP dependencies (for PhpSpreadsheet):**
```bash
cd lib && composer install
```

**Test PHP syntax:**
```bash
php -l reservation-system.php
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `rs_activate_plugin()` | Creates database tables and initializes slots |
| `rs_reservation_table_shortcode()` | Renders public reservation table (skeleton + lightbox) |
| `rs_ajax_get_availability()` | AJAX endpoint returning current slot availability |
| `rs_admin_page()` | Renders admin management interface |
| `rs_handle_reservation_submission()` | Processes form submissions (hooked to `template_redirect`) |
| `rs_export_reservations_to_excel()` | Generates Excel file for download |
| `rs_generate_times()` | Creates array of time slots based on settings |
| `rs_load_data()` | Retrieves all reservations and capacities from DB |

## WordPress Hooks Used

- `register_activation_hook` - Database table creation
- `wp_enqueue_scripts` / `admin_enqueue_scripts` - CSS loading
- `add_shortcode` - Public reservation table
- `admin_menu` - Admin page registration
- `admin_init` - Settings update handlers
- `template_redirect` - Form submission processing
- `admin_post_*` - Excel export action

## Options Stored in WordPress

- `rs_start_time` - Time slot start (default: "09:00")
- `rs_end_time` - Time slot end (default: "16:30")
- `rs_time_interval` - Minutes between slots (default: 15)
- `rs_config` - Array containing:
  - `reservations_enabled` - Enable/disable reservations (0/1)
  - `closed_notice_text` - Custom message when closed
  - `hide_closed_notice` - Hide closed notice on frontend (0/1)

## Files

- `reservation-system.php` - All plugin logic
- `assets/css/frontend.css` - Public-facing styles (with lightbox)
- `assets/css/admin.css` - Admin panel styles
- `assets/js/frontend.js` - Lightbox modal functionality
- `lib/` - Composer dependencies (PhpSpreadsheet for Excel export)

## Documentation

Detailed documentation available in `docs/`:

- [docs/INDEX.md](docs/INDEX.md) - Documentation index and quick navigation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design, data flow, component diagrams
- [docs/DATABASE.md](docs/DATABASE.md) - Table schemas, queries, relationships
- [docs/API.md](docs/API.md) - Functions, hooks, shortcodes, CSS classes
- [docs/ADMIN.md](docs/ADMIN.md) - Admin panel usage and configuration guide
