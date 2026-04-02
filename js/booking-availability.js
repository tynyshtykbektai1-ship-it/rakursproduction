document.addEventListener('DOMContentLoaded', () => {
    // Isolated booking availability widget: no dependencies on existing script.js logic.
    const widget = document.getElementById('booking-availability');
    if (!widget) {
        return;
    }

    const loadBtn = widget.querySelector('[data-booking-load]');
    const status = widget.querySelector('[data-booking-status]');
    const result = widget.querySelector('[data-booking-result]');

    const SPREADSHEET_ID = '1nGFoaMd-Jf0G_g5sJHZNsvO8y8zRxNqMZSz8mcc2ovA';
    const SHEETS = [
        { gid: '1520349911', month: 3, year: 2026 }, // April 2026
        { gid: '1404626119', month: 4, year: 2026 }  // May 2026
    ];

    const START_MINUTES = 9 * 60;   // 09:00
    const END_MINUTES = 22 * 60;    // 22:00
    const WHATSAPP_BASE = 'https://wa.me/77713434499';

    const toMinutes = (timeText) => {
        if (!timeText) {
            return null;
        }
        const clean = String(timeText).trim().replace('.', ':');
        const match = clean.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
            return null;
        }
        const h = Number(match[1]);
        const m = Number(match[2]);
        if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) {
            return null;
        }
        return h * 60 + m;
    };

    const toTime = (minutes) => {
        const h = String(Math.floor(minutes / 60)).padStart(2, '0');
        const m = String(minutes % 60).padStart(2, '0');
        return `${h}:${m}`;
    };

    const parseDate = (value) => {
        if (!value) {
            return null;
        }

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate());
        }

        const text = String(value).trim();

        // dd.mm.yyyy
        let match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
        if (match) {
            const day = Number(match[1]);
            const month = Number(match[2]) - 1;
            const year = Number(match[3]);
            return new Date(year, month, day);
        }

        // yyyy-mm-dd
        match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match) {
            const year = Number(match[1]);
            const month = Number(match[2]) - 1;
            const day = Number(match[3]);
            return new Date(year, month, day);
        }

        return null;
    };

    const toDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const prettyDate = (date) => {
        return new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long'
        }).format(date);
    };

    const normalizeHeader = (text) => {
        return String(text || '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    };

    const getFieldIndexes = (headers) => {
        let dateIndex = -1;
        let startIndex = -1;
        let endIndex = -1;

        headers.forEach((raw, index) => {
            const h = normalizeHeader(raw);
            if (dateIndex === -1 && /(дата|day|date|күн)/.test(h)) {
                dateIndex = index;
            }
            if (startIndex === -1 && /(нач|баст|start|from|с )/.test(h)) {
                startIndex = index;
            }
            if (endIndex === -1 && /(оконч|аяқ|end|to|до )/.test(h)) {
                endIndex = index;
            }
        });

        // Fallback by position if headers are unconventional.
        if (dateIndex === -1) {
            dateIndex = 0;
        }
        if (startIndex === -1) {
            startIndex = 1;
        }
        if (endIndex === -1) {
            endIndex = 2;
        }

        return { dateIndex, startIndex, endIndex };
    };

    const parseGvizPayload = (text) => {
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s);
        if (!match) {
            throw new Error('Unexpected Google response format');
        }
        const payload = JSON.parse(match[1]);
        const cols = payload.table.cols.map((c) => c.label || c.id || '');
        const rows = payload.table.rows.map((r) =>
            (r.c || []).map((cell) => {
                if (!cell) {
                    return '';
                }
                return typeof cell.f === 'string' && cell.f ? cell.f : cell.v;
            })
        );
        return { headers: cols, rows };
    };

    const fetchSheetRows = async (gid) => {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
        const response = await fetch(gvizUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        return parseGvizPayload(text);
    };

    const extractBusyRows = (sheetData) => {
        const { headers, rows } = sheetData;
        const { dateIndex, startIndex, endIndex } = getFieldIndexes(headers);

        return rows
            .map((row) => {
                const date = parseDate(row[dateIndex]);
                const start = toMinutes(row[startIndex]);
                const end = toMinutes(row[endIndex]);

                if (!date || start === null || end === null || end <= start) {
                    return null;
                }

                return {
                    dateKey: toDateKey(date),
                    start,
                    end
                };
            })
            .filter(Boolean);
    };

    const mergeIntervals = (intervals) => {
        if (!intervals.length) {
            return [];
        }

        const sorted = [...intervals].sort((a, b) => a.start - b.start);
        const merged = [sorted[0]];

        for (let i = 1; i < sorted.length; i += 1) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            if (current.start <= last.end) {
                last.end = Math.max(last.end, current.end);
            } else {
                merged.push({ ...current });
            }
        }

        return merged;
    };

    const getFreeIntervals = (busyIntervals) => {
        const free = [];
        let cursor = START_MINUTES;

        busyIntervals.forEach((interval) => {
            const start = Math.max(interval.start, START_MINUTES);
            const end = Math.min(interval.end, END_MINUTES);
            if (end <= START_MINUTES || start >= END_MINUTES) {
                return;
            }
            if (start > cursor) {
                free.push({ start: cursor, end: start });
            }
            cursor = Math.max(cursor, end);
        });

        if (cursor < END_MINUTES) {
            free.push({ start: cursor, end: END_MINUTES });
        }

        return free.filter((interval) => interval.end > interval.start);
    };

    const allDatesInMonth = (year, monthIndex) => {
        const dates = [];
        const cursor = new Date(year, monthIndex, 1);
        while (cursor.getMonth() === monthIndex) {
            dates.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
            cursor.setDate(cursor.getDate() + 1);
        }
        return dates;
    };

    const buildWhatsAppLink = (dateLabel, slotLabel) => {
        const text = `Здравствуйте! Хочу забронировать съемку на ${dateLabel} в ${slotLabel}.`;
        return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
    };

    const setStatus = (text) => {
        if (status) {
            status.textContent = text;
        }
    };

    const clearResult = () => {
        if (result) {
            result.innerHTML = '';
        }
    };

    const renderEmpty = (text) => {
        clearResult();
        const el = document.createElement('div');
        el.className = 'ba-empty';
        el.textContent = text;
        result.appendChild(el);
    };

    const renderCards = (days) => {
        clearResult();

        if (!days.length) {
            renderEmpty('Қолжетімді бос интервалдар табылмады.');
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'ba-grid';

        days.forEach((day) => {
            const card = document.createElement('article');
            card.className = 'ba-day-card';

            const title = document.createElement('h4');
            title.className = 'ba-date';
            title.textContent = day.label;

            const slots = document.createElement('div');
            slots.className = 'ba-slots';

            day.free.forEach((interval) => {
                const slotLabel = `${toTime(interval.start)}-${toTime(interval.end)}`;
                const slot = document.createElement('a');
                slot.className = 'ba-slot';
                slot.href = buildWhatsAppLink(day.label, slotLabel);
                slot.target = '_blank';
                slot.rel = 'noopener noreferrer';
                slot.textContent = slotLabel;
                slot.title = 'WhatsApp арқылы брондау';
                slots.appendChild(slot);
            });

            card.append(title, slots);
            grid.appendChild(card);
        });

        result.appendChild(grid);
    };

    const loadAvailability = async () => {
        loadBtn.disabled = true;
        loadBtn.querySelector('[data-spinner]').hidden = false;
        setStatus('Кесте жүктеліп жатыр...');
        clearResult();

        try {
            const sheetPayloads = await Promise.all(SHEETS.map((sheet) => fetchSheetRows(sheet.gid)));
            const busyRows = sheetPayloads.flatMap((payload) => extractBusyRows(payload));

            const busyByDate = new Map();
            busyRows.forEach((row) => {
                const list = busyByDate.get(row.dateKey) || [];
                list.push({ start: row.start, end: row.end });
                busyByDate.set(row.dateKey, list);
            });

            const targetDates = SHEETS.flatMap((sheet) => allDatesInMonth(sheet.year, sheet.month));
            const availableDays = [];

            targetDates.forEach((date) => {
                const dateKey = toDateKey(date);
                const busyIntervals = mergeIntervals(busyByDate.get(dateKey) || []);
                const freeIntervals = getFreeIntervals(busyIntervals);

                // If fully busy, skip. If no records, it will be full-day free interval.
                if (!freeIntervals.length) {
                    return;
                }

                availableDays.push({
                    date,
                    label: prettyDate(date),
                    free: freeIntervals
                });
            });

            availableDays.sort((a, b) => a.date - b.date);
            renderCards(availableDays);
            setStatus(`Қолжетімді күндер: ${availableDays.length}`);
        } catch (error) {
            console.error(error);
            renderEmpty('Кестені жүктеу мүмкін болмады. Сәл кейінірек қайталап көріңіз.');
            setStatus('Қате орын алды');
        } finally {
            loadBtn.disabled = false;
            loadBtn.querySelector('[data-spinner]').hidden = true;
        }
    };

    loadBtn.addEventListener('click', loadAvailability);
});
