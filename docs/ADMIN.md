# Admin Guide

## Accessing the Admin Panel

1. Log in to WordPress admin
2. Navigate to **Rezervace** in the left sidebar (calendar icon)

## Admin Page Sections

### 1. Nastavení (Settings)

Toggle reservation system on/off:

- **Zapnuto** (On) - Public users can make reservations
- **Vypnuto** (Off) - Shows closed notice to users

**Additional settings:**
- **Text oznámení při uzavření** - Customize the message shown when reservations are closed (default: "Rezervace jsou momentálně uzavřeny.")
- **Skrýt oznámení o uzavření na webu** - Check to hide the closed notice entirely on the frontend

**Shortcode hint:** The admin page displays the shortcode `[reservation_table]` for easy copying.

Click **Uložit změny** to save.

### 2. Výchozí nastavení (Default Settings)

Two reset actions available:

| Button | Effect |
|--------|--------|
| **Resetovat do výchozího nastavení** | Drops all tables, resets all options, recreates with defaults |
| **Smazat všechny rezervace** | Clears reservation table only, preserves settings and capacities |

Both require confirmation dialog.

### 3. Nastavení časového rozmezí (Time Range Settings)

Configure when reservations are available:

| Field | Format | Default | Description |
|-------|--------|---------|-------------|
| Počáteční čas | `HH:MM` | `09:00` | First available time slot |
| Koncový čas | `HH:MM` | `16:30` | Last available time slot |
| Interval | 1-60 | 15 | Minutes between slots |

**Example:** Start 09:00, End 10:00, Interval 15 generates:
- 09:00, 09:15, 09:30, 09:45, 10:00

Changing these settings automatically:
- Creates new slots with default capacity (6)
- Removes slots that fall outside new range
- Preserves existing reservations (even if slot removed)

### 4. Export Rezervací do Excelu

Export all reservations to Excel spreadsheet:

1. Select date using date picker (defaults to today)
2. Click **Exportovat do Excelu**
3. Browser downloads `rezervace.xlsx`

**Excel format:**
- Title: "Elektronická rezervace času na [date]"
- Columns: Čas (Time), Ev. č. (Registration #), Jméno dítěte (Child name), Poznámka (Note)
- Names grouped by time slot with merged time cells
- Page breaks after ~43 entries

### 5. Aktuální Rezervace (Current Reservations)

Table showing all reservations grouped by time slot:

| Column | Content |
|--------|---------|
| Čas | Time slot |
| Jména | List of names with individual delete buttons |
| Akce | Capacity editor + "Delete all for this time" button |

**Per-reservation actions:**
- **Smazat** (Delete) - Remove single reservation

**Per-slot actions:**
- Capacity input + **Upravit kapacitu** - Change slot capacity
- **Smazat všechny rezervace** - Delete all reservations in slot

## Capacity Management

Each time slot has independent capacity:

1. Find the time slot row
2. Enter new capacity number (minimum 1)
3. Click **Upravit kapacitu**

Capacity affects:
- Public form dropdown (full slots hidden)
- Display shows "X/Y" format (current/max)

## Shortcode Usage

Add to any page/post:

```
[reservation_table]
```

Displays:
- Reservation table with available time slots (when enabled)
- Lightbox modal form for making reservations (when enabled)
- Custom closed message (when disabled, unless hidden)

**Privacy:** The public view shows only available slot counts, not reservation names.

## Workflow: Setting Up New Enrollment Period

1. **Reset previous data**
   - Click "Smazat všechny rezervace" to clear old reservations
   - Or "Resetovat do výchozího nastavení" for complete reset

2. **Configure time range**
   - Set start/end times appropriate for enrollment day
   - Set interval (typically 15 minutes)
   - Save time settings

3. **Adjust capacities**
   - Set capacity per slot based on expected load
   - Consider lunch breaks (reduce capacity or remove slots)

4. **Enable reservations**
   - Set to "Zapnuto"
   - Save changes

5. **Verify public page**
   - Visit page with `[reservation_table]` shortcode
   - Confirm times display correctly

6. **After enrollment**
   - Export to Excel for records
   - Disable reservations
   - Data preserved until next reset

## Troubleshooting

### "Žádné rezervace k exportu"
No reservations exist. Make some reservations first.

### Names display incorrectly
Check character encoding. Plugin uses WordPress charset settings.

### Time slots not updating
After changing time settings, refresh admin page. Slot synchronization happens on settings save.

### Session messages not clearing
PHP sessions required. Check server configuration if flash messages persist.
