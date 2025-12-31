# Architecture

## Overview

Single-file procedural WordPress plugin. All logic resides in `mssh-reservation-system.php` using WordPress APIs and conventions.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WordPress Core                            │
├─────────────────────────────────────────────────────────────────┤
│  Hooks System    │  Options API   │  $wpdb        │  Nonces     │
└────────┬─────────┴───────┬────────┴───────┬───────┴──────┬──────┘
         │                 │                │              │
┌────────▼─────────────────▼────────────────▼──────────────▼──────┐
│                   mssh-reservation-system.php                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Shortcode  │  │   Admin     │  │      Data Layer         │  │
│  │  Renderer   │  │   Pages     │  │  (DB queries/options)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                    Form Handlers                           │  │
│  │  (reservation submit, capacity update, settings, export)  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
┌────────▼────────┐
│   PhpSpreadsheet │
│   (Excel export) │
└─────────────────┘
```

## Data Flow

### Public Reservation Flow

```
User visits page with [reservation_table]
         │
         ▼
rs_reservation_table_shortcode()
         │
         ├── rs_load_data() ──────► {prefix}_reservations
         │                          {prefix}_reservation_slots
         ├── rs_generate_times() ──► Options: rs_start_time, rs_end_time, rs_time_interval
         └── rs_get_config() ─────► Option: rs_config
         │
         ▼
Renders HTML table + form
         │
         ▼
User submits form (POST)
         │
         ▼
template_redirect hook
         │
         ▼
rs_handle_reservation_submission()
         │
         ├── Verify nonce
         ├── Check capacity
         ├── Check name uniqueness
         └── Insert into {prefix}_reservations
         │
         ▼
rs_set_message() ──► $_SESSION['flash_message']
         │
         ▼
Redirect back (JavaScript)
```

### Admin Flow

```
Admin navigates to Rezervace menu
         │
         ▼
rs_admin_page()
         │
         ├── Display current reservations
         ├── Handle capacity updates (POST)
         ├── Handle reservation deletions (POST)
         └── Handle settings updates (POST)
         │
         ▼
rs_set_message() ──► $_SESSION['flash_message']
         │
         ▼
Redirect/refresh
```

### Excel Export Flow

```
Admin clicks "Exportovat do Excelu"
         │
         ▼
POST to admin-post.php?action=export_reservations_to_excel
         │
         ▼
rs_export_reservations_to_excel()
         │
         ├── Query all reservations with capacities
         ├── Load PhpSpreadsheet via Composer autoload
         ├── Build spreadsheet with formatting
         └── Output with headers for download
```

## State Management

### Session State
- Flash messages stored in `$_SESSION['flash_message']`
- Session started at plugin load (`session_start()`)

### Persistent State (WordPress Options)

| Option Key | Type | Default | Purpose |
|------------|------|---------|---------|
| `rs_start_time` | string | `"09:00"` | First time slot |
| `rs_end_time` | string | `"16:30"` | Last time slot |
| `rs_time_interval` | int | `15` | Minutes between slots |
| `rs_config` | array | `['reservations_enabled' => 0]` | Feature flags |

### Database State
See [DATABASE.md](./DATABASE.md) for table schemas.

## Security Model

| Protection | Implementation |
|------------|----------------|
| CSRF | WordPress nonces on all forms |
| SQL Injection | `$wpdb->prepare()` for all queries |
| XSS | `esc_html()`, `esc_attr()`, `sanitize_text_field()` |
| Authorization | `current_user_can('manage_options')` for admin actions |
| Direct Access | `if (!defined('ABSPATH')) exit;` |

## File Dependencies

```
mssh-reservation-system.php
         │
         ├── assets/style.css (enqueued via wp_enqueue_style)
         │
         └── lib/vendor/autoload.php (loaded on-demand for Excel export)
                    │
                    └── phpoffice/phpspreadsheet
```

## Hook Registration Timeline

```
Plugin Load
    │
    ├── register_activation_hook ──► rs_activate_plugin (DB setup)
    │
    ├── add_action('wp_enqueue_scripts') ──► rs_enqueue_styles
    ├── add_action('admin_enqueue_scripts') ──► rs_enqueue_styles
    │
    ├── add_action('admin_menu') ──► rs_admin_menu
    ├── add_action('admin_init') ──► rs_update_time_range_settings
    ├── add_action('admin_init') ──► rs_update_plugin_settings
    │
    ├── add_action('template_redirect') ──► rs_handle_reservation_submission
    │
    ├── add_action('admin_post_update_time_range') ──► rs_update_slots_after_time_change
    └── add_action('admin_post_export_reservations_to_excel') ──► rs_export_reservations_to_excel
    │
    └── add_shortcode('reservation_table') ──► rs_reservation_table_shortcode
```
