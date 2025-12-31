# API Reference

## Shortcodes

### `[reservation_table]`

Renders the public reservation table and form.

**Usage:**
```
[reservation_table]
```

**Behavior:**
- Displays flash messages from session
- If reservations disabled: shows error message
- If enabled: renders time slot table with names, reservation form
- Form includes CSRF nonce protection

**Output:** HTML containing:
- Title "Rezervační Tabulka"
- Table with columns: Čas (Time), Rezervace (count/capacity), Jména (Names)
- Reservation form with name input and time slot dropdown

---

## Functions

### Configuration

#### `rs_get_config(): array`
Returns plugin configuration array.

```php
$config = rs_get_config();
// Returns: ['reservations_enabled' => 0|1]
```

#### `rs_get_time_settings(): array`
Returns time slot generation settings.

```php
$settings = rs_get_time_settings();
// Returns: ['start_time' => '09:00', 'end_time' => '16:30', 'interval' => 15]
```

### Data Access

#### `rs_load_data(): array`
Loads all reservations and slot capacities from database.

```php
$data = rs_load_data();
// Returns: [
//   '09:00' => ['reservations' => [['name' => 'Jan'], ...], 'capacity' => 6],
//   '09:15' => [...],
//   ...
// ]
```

#### `rs_generate_times(): array`
Generates array of time slot strings based on settings.

```php
$times = rs_generate_times();
// Returns: ['09:00', '09:15', '09:30', ...]
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

### Utility

#### `set_message(string $message, string $type): void`
Sets flash message in session and redirects.

```php
set_message('Rezervace byla úspěšně provedena!', 'rs-message-success');
set_message('Chyba při ukládání.', 'rs-error');
```

**CSS classes used:**
- `rs-message-success` - Success messages
- `rs-error` - Error messages
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
| `wp_enqueue_scripts` | `rs_enqueue_styles` | 10 | Load CSS on frontend |
| `admin_enqueue_scripts` | `rs_enqueue_styles` | 10 | Load CSS in admin |
| `admin_menu` | `rs_admin_menu` | 10 | Register admin menu |
| `admin_init` | `rs_update_time_range_settings` | 10 | Handle time settings |
| `admin_init` | `rs_update_plugin_settings` | 10 | Handle config settings |
| `template_redirect` | `rs_handle_reservation_submission` | 10 | Process reservations |
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
| Admin settings | `rs_update_settings_nonce` | `rs_update_settings_action` |
| Time range settings | `rs_update_time_range_nonce` | `rs_update_time_range_action` |
| Delete all reservations | `delete_all_reservations_nonce` | `delete_all_reservations_action` |

---

## WordPress Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rs_start_time` | string | `'09:00'` | First time slot |
| `rs_end_time` | string | `'16:30'` | Last time slot |
| `rs_time_interval` | int | `15` | Interval in minutes |
| `rs_config` | array | `['reservations_enabled' => 0]` | Plugin configuration |

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

### Public Frontend

| Class | Element |
|-------|---------|
| `.rs-container` | Main wrapper |
| `.rs-title` | Page title |
| `.rs-table` | Reservation table |
| `.rs-names-list` | Name list in table |
| `.rs-name` | Individual name |
| `.rs-no-reservations` | "No reservations" text |
| `.rs-form` | Reservation form |
| `.rs-input` | Text input |
| `.rs-select` | Time dropdown |
| `.rs-reserve-button` | Submit button |
| `.rs-error` | Error message |
| `.rs-message-success` | Success message |

### Admin

| Class | Element |
|-------|---------|
| `.rs-admin-container` | Admin page wrapper |
| `.rs-names-list-admin` | Admin name list |
| `.btn-delete` | Delete button |
| `.big-btn-delete` | Large delete button |
| `.rs-capacity-input` | Capacity number input |
| `.rs-capacity-button` | Update capacity button |
| `.rs-action-capacity` | Capacity form wrapper |
| `.rs-action-delete-all` | Delete all wrapper |
