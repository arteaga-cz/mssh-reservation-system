# Database Schema

## Tables

The plugin creates two custom tables on activation via `rs_activate_plugin()`.

### `{prefix}_reservations`

Stores individual reservations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `MEDIUMINT(9)` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique reservation ID |
| `name` | `VARCHAR(255)` | `NOT NULL` | Reservee name (unique per system) |
| `time` | `VARCHAR(5)` | `NOT NULL` | Time slot in `HH:MM` format |

**Notes:**
- No foreign key to slots table (loose coupling)
- Name uniqueness enforced at application level, not DB level
- Time format matches generated slots exactly

### `{prefix}_reservation_slots`

Stores capacity configuration per time slot.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `MEDIUMINT(9)` | `PRIMARY KEY`, `AUTO_INCREMENT` | Slot ID |
| `time` | `VARCHAR(5)` | `NOT NULL`, `UNIQUE` | Time slot in `HH:MM` format |
| `capacity` | `INT` | `NOT NULL`, `DEFAULT 6` | Maximum reservations allowed |

**Notes:**
- Slots auto-generated based on time settings
- UNIQUE constraint on `time` prevents duplicates
- Default capacity is 6

## Entity Relationship

```
┌─────────────────────┐         ┌─────────────────────────┐
│    reservations     │         │    reservation_slots    │
├─────────────────────┤         ├─────────────────────────┤
│ id (PK)             │         │ id (PK)                 │
│ name                │◄───────►│ time (UNIQUE)           │
│ time ───────────────┼─────────│ capacity                │
└─────────────────────┘         └─────────────────────────┘
        (logical relationship via time column, no FK)
```

## Table Creation SQL

```sql
-- Reservations table
CREATE TABLE {prefix}_reservations (
    id mediumint(9) NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    time varchar(5) NOT NULL,
    PRIMARY KEY (id)
) {charset_collate};

-- Slots table
CREATE TABLE {prefix}_reservation_slots (
    id mediumint(9) NOT NULL AUTO_INCREMENT,
    time varchar(5) NOT NULL,
    capacity int NOT NULL DEFAULT 6,
    PRIMARY KEY (id),
    UNIQUE KEY time (time)
) {charset_collate};
```

## Common Queries

### Load all reservations with capacities

```php
// Used by rs_load_data()
$results = $wpdb->get_results(
    "SELECT name, time FROM {$wpdb->prefix}reservations",
    ARRAY_A
);

$slots = $wpdb->get_results(
    "SELECT time, capacity FROM {$wpdb->prefix}reservation_slots",
    ARRAY_A
);
```

### Check reservation count for time slot

```php
$existing_count = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}reservations WHERE time = %s",
    $time
));
```

### Check if name already exists

```php
$exists = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}reservations WHERE name = %s",
    $name
));
```

### Insert new reservation

```php
$wpdb->insert(
    "{$wpdb->prefix}reservations",
    ['name' => $name, 'time' => $time],
    ['%s', '%s']
);
```

### Update slot capacity

```php
$wpdb->update(
    "{$wpdb->prefix}reservation_slots",
    ['capacity' => $capacity],
    ['time' => $time],
    ['%d'],
    ['%s']
);
```

### Delete reservation by name

```php
$reservation_id = $wpdb->get_var($wpdb->prepare(
    "SELECT id FROM {$wpdb->prefix}reservations WHERE name = %s LIMIT 1",
    $name
));
$wpdb->delete("{$wpdb->prefix}reservations", ['id' => $reservation_id], ['%d']);
```

### Delete all reservations for time slot

```php
$wpdb->delete("{$wpdb->prefix}reservations", ['time' => $time], ['%s']);
```

### Excel export query (with JOIN)

```php
$reservations = $wpdb->get_results("
    SELECT r.name, r.time, c.capacity
    FROM {$wpdb->prefix}reservations r
    JOIN {$wpdb->prefix}reservation_slots c ON r.time = c.time
    ORDER BY r.time ASC, r.name ASC
", ARRAY_A);
```

## Slot Synchronization

When time settings change, `rs_activate_plugin()` synchronizes slots:

1. Generate new time array from settings
2. Insert missing slots with default capacity
3. Remove slots that no longer exist in time range

```php
// Add missing slots
foreach ($times as $time) {
    $existing = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $capacity_table WHERE time = %s", $time
    ));
    if ($existing == 0) {
        $wpdb->insert($capacity_table, ['time' => $time, 'capacity' => 6], ['%s', '%d']);
    }
}

// Remove obsolete slots
$all_times_in_db = $wpdb->get_results("SELECT time FROM $capacity_table", ARRAY_A);
$times_to_remove = array_diff(array_column($all_times_in_db, 'time'), $times);
foreach ($times_to_remove as $time) {
    $wpdb->delete($capacity_table, ['time' => $time], ['%s']);
}
```

## Reset Behavior

`rs_reset_plugin()` performs:

1. `DROP TABLE IF EXISTS {prefix}_reservations`
2. `DROP TABLE IF EXISTS {prefix}_reservation_slots`
3. Reset options to defaults
4. Re-run `rs_activate_plugin()` to recreate tables
5. `delete_option('rs_config')`
