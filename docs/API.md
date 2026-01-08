# API Reference

## Shortcodes

### `[reservation_table]`

Renders the public reservation table with lightbox modal form.

**Usage:**
```
[reservation_table]
```

**Behavior:**
- Displays flash messages from session (with ARIA live region)
- Renders table skeleton with loading state
- Slot availability loaded dynamically via AJAX (avoids stale cached data)
- Fully booked slots are hidden from public view
- Form includes CSRF nonce protection

**Output:** HTML containing:
- Table with columns: Čas (Time), Volná místa (Available spots), Akce (Action button)
- Loading skeleton (`#rs-slots-body`) populated by JavaScript via AJAX
- Lightbox modal with name input field (WCAG 2.2 AA compliant)
- Screen reader accessible with focus trap and keyboard navigation

---

## Functions

### Configuration

#### `rs_get_config(): array`
Returns plugin configuration array with defaults.

```php
$config = rs_get_config();
// Returns: [
//   'reservations_enabled' => 0|1,
//   'closed_notice_text' => 'Rezervace jsou momentálně uzavřeny.',
//   'hide_closed_notice' => 0|1
// ]
```

#### `rs_get_time_settings(): array`
Returns time slot generation settings.

```php
$settings = rs_get_time_settings();
// Returns: ['start_time' => '09:00', 'end_time' => '16:30', 'interval' => 15]
```

### Data Access

#### `rs_load_data(): array`
Loads all reservations and slot capacities from database (admin use).

```php
$data = rs_load_data();
// Returns: [
//   '09:00' => ['reservations' => [['name' => 'Jan'], ...], 'capacity' => 6],
//   '09:15' => [...],
//   ...
// ]
```

#### `rs_load_public_data(): array`
Loads reservation counts and capacities only (no names - for privacy).

```php
$data = rs_load_public_data();
// Returns: [
//   '09:00' => ['count' => 3, 'capacity' => 6],
//   '09:15' => ['count' => 0, 'capacity' => 6],
//   ...
// ]
```

#### `rs_generate_times(): array`
Generates array of time slot strings based on settings.

```php
$times = rs_generate_times();
// Returns: ['09:00', '09:15', '09:30', ...]
```

#### `rs_format_available_spots(int $count): string`
Formats available spots with proper Czech grammar.

```php
rs_format_available_spots(1);  // Returns: '1 volné místo'
rs_format_available_spots(3);  // Returns: '3 volná místa'
rs_format_available_spots(5);  // Returns: '5 volných míst'
```

### AJAX Endpoints

#### `rs_ajax_get_availability(): void`
Returns current slot availability via AJAX. Used by frontend JavaScript to load fresh data on each page view, avoiding stale cached data.

**Hooked to:** `wp_ajax_rs_get_availability`, `wp_ajax_nopriv_rs_get_availability`

**Request:**
```javascript
fetch(rsConfig.ajaxUrl, {
    method: 'POST',
    body: new URLSearchParams({
        action: 'rs_get_availability',
        nonce: rsConfig.nonce  // rs_availability_nonce
    })
})
```

**Response (success):**
```json
{
    "success": true,
    "data": {
        "slots": [
            {"time": "09:00", "available": 4, "label": "4 volná místa"},
            {"time": "09:15", "available": 6, "label": "6 volných míst"}
        ]
    }
}
```

**Response (reservations disabled):**
```json
{
    "success": false,
    "data": {
        "message": "closed",
        "notice": "Rezervace jsou momentálně uzavřeny."
    }
}
```

### Lifecycle

#### `rs_activate_plugin(): void`
Plugin activation handler. Creates database tables, initializes slots.

**Triggered by:** `register_activation_hook`

#### `rs_reset_plugin(): void`
Drops tables, resets options, re-initializes plugin.

**Requires:** `manage_options` capability

### UI Rendering

#### `rs_reservation_table_shortcode(): string`
Shortcode handler for `[reservation_table]`.

**Returns:** HTML string (output buffered)

#### `rs_admin_page(): void`
Renders admin management page.

**Requires:** `manage_options` capability

#### `rs_admin_reset_button(): void`
Renders reset plugin button with confirmation.

### Form Handlers

#### `rs_handle_reservation_submission(): void`
Processes public reservation form submissions.

**Hooked to:** `template_redirect`

**Validates:**
- Nonce (`rs_reservation_nonce` / `rs_reservation_action`)
- Capacity not exceeded
- Name not already used

#### `rs_update_plugin_settings(): void`
Processes admin settings form (enable/disable reservations).

**Hooked to:** `admin_init`

**Validates:**
- Nonce (`rs_update_settings_nonce` / `rs_update_settings_action`)

#### `rs_update_time_range_settings(): void`
Processes time range configuration form.

**Hooked to:** `admin_init`

**Validates:**
- Nonce (`rs_update_time_range_nonce` / `rs_update_time_range_action`)

### Asset Enqueuing

#### `rs_enqueue_frontend_assets(): void`
Enqueues frontend CSS and JavaScript on pages with shortcode.

**Hooked to:** `wp_enqueue_scripts`

**Loads:**
- `assets/css/frontend.css` (or `.min.css`)
- `assets/js/frontend.js` (or `.min.js`)

#### `rs_enqueue_admin_styles(string $hook): void`
Enqueues admin CSS only on the plugin's admin page.

**Hooked to:** `admin_enqueue_scripts`

**Loads:**
- `assets/css/admin.css` (or `.min.css`) when `$hook === 'toplevel_page_rs-admin'`

### Utility

#### `rs_set_message(string $message, string $type, ?string $redirect_url = null): void`
Sets flash message in session and redirects.

```php
rs_set_message('Rezervace byla úspěšně provedena!', 'rs-message-success');
rs_set_message('Chyba při ukládání.', 'rs-error');
rs_set_message('Updated!', 'updated', admin_url('admin.php?page=rs-admin'));
```

**Parameters:**
- `$message` - The message text
- `$type` - CSS class for styling
- `$redirect_url` - Optional URL to redirect to (uses referer if null)

**CSS classes used:**
- `rs-message-success` - Success messages (frontend)
- `rs-error` - Error messages (frontend)
- `updated` - WordPress admin notices
- `error` - WordPress admin errors

#### `rs_export_reservations_to_excel(): void`
Generates and downloads Excel file with all reservations.

**Hooked to:** `admin_post_export_reservations_to_excel`

---

## WordPress Hooks Used

### Actions

| Hook | Callback | Priority | Description |
|------|----------|----------|-------------|
| `wp_enqueue_scripts` | `rs_enqueue_frontend_assets` | 10 | Load CSS/JS on frontend |
| `admin_enqueue_scripts` | `rs_enqueue_admin_styles` | 10 | Load CSS in admin |
| `admin_menu` | `rs_admin_menu` | 10 | Register admin menu |
| `admin_init` | `rs_update_time_range_settings` | 10 | Handle time settings |
| `admin_init` | `rs_update_capacity_handler` | 10 | Handle capacity updates |
| `admin_init` | `rs_delete_reservation_handler` | 10 | Delete single reservation |
| `admin_init` | `rs_delete_all_reservations_in_time_handler` | 10 | Delete all for time |
| `admin_init` | `rs_delete_all_reservations_handler` | 10 | Delete all reservations |
| `admin_init` | `rs_reset_plugin_handler` | 10 | Reset plugin to defaults |
| `admin_init` | `rs_update_plugin_settings` | 10 | Handle config settings |
| `template_redirect` | `rs_handle_reservation_submission` | 10 | Process reservations |
| `wp_ajax_rs_get_availability` | `rs_ajax_get_availability` | 10 | AJAX slot availability (logged in) |
| `wp_ajax_nopriv_rs_get_availability` | `rs_ajax_get_availability` | 10 | AJAX slot availability (public) |
| `admin_post_update_time_range` | `rs_update_slots_after_time_change` | 10 | Sync slots |
| `admin_post_export_reservations_to_excel` | `rs_export_reservations_to_excel` | 10 | Excel download |

### Activation Hook

```php
register_activation_hook(__FILE__, 'rs_activate_plugin');
```

---

## Nonce Actions

| Form | Nonce Field | Action |
|------|-------------|--------|
| Public reservation | `rs_reservation_nonce` | `rs_reservation_action` |
| AJAX availability | `nonce` (POST param) | `rs_availability_nonce` |
| Admin settings | `rs_update_settings_nonce` | `rs_update_settings_action` |
| Time range settings | `rs_update_time_range_nonce` | `rs_update_time_range_action` |
| Update capacity | `rs_update_capacity_nonce` | `rs_update_capacity_action` |
| Delete reservation | `rs_delete_reservation_nonce` | `rs_delete_reservation_action` |
| Delete all in time | `rs_delete_all_in_time_nonce` | `rs_delete_all_in_time_action` |
| Delete all reservations | `delete_all_reservations_nonce` | `delete_all_reservations_action` |
| Reset plugin | `rs_reset_plugin_nonce` | `rs_reset_plugin_action` |

---

## WordPress Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rs_start_time` | string | `'09:00'` | First time slot |
| `rs_end_time` | string | `'16:30'` | Last time slot |
| `rs_time_interval` | int | `15` | Interval in minutes |
| `rs_config` | array | See below | Plugin configuration |

**`rs_config` structure:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `reservations_enabled` | int | `0` | Enable/disable reservations (0/1) |
| `closed_notice_text` | string | `'Rezervace jsou momentálně uzavřeny.'` | Custom closed message |
| `hide_closed_notice` | int | `0` | Hide closed message on frontend (0/1) |

---

## Admin Menu

**Menu registration:**
```php
add_menu_page(
    'Rezervace',           // Page title
    'Rezervace',           // Menu title
    'manage_options',      // Capability
    'rs-admin',            // Menu slug
    'rs_admin_page',       // Callback
    'dashicons-calendar-alt' // Icon
);
```

**Access URL:** `/wp-admin/admin.php?page=rs-admin`

---

## CSS Classes

### Public Frontend (`assets/css/frontend.css`)

| Class | Element |
|-------|---------|
| `.rs-container` | Main wrapper |
| `.rs-table` | Reservation table |
| `.rs-input` | Text input |
| `.rs-select` | Dropdown (legacy, not used in lightbox) |
| `.rs-reserve-button` | Submit/reserve buttons |
| `.rs-label` | Form label container |
| `.rs-error` | Error message |
| `.rs-message-success` | Success message |
| `.rs-no-slots` | "All slots occupied" message |
| `.sr-only` | Screen reader only (accessibility) |

**Lightbox Modal:**

| Class | Element |
|-------|---------|
| `.rs-lightbox-overlay` | Modal overlay background |
| `.rs-lightbox` | Modal container |
| `.rs-lightbox-close` | Close button (X) |
| `.rs-lightbox-title` | Modal title |
| `.rs-lightbox-time` | Time display in title |
| `.rs-lightbox-form` | Form inside modal |
| `.rs-lightbox-time-input` | Hidden time input |
| `.rs-lightbox-buttons` | Button container |
| `.rs-lightbox-cancel` | Cancel button |
| `.rs-open-lightbox` | Trigger button (data-time attribute) |

### Admin (`assets/css/admin.css`)

| Class | Element |
|-------|---------|
| `.rs-admin-container` | Admin page wrapper |
| `.rs-names-list-admin` | Admin name list |
| `.rs-name` | Individual name item |
| `.btn-delete` | Delete button |
| `.big-btn-delete` | Large delete button |
| `.rs-capacity-input` | Capacity number input |
| `.rs-capacity-button` | Update capacity button |
| `.rs-action-capacity` | Capacity form wrapper |
| `.rs-action-delete-all` | Delete all wrapper |
| `.time-row` | Time column styling |
| `.rs-excel-label` | Excel export label |
| `.rs-date` | Date input |
| `.rs-date-div` | Date input container |
| `.buttons-gap` | Button spacing container |
