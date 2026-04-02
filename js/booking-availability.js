document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('booking-availability');
    if (!widget) {
        return;
    }

    const loadButton = widget.querySelector('[data-booking-load]');
    const statusNode = widget.querySelector('[data-booking-status]');
    const resultNode = widget.querySelector('[data-booking-result]');
    const spinnerNode = loadButton ? loadButton.querySelector('[data-spinner]') : null;

    if (!loadButton || !statusNode || !resultNode || !spinnerNode) {
        return;
    }

    const GOOGLE_SHEET_ID = '1nGFoaMd-Jf0G_g5sJHZNsvO8y8zRxNqMZSz8mcc2ovA';
    const SHEETS = [
        { gid: '1520349911', year: 2026, month: 3 },
        { gid: '1404626119', year: 2026, month: 4 }
    ];

    const WORK_START = 9 * 60;
    const WORK_END = 22 * 60;
    const WHATSAPP_URL = 'https://wa.me/77713434499';

    const DATE_KEYS = ['дата', 'date', 'күн'];
    const START_KEYS = ['начало', 'басталу', 'басталуы', 'start'];
    const END_KEYS = ['конец', 'аяқталуы', 'аяқталу', 'end'];

    const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const minutesToTime = (minutes) => {
        const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mins = String(minutes % 60).padStart(2, '0');
        return `${hours}:${mins}`;
    };

    const parseTimeToMinutes = (rawValue) => {
        const clean = String(rawValue || '').trim().replace('.', ':');
        const match = clean.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
            return null;
        }

        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }

        return hours * 60 + minutes;
    };

    const formatDateKey = (year, month, day) => {
        const yyyy = String(year).padStart(4, '0');
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const parseDdMmYyyy = (rawValue) => {
        const value = String(rawValue || '').trim();
        const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!match) {
            return null;
        }

        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        if (
            Number.isNaN(day) ||
            Number.isNaN(month) ||
            Number.isNaN(year) ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return null;
        }

        const testDate = new Date(year, month - 1, day);
        if (
            testDate.getFullYear() !== year ||
            testDate.getMonth() !== month - 1 ||
            testDate.getDate() !== day
        ) {
            return null;
        }

        return {
            year,
            month,
            day,
            key: formatDateKey(year, month, day)
        };
    };

    const keyToDate = (dateKey) => {
        const [yearText, monthText, dayText] = dateKey.split('-');
        return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
    };

    const getTodayStart = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    };

    const humanDate = (dateKey) => {
        const date = keyToDate(dateKey);
        return new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    const buildMonthDateKeys = (year, monthIndex) => {
        const cursor = new Date(year, monthIndex, 1);
        const keys = [];

        while (cursor.getMonth() === monthIndex) {
            keys.push(formatDateKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
            cursor.setDate(cursor.getDate() + 1);
        }

        return keys;
    };

    const setStatus = (text) => {
        statusNode.textContent = text;
    };

    const clearResult = () => {
        resultNode.innerHTML = '';
    };

    const renderEmpty = (message) => {
        clearResult();
        const empty = document.createElement('div');
        empty.className = 'ba-empty';
        empty.textContent = message;
        resultNode.appendChild(empty);
    };

    const parseGvizResponse = (rawText) => {
        const match = rawText.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s);
        if (!match) {
            throw new Error('Invalid gviz response');
        }

        const parsed = JSON.parse(match[1]);
        const table = parsed.table || {};
        const headers = (table.cols || []).map((col) => col.label || col.id || '');
        const rows = (table.rows || []).map((row) => (row.c || []).map((cell) => {
            if (!cell) {
                return '';
            }
            return cell.f !== undefined && cell.f !== null && cell.f !== '' ? cell.f : cell.v;
        }));

        return { headers, rows };
    };

    const findColumnIndex = (headers, candidates) => {
        const normalized = headers.map(normalizeText);
        return normalized.findIndex((header) => candidates.some((key) => header === key));
    };

    const resolveColumns = (headers) => {
        let dateIndex = findColumnIndex(headers, DATE_KEYS);
        let startIndex = findColumnIndex(headers, START_KEYS);
        let endIndex = findColumnIndex(headers, END_KEYS);

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

    const loadSheet = async (gid) => {
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Sheet load failed: ${response.status}`);
        }
        const text = await response.text();
        return parseGvizResponse(text);
    };

    const extractBusyIntervals = (sheetData) => {
        const { headers, rows } = sheetData;
        const { dateIndex, startIndex, endIndex } = resolveColumns(headers);

        return rows.reduce((acc, row) => {
            const rawDate = row[dateIndex];
            const rawStart = row[startIndex];
            const rawEnd = row[endIndex];

            if (!rawDate || !rawStart || !rawEnd) {
                return acc;
            }

            const dateInfo = parseDdMmYyyy(rawDate);
            const start = parseTimeToMinutes(rawStart);
            const end = parseTimeToMinutes(rawEnd);

            if (!dateInfo || start === null || end === null || end <= start) {
                return acc;
            }

            acc.push({
                dateKey: dateInfo.key,
                start,
                end
            });

            return acc;
        }, []);
    };

    const mergeBusyIntervals = (intervals) => {
        if (!intervals.length) {
            return [];
        }

        const sorted = [...intervals].sort((a, b) => a.start - b.start);
        const merged = [{ ...sorted[0] }];

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

    const calculateFreeIntervals = (mergedBusy) => {
        const free = [];
        let cursor = WORK_START;

        mergedBusy.forEach((interval) => {
            const busyStart = Math.max(interval.start, WORK_START);
            const busyEnd = Math.min(interval.end, WORK_END);

            if (busyEnd <= WORK_START || busyStart >= WORK_END) {
                return;
            }

            if (busyStart > cursor) {
                free.push({ start: cursor, end: busyStart });
            }

            cursor = Math.max(cursor, busyEnd);
        });

        if (cursor < WORK_END) {
            free.push({ start: cursor, end: WORK_END });
        }

        return free.filter((interval) => interval.end > interval.start);
    };

    const buildWhatsappLink = (dateLabel, slotLabel) => {
        const text = `Сәлеметсіз бе! ${dateLabel} күні ${slotLabel} уақытында түсірілімге бронь жасағым келеді.`;
        return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
    };

    const renderAvailability = (days) => {
        clearResult();

        if (!days.length) {
            renderEmpty('Бос интервалдар табылмады.');
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'ba-grid';

        days.forEach((day) => {
            const card = document.createElement('article');
            card.className = 'ba-day-card';

            const dateTitle = document.createElement('h4');
            dateTitle.className = 'ba-date';
            dateTitle.textContent = day.label;

            const slots = document.createElement('div');
            slots.className = 'ba-slots';

            day.free.forEach((interval) => {
                const slotLabel = `${minutesToTime(interval.start)}-${minutesToTime(interval.end)}`;
                const slot = document.createElement('a');
                slot.className = 'ba-slot';
                slot.href = buildWhatsappLink(day.label, slotLabel);
                slot.target = '_blank';
                slot.rel = 'noopener noreferrer';
                slot.textContent = slotLabel;
                slot.title = 'WhatsApp арқылы брондау';
                slots.appendChild(slot);
            });

            card.append(dateTitle, slots);
            grid.appendChild(card);
        });

        resultNode.appendChild(grid);
    };

    const loadAvailability = async () => {
        loadButton.disabled = true;
        spinnerNode.hidden = false;
        setStatus('Деректер жүктеліп жатыр...');
        clearResult();

        try {
            const sheetsData = await Promise.all(SHEETS.map((sheet) => loadSheet(sheet.gid)));
            const busyRows = sheetsData.flatMap((sheetData) => extractBusyIntervals(sheetData));

            const busyByDate = new Map();
            busyRows.forEach((row) => {
                const list = busyByDate.get(row.dateKey) || [];
                list.push({ start: row.start, end: row.end });
                busyByDate.set(row.dateKey, list);
            });

            const calendarDateKeys = SHEETS.flatMap((sheet) => buildMonthDateKeys(sheet.year, sheet.month));
            const uniqueDateKeys = [...new Set(calendarDateKeys)];
            const todayStart = getTodayStart();

            const availableDays = uniqueDateKeys.reduce((acc, dateKey) => {
                const currentDate = keyToDate(dateKey);
                if (currentDate < todayStart) {
                    return acc;
                }

                const busyIntervals = mergeBusyIntervals(busyByDate.get(dateKey) || []);
                const freeIntervals = calculateFreeIntervals(busyIntervals);

                if (!freeIntervals.length) {
                    return acc;
                }

                acc.push({
                    dateKey,
                    label: humanDate(dateKey),
                    free: freeIntervals
                });
                return acc;
            }, []);

            renderAvailability(availableDays);
            setStatus(`Қолжетімді күндер: ${availableDays.length}`);
        } catch (error) {
            console.error(error);
            renderEmpty('Кестені жүктеу мүмкін болмады. Кейінірек қайталап көріңіз.');
            setStatus('Жүктеу қатесі');
        } finally {
            spinnerNode.hidden = true;
            loadButton.disabled = false;
        }
    };

    loadButton.addEventListener('click', loadAvailability);
});
