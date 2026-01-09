# Architecture

## Overview

Single-file procedural WordPress plugin. All logic resides in `reservation-system.php` using WordPress APIs and conventions.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WordPress Core                            │
├─────────────────────────────────────────────────────────────────┤
│  Hooks System    │  Options API   │  $wpdb        │  Nonces     │
└────────┬─────────┴───────┬────────┴───────┬───────┴──────┬──────┘
         │                 │                │              │
┌────────▼─────────────────▼────────────────▼──────────────▼──────┐
│                   reservation-system.php                         │
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
         │                              │
┌────────▼────────┐          ┌─────────▼─────────┐
│   PhpSpreadsheet │          │  frontend.js      │
│   (Excel export) │          │  (Lightbox modal) │
└─────────────────┘          └───────────────────┘
```

## Data Flow

### Public Reservation Flow

```
User visits page with [reservation_table]
         │
         ▼
rs_reservation_table_shortcode()
         │
         └── Renders loading skeleton + lightbox modal
             (HTML is cacheable, no stale data)
         │
         ▼
frontend.js DOMContentLoaded
         │
         ▼
loadAvailability() ──► AJAX POST to admin-ajax.php
         │              action: rs_get_availability
         │              nonce: rs_availability_nonce
         │
         ▼
rs_ajax_get_availability()
         │
         ├── Verify nonce
         ├── Check rs_get_config() → reservations enabled?
         ├── rs_load_public_data() ──► {prefix}_reservations (counts only)
         ├── rs_generate_times() ────► Options: rs_start_time, rs_end_time
         └── Return JSON with available slots
         │
         ▼
frontend.js renderSlots()
(Populates table, attaches button handlers)
         │
         ▼
User clicks "Rezervovat" button
         │
         ▼
frontend.js opens lightbox modal
(Focus trap, Escape key close, WCAG 2.2 AA)
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
wp_safe_redirect() back to page
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
| `rs_config` | array | See below | Plugin configuration |

**`rs_config` array structure:**
```php
[
    'reservations_enabled' => 0,                              // 0=off, 1=on
    'closed_notice_text' => 'Rezervace jsou momentálně uzavřeny.',  // Custom message
    'hide_closed_notice' => 0                                 // 0=show, 1=hide
]
```

### Database State
See [DATABASE.md](./DATABASE.md) for table schemas.

## Security Model

| Protection | Implementation |
|------------|----------------|
| CSRF | WordPress nonces on all forms |
| SQL Injection | `$wpdb->prepare()` for all queries |
| XSS | `esc_html()`, `esc_attr()`, `sanitize_text_field()` |
| Authorization | `current_user_can('editor')` for admin actions |
| Direct Access | `if (!defined('ABSPATH')) exit;` |
| Privacy | Public view shows counts only (no names exposed) |

## Accessibility (WCAG 2.2 AA)

| Feature | Implementation |
|---------|----------------|
| Live regions | `role="status"` with `aria-live="polite"` for flash messages |
| Modal dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Focus management | Focus trap in lightbox, focus restoration on close |
| Keyboard navigation | Escape key closes modal, Tab cycles within modal |
| Screen reader text | `.sr-only` class for visually hidden labels |
| Touch targets | Minimum 40px height on interactive elements |
| Focus indicators | 2px outline with offset on focusable elements |

## File Dependencies

```
reservation-system.php
         │
         ├── assets/css/frontend.css (enqueued on pages with shortcode)
         ├── assets/css/admin.css (enqueued on admin page only)
         ├── assets/js/frontend.js (enqueued on pages with shortcode)
         │
         └── lib/vendor/autoload.php (loaded on-demand for Excel export)
                    │
                    └── phpoffice/phpspreadsheet
```

**Asset loading logic:**
- Frontend assets only load on pages containing `[reservation_table]` shortcode
- Admin assets only load on the `toplevel_page_rs-admin` hook
- Minified versions (`.min.css`, `.min.js`) used when `SCRIPT_DEBUG` is false

## Hook Registration Timeline

```
Plugin Load
    │
    ├── register_activation_hook ──► rs_activate_plugin (DB setup)
    │
    ├── add_action('wp_enqueue_scripts') ──► rs_enqueue_frontend_assets
    ├── add_action('admin_enqueue_scripts') ──► rs_enqueue_admin_styles
    │
    ├── add_action('admin_menu') ──► rs_admin_menu
    │
    ├── add_action('admin_init') ──► rs_update_time_range_settings
    ├── add_action('admin_init') ──► rs_update_capacity_handler
    ├── add_action('admin_init') ──► rs_delete_reservation_handler
    ├── add_action('admin_init') ──► rs_delete_all_reservations_in_time_handler
    ├── add_action('admin_init') ──► rs_delete_all_reservations_handler
    ├── add_action('admin_init') ──► rs_reset_plugin_handler
    ├── add_action('admin_init') ──► rs_update_plugin_settings
    │
    ├── add_action('template_redirect') ──► rs_handle_reservation_submission
    │
    ├── add_action('admin_post_update_time_range') ──► rs_update_slots_after_time_change
    └── add_action('admin_post_export_reservations_to_excel') ──► rs_export_reservations_to_excel
    │
    └── add_shortcode('reservation_table') ──► rs_reservation_table_shortcode
```
