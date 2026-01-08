# MSSH Reservation System - Documentation Index

> WordPress plugin for time-slot reservation management (Zápisový Rezervační systém)

## Quick Navigation

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | System design, data flow, component relationships |
| [Database Schema](./DATABASE.md) | Table structures, relationships, queries |
| [API Reference](./API.md) | Functions, hooks, shortcodes, actions |
| [Admin Guide](./ADMIN.md) | Configuration, settings, management |

## Project Structure

```
reservation-system/
├── reservation-system.php   # Main plugin file (all logic)
├── assets/
│   ├── css/
│   │   ├── admin.css            # Admin panel styling
│   │   ├── admin.min.css        # Minified admin CSS
│   │   ├── frontend.css         # Public-facing styling
│   │   └── frontend.min.css     # Minified frontend CSS
│   └── js/
│       ├── frontend.js          # Lightbox interaction
│       └── frontend.min.js      # Minified frontend JS
├── lib/
│   ├── composer.json            # Dependencies (PhpSpreadsheet)
│   └── vendor/                  # Composer packages
├── docs/                        # This documentation
└── CLAUDE.md                    # AI assistant guidance
```

## Key Concepts

### Time Slots
Dynamically generated based on configurable start/end times and interval. Each slot has an independent capacity setting.

### Reservations
One reservation per name (unique constraint). Names are sanitized and stored with associated time slot.

### Configuration
- **Reservations enabled/disabled** - Master toggle for public access
- **Time range** - Start time, end time, interval (in minutes)
- **Per-slot capacity** - Individual capacity limits per time slot

## Entry Points

| Context | Entry Point |
|---------|-------------|
| Public frontend | `[reservation_table]` shortcode |
| Admin dashboard | WordPress Admin → Rezervace menu |
| Plugin activation | `register_activation_hook` → `rs_activate_plugin()` |
| Form submission | `template_redirect` hook → `rs_handle_reservation_submission()` |
| Excel export | `admin_post_export_reservations_to_excel` action |

## Dependencies

- **WordPress** 5.0+ (uses `$wpdb`, nonces, options API)
- **PHP** 7.4+ (typed function signatures)
- **PhpSpreadsheet** 1.18 (Excel export functionality)
- **JavaScript** ES6+ (lightbox modal functionality)

## Related Files

- [`../CLAUDE.md`](../CLAUDE.md) - AI assistant context and commit guidelines
