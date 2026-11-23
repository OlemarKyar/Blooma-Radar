"use strict";

const I18N = {
  uk: {
    title: "Blooma: Пожежний радар",
    tab_fire: "Пожежний радар",
    tab_heat: "Кола спеки",
    mode_demo: "Демо-сценарій",
    mode_live: "Живий прогноз",
    loading: "Завантаження…",
    today: "сьогодні",
    forecast: "прогноз",
    past: "минуле",
    weekdays: ["нд", "пн", "вт", "ср", "чт", "пт", "сб"],
    months: ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"],

    note_demo_fire: "Демо-сценарій: синтетична липнева хвиля спеки для 23 міст (не реальні виміри).",
    note_live_fire: "Живий прогноз Open-Meteo для 23 міст: 30 днів назад і 7 днів уперед.",
    note_firms_count: "NASA FIRMS: {n} точок активних пожеж за 2 доби. На сході й півдні багато з них — наслідки обстрілів.",
    note_firms_error: "NASA FIRMS недоступний: {detail}",
    note_firms_nokey: "Активні пожежі з супутника показуються, якщо задати ключ FIRMS_MAP_KEY (див. README).",
    note_demo_heat: "Демо-сценарій: синтетична хвиля спеки, вигадані мешканці.",
    note_live_heat: "Живий прогноз Open-Meteo. Мешканці — вигадані (демо-район).",
    note_overpass_down: "Карта прохолодних місць (Overpass API) недоступна — показано демо-місця.",
    note_live_season: "Поза спекотним сезоном небезпека зазвичай низька. Щоб побачити, як працює система, перемкніться на демо-сценарій.",

    err_network: "Немає зв'язку з сервісом погоди. Перевірте інтернет або залиштеся в демо-режимі.",
    err_bad_request: "Некоректний запит.",
    err_generic: "Помилка сервера.",

    fire_1: "немає", fire_2: "мала", fire_3: "середня", fire_4: "висока", fire_5: "надзвичайна",
    fire_advice_1: "Дотримуйтеся звичайних правил поводження з вогнем.",
    fire_advice_2: "Не залишайте багаття без нагляду.",
    fire_advice_3: "Не розпалюйте вогнища в лісі й біля сухої трави.",
    fire_advice_4: "Не паліть суху траву, листя й сміття, не розводьте вогнищ і не кидайте недопалки.",
    fire_advice_5: "Жодного відкритого вогню на природі, зокрема мангалів. Не заходьте до лісу з вогнем. Помітили дим — телефонуйте 101.",

    f_days: "Пожежна небезпека на тиждень",
    f_days_hint: "Кількість міст із класом IV і V",
    f_map: "Карта",
    f_map_hint: "Клас з поправкою на вітер",
    f_legend_wind: "вітер підвищив клас",
    f_legend_hotspot: "активна пожежа з супутника",
    f_extreme: "міст із надзвичайною небезпекою (V)",
    f_high: "міст із високою небезпекою (IV)",
    f_rank: "Найвищий ризик на {date}",
    f_col_city: "Місто", f_col_class: "Клас", f_col_index: "Показник", f_col_wind: "Вітер",
    f_city: "{city} · показник Нестерова",
    f_city_hint: "Зростає в дні без дощу, обнуляється після {mm} мм опадів",
    f_axis: "показник Нестерова",
    f_rain: "дощ обнулив показник",
    f_tbl_date: "Дата", f_tbl_tmax: "Tmax", f_tbl_wind: "Вітер", f_tbl_rain: "Опади",
    f_tbl_index: "Показник", f_tbl_class: "Клас", f_tbl_spread: "З вітром",
    f_what: "Рекомендації",
    f_why_wind: "Вітер {w} м/с (поріг {lim}) — вогонь поширюватиметься швидше, тому клас підвищено з {a} до {b}.",
    f_circles: "Попередження для Кіл",
    f_circles_hint: "Повідомлення, яке Blooma надсилає учасникам Кіл міста",
    f_msg: "Пожежна небезпека {roman} ({label}) у місті {city}: {dates}.\n\nНе паліть суху траву й сміття, не розводьте вогнищ і не кидайте недопалки. Помітили дим або вогонь — телефонуйте 101.\n\nКоло «{city}» шукає 4–6 волонтерів, щоб найближчої суботи прибрати суху траву біля будинків і шкіл.",
    f_msg_none: "Наступного тижня у місті {city} висока пожежна небезпека не очікується.",
    copy: "Скопіювати текст",
    copied: "Скопійовано",
    ms: "м/с", mm: "мм",

    h_city: "Місто",
    h_force: "План для рівня",
    h_force_auto: "як у прогнозі",
    h_force_2: "2 — небезпечно",
    h_force_3: "3 — дуже небезпечно",
    h_days: "Прогноз спеки",
    h_days_hint: "Оберіть день, щоб побудувати план",
    h_map: "Район",
    h_map_hint: "{city} · {n} мешканців, {b} будинків",
    lg_high: "високий ризик", lg_medium: "середній ризик", lg_vol: "волонтер", lg_other: "інші мешканці",
    lg_place: "прохолодне місце", lg_link: "хто кого перевіряє",
    heat_0: "Норма", heat_1: "Увага", heat_2: "Небезпечно", heat_3: "Дуже небезпечно",
    heat_text_0: "Звичайний день. Кола турботи не потрібні.",
    heat_text_1: "Спекотно. Нагадати пити воду; Кола ще не вмикаються.",
    heat_text_2: "Небезпечна спека. Кола турботи увімкнено: перевірки двічі на день.",
    heat_text_3: "Дуже небезпечна спека. Перевірки тричі на день, усім вразливим — по 2 волонтери.",
    heat_day: "{date} · спека",
    heat_level: "Рівень {n}: {label}",
    heat_forced: "План побудовано для рівня {n} (обрано вручну).",
    r_hot: "Tmax {value}° ≥ {limit}°", r_very_hot: "Tmax {value}° ≥ {limit}°",
    r_tropical_night: "тропічна ніч (Tmin {value}°)", r_wave: "хвиля спеки 3+ дні",
    fire_card: "Пожежна небезпека (показник Нестерова)",
    fire_card_text: "Показник {n}. Деталі — на вкладці «Пожежний радар».",
    k_vulnerable: "вразливих людей у районі (з них {n} — високий ризик)",
    k_covered: "мають хоча б одного волонтера",
    k_volunteers: "волонтерів-сусідів залучено",
    k_uncovered: "без волонтера поруч → волонтерський штаб / соцслужба",
    k_all_covered: "усі вразливі мають волонтера",
    k_off_title: "Кола вимкнені",
    k_off: "Рівень спеки нижче 2. Щоб побачити план, оберіть день з рівнем 2–3 або «План для рівня» вгорі.",
    h_groups: "Кола турботи",
    h_groups_hint: "Волонтера обирають за спільним Колом і відстанню",
    h_groups_off: "Кола турботи вмикаються з рівня спеки 2.",
    g_circle: "Коло: {b}",
    g_counts: "{v} вразл. · {h} волонт.",
    g_checkers: "Перевіряють:",
    g_need_more: "потрібен ще {n}",
    g_none: "Немає волонтера ближче ніж 1 км → передати волонтерському штабу / соцслужбі громади",
    g_cool: "Прохолодне місце: {name} — {dist}, ~{min} хв пішки",
    risk_high: "високий ризик", risk_medium: "середній ризик", risk_low: "низький ризик",
    fac_not_leaving_home: "не виходить з дому щодня", fac_bedridden: "прикутий(а) до ліжка",
    fac_top_floor: "верхній поверх", fac_cannot_self_care: "не може себе обслуговувати",
    fac_lives_alone: "живе сам(а)", fac_no_ac: "немає кондиціонера",
    depth_4: "той самий під'їзд", depth_3: "той самий будинок", depth_2: "той самий район", depth_1: "те саме місто",
    building: "Будинок {b}", entrance: "Під'їзд {e}", district_demo: "Демо-район",
    floor: "пов. {f}/{n}", age: "{a} р.",
    place_library: "Бібліотека", place_mall: "ТРЦ з кондиціонерами", place_community_centre: "Громадський центр",
    place_clinic: "Поліклініка", place_park: "Сквер біля фонтану", place_cinema: "Кінотеатр", demo_suffix: " (демо)",
    place_tip: "Прохолодне місце",
    tip_risk: "Ризик: {label} (бал {score})",
    tip_volunteer: "Волонтер", tip_blooma: " · користувач Blooma", tip_checks: "Перевіряє: {names}",
    h_checks: "Перевірки",
    h_reset: "Скинути перевірки",
    h_checks_off: "Перевірки з'являються, коли увімкнені Кола турботи.",
    c_summary: "усе добре: {ok} · потрібна допомога: {help} · у запасного: {backup} · ескалація: {escalated} · очікують: {pending}",
    c_person: "Людина", c_buddy: "Хто перевіряє зараз", c_status: "Статус", c_result: "Результат перевірки",
    c_ok: "Усе добре", c_help: "Погано", c_no: "Не відповідає",
    st_pending: "очікує", st_ok: "усе добре", st_help: "потрібна допомога", st_backup: "передано запасному", st_escalated: "ескалація: 103 / 112",
    adv_help: "Перевести в прохолодне місце, дати воду маленькими ковтками, охолодити мокрим рушником. Сплутаність свідомості, температура тіла понад 39°, непритомність — одразу 103.",
    adv_escalated: "Ніхто не достукався. Подзвонити родичам або керуючій компанії, за потреби — 103 або 112 (можуть відчинити двері).",
    h_sim: "Як швидко помітять, що людині погано",
    sim_all: "Усі вразливі", sim_alone: "Ті, хто живе сам",
    sim_off: "Симуляція з'являється, коли увімкнені Кола турботи (рівень 2–3).",
    sim_with: "з Колами турботи", sim_without: "без системи",
    sim_with_short: "з Колами", sim_without_short: "без системи",
    sim_y: "% випадків, коли людину вже знайшли",
    sim_x: "годин після того, як людині стало погано",
    sim_h: "{h} год",
    sim_tip: "За {h} год людину знайшли:<br>з Колами — <b>{a}%</b><br>без системи — <b>{b}%</b>",
    sim_who_all: "{n} вразливих людей, {e} розіграних випадків",
    sim_who_alone: "{n} людей, які живуть самі, {e} розіграних випадків",
    sim_6: "Знайшли протягом 6 год", sim_12: "Знайшли протягом 12 год", sim_med: "Медіанний час, поки хтось помітить",
    sim_assume: "Це модель із припущеннями, а не реальні дані. Звичайний контакт із людиною — у середньому раз на {a} год (живе не сама), {b} год (живе сама, виходить з дому), {c} год (живе сама і не виходить). Волонтер виконує перевірку з імовірністю {p}%, якщо ні — запасний пробує через {d} год. Перевірки о {slots}. Параметри — у blooma/simulate.py.",

    foot_data: "Дані: Open-Meteo, © OpenStreetMap contributors, NASA FIRMS. Методи: показник Нестерова; чинники ризику спеки — Semenza et al., NEJM 1996.",
    map_help: "Коліщатко або +/− — масштаб, перетягування — рух карти",
    unit_m: "м", unit_km: "км", unit_h: "год", feels: "відчув.", fire_short: "Пожежна",
  },

  en: {
    title: "Blooma: Wildfire Radar",
    tab_fire: "Wildfire radar",
    tab_heat: "Heat Circles",
    mode_demo: "Demo scenario",
    mode_live: "Live forecast",
    loading: "Loading…",
    today: "today",
    forecast: "forecast",
    past: "past",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

    note_demo_fire: "Demo scenario: a synthetic July heatwave for 23 cities (not real measurements).",
    note_live_fire: "Live Open-Meteo forecast for 23 cities: 30 days back and 7 days ahead.",
    note_firms_count: "NASA FIRMS: {n} active fire detections in the last 2 days. In the east and south many are caused by shelling.",
    note_firms_error: "NASA FIRMS is unavailable: {detail}",
    note_firms_nokey: "Satellite fire detections appear if you set the FIRMS_MAP_KEY key (see README).",
    note_demo_heat: "Demo scenario: a synthetic heatwave and fictional residents.",
    note_live_heat: "Live Open-Meteo forecast. Residents are fictional (demo district).",
    note_overpass_down: "Cool places map (Overpass API) is unavailable — showing demo places.",
    note_live_season: "Outside the hot season the danger is usually low. Switch to the demo scenario to see how the system works.",

    err_network: "Can't reach the weather service. Check your connection or stay in demo mode.",
    err_bad_request: "Invalid request.",
    err_generic: "Server error.",

    fire_1: "none", fire_2: "low", fire_3: "moderate", fire_4: "high", fire_5: "extreme",
    fire_advice_1: "Follow the usual fire safety rules.",
    fire_advice_2: "Never leave a campfire unattended.",
    fire_advice_3: "No campfires in forests or near dry grass.",
    fire_advice_4: "Don't burn dry grass, leaves or rubbish, light campfires or throw away cigarette butts.",
    fire_advice_5: "No open fire outdoors, including barbecues. Don't take any fire into forests. If you see smoke, call 101.",

    f_days: "Fire danger this week",
    f_days_hint: "Cities at class IV and V",
    f_map: "Map",
    f_map_hint: "Wind-adjusted class",
    f_legend_wind: "wind raised the class",
    f_legend_hotspot: "satellite fire detection",
    f_extreme: "cities at extreme danger (V)",
    f_high: "cities at high danger (IV)",
    f_rank: "Highest risk on {date}",
    f_col_city: "City", f_col_class: "Class", f_col_index: "Index", f_col_wind: "Wind",
    f_city: "{city} · Nesterov index",
    f_city_hint: "Grows on dry days, resets after {mm} mm of rain",
    f_axis: "Nesterov index",
    f_rain: "rain reset the index",
    f_tbl_date: "Date", f_tbl_tmax: "Tmax", f_tbl_wind: "Wind", f_tbl_rain: "Rain",
    f_tbl_index: "Index", f_tbl_class: "Class", f_tbl_spread: "With wind",
    f_what: "Recommendations",
    f_why_wind: "Wind {w} m/s (threshold {lim}) — fire will spread faster, so the class is raised from {a} to {b}.",
    f_circles: "Alert for Circles",
    f_circles_hint: "The message Blooma sends to members of the city's Circles",
    f_msg: "Wildfire danger {roman} ({label}) in {city}: {dates}.\n\nDon't burn dry grass or rubbish, light campfires or throw away cigarette butts. If you see smoke or fire, call 101.\n\nThe {city} Circle is looking for 4–6 volunteers to clear dry grass near homes and schools this Saturday.",
    f_msg_none: "No high wildfire danger is expected in {city} next week.",
    copy: "Copy text",
    copied: "Copied",
    ms: "m/s", mm: "mm",

    h_city: "City",
    h_force: "Plan for level",
    h_force_auto: "as forecast",
    h_force_2: "2 — dangerous",
    h_force_3: "3 — very dangerous",
    h_days: "Heat forecast",
    h_days_hint: "Pick a day to build the plan",
    h_map: "District",
    h_map_hint: "{city} · {n} residents, {b} buildings",
    lg_high: "high risk", lg_medium: "medium risk", lg_vol: "volunteer", lg_other: "other residents",
    lg_place: "cool place", lg_link: "who checks on whom",
    heat_0: "Normal", heat_1: "Caution", heat_2: "Dangerous", heat_3: "Very dangerous",
    heat_text_0: "A normal day. No Care Circles needed.",
    heat_text_1: "Hot. Remind people to drink water; Circles are not active yet.",
    heat_text_2: "Dangerous heat. Care Circles are on: checks twice a day.",
    heat_text_3: "Very dangerous heat. Checks three times a day, two volunteers for every vulnerable person.",
    heat_day: "{date} · heat",
    heat_level: "Level {n}: {label}",
    heat_forced: "The plan is built for level {n} (chosen manually).",
    r_hot: "Tmax {value}° ≥ {limit}°", r_very_hot: "Tmax {value}° ≥ {limit}°",
    r_tropical_night: "tropical night (Tmin {value}°)", r_wave: "heatwave, 3+ days",
    fire_card: "Wildfire danger (Nesterov index)",
    fire_card_text: "Index {n}. More on the “Wildfire radar” tab.",
    k_vulnerable: "vulnerable people in the district ({n} at high risk)",
    k_covered: "have at least one volunteer",
    k_volunteers: "neighbour volunteers involved",
    k_uncovered: "no volunteer nearby → volunteer HQ / social services",
    k_all_covered: "every vulnerable person has a volunteer",
    k_off_title: "Circles are off",
    k_off: "Heat level is below 2. Pick a day with level 2–3 or use “Plan for level” at the top.",
    h_groups: "Care Circles",
    h_groups_hint: "Volunteers are matched by shared Circle and distance",
    h_groups_off: "Care Circles switch on from heat level 2.",
    g_circle: "Circle: {b}",
    g_counts: "{v} vulnerable · {h} volunteers",
    g_checkers: "Checked by:",
    g_need_more: "{n} more needed",
    g_none: "No volunteer within 1 km → hand over to the volunteer HQ / social services",
    g_cool: "Cool place: {name} — {dist}, ~{min} min walk",
    risk_high: "high risk", risk_medium: "medium risk", risk_low: "low risk",
    fac_not_leaving_home: "doesn't leave home daily", fac_bedridden: "bedridden",
    fac_top_floor: "top floor", fac_cannot_self_care: "can't care for self",
    fac_lives_alone: "lives alone", fac_no_ac: "no air conditioning",
    depth_4: "same entrance", depth_3: "same building", depth_2: "same district", depth_1: "same city",
    building: "Building {b}", entrance: "Entrance {e}", district_demo: "Demo district",
    floor: "fl. {f}/{n}", age: "{a} y.o.",
    place_library: "Library", place_mall: "Air-conditioned mall", place_community_centre: "Community centre",
    place_clinic: "Clinic", place_park: "Square with a fountain", place_cinema: "Cinema", demo_suffix: " (demo)",
    place_tip: "Cool place",
    tip_risk: "Risk: {label} (score {score})",
    tip_volunteer: "Volunteer", tip_blooma: " · Blooma user", tip_checks: "Checks on: {names}",
    h_checks: "Check-ins",
    h_reset: "Reset checks",
    h_checks_off: "Checks appear when Care Circles are on.",
    c_summary: "OK: {ok} · needs help: {help} · with backup: {backup} · escalated: {escalated} · pending: {pending}",
    c_person: "Person", c_buddy: "Checking now", c_status: "Status", c_result: "Check result",
    c_ok: "All good", c_help: "Unwell", c_no: "No answer",
    st_pending: "pending", st_ok: "all good", st_help: "needs help", st_backup: "passed to backup", st_escalated: "escalated: 103 / 112",
    adv_help: "Move them somewhere cool, give small sips of water, cool with a wet towel. Confusion, body temperature above 39°, fainting — call 103 at once.",
    adv_escalated: "Nobody got through. Call relatives or the building manager; if needed, 103 or 112 (they can open the door).",
    h_sim: "How fast someone notices a resident is unwell",
    sim_all: "All vulnerable", sim_alone: "People living alone",
    sim_off: "The simulation appears when Care Circles are on (level 2–3).",
    sim_with: "with Care Circles", sim_without: "without the system",
    sim_with_short: "with Circles", sim_without_short: "without",
    sim_y: "% of cases where the person has been found",
    sim_x: "hours after the person became unwell",
    sim_h: "{h} h",
    sim_tip: "Found within {h} h:<br>with Circles — <b>{a}%</b><br>without — <b>{b}%</b>",
    sim_who_all: "{n} vulnerable people, {e} simulated cases",
    sim_who_alone: "{n} people living alone, {e} simulated cases",
    sim_6: "Found within 6 h", sim_12: "Found within 12 h", sim_med: "Median time until someone notices",
    sim_assume: "This is a model with assumptions, not real data. Ordinary contact happens on average every {a} h (not living alone), {b} h (lives alone, goes out), {c} h (lives alone, stays in). A volunteer completes a check with {p}% probability; otherwise a backup tries {d} h later. Checks at {slots}. Parameters are in blooma/simulate.py.",

    foot_data: "Data: Open-Meteo, © OpenStreetMap contributors, NASA FIRMS. Methods: Nesterov index; heat risk factors from Semenza et al., NEJM 1996.",
    map_help: "Scroll or +/− to zoom, drag to pan",
    unit_m: "m", unit_km: "km", unit_h: "h", feels: "feels", fire_short: "Fire",
  },
};

const CITY_EN = {
  "Київ": "Kyiv", "Вінниця": "Vinnytsia", "Луцьк": "Lutsk", "Дніпро": "Dnipro", "Житомир": "Zhytomyr",
  "Ужгород": "Uzhhorod", "Запоріжжя": "Zaporizhzhia", "Івано-Франківськ": "Ivano-Frankivsk",
  "Кропивницький": "Kropyvnytskyi", "Львів": "Lviv", "Миколаїв": "Mykolaiv", "Одеса": "Odesa",
  "Полтава": "Poltava", "Рівне": "Rivne", "Суми": "Sumy", "Тернопіль": "Ternopil", "Харків": "Kharkiv",
  "Херсон": "Kherson", "Хмельницький": "Khmelnytskyi", "Черкаси": "Cherkasy", "Чернівці": "Chernivtsi",
  "Чернігів": "Chernihiv", "Краматорськ": "Kramatorsk",
};

// Official Ukrainian romanization (Cabinet of Ministers resolution No. 55, 2010).
const TR = { а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: ["ye", "ie"], ж: "zh", з: "z", и: "y", і: "i",
  ї: ["yi", "i"], й: ["y", "i"], к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: ["yu", "iu"], я: ["ya", "ia"], "'": "", "’": "" };

function translit(text) {
  let out = "";
  let start = true;
  for (const ch of String(text)) {
    const low = ch.toLowerCase();
    let r = TR[low];
    if (r === undefined) { out += ch; start = !/[a-zа-яіїєґ]/i.test(ch); continue; }
    if (Array.isArray(r)) r = start ? r[0] : r[1];
    if (low === "г" && out.toLowerCase().endsWith("z")) r = "gh";
    out += ch !== low && r ? r[0].toUpperCase() + r.slice(1) : r;
    start = false;
  }
  return out;
}

let LANG = (() => {
  try {
    return localStorage.getItem("blooma_lang") || "uk";
  } catch {
    return "uk";
  }
})();
if (!I18N[LANG]) LANG = "uk";

function setLang(lang) {
  LANG = I18N[lang] ? lang : "uk";
  try {
    localStorage.setItem("blooma_lang", LANG);
  } catch {
    /* storage unavailable */
  }
}

function t(key, params) {
  let s = I18N[LANG][key];
  if (s === undefined) s = I18N.uk[key];
  if (s === undefined) return key;
  if (params && typeof s === "string") s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
  return s;
}

const cityName = (c) => (LANG === "en" ? CITY_EN[c] || translit(c) : c);
const personName = (n) => (LANG === "en" ? translit(n) : n);
const buildingName = (b) => t("building", { b: LANG === "en" ? translit(b) : b });
