const API_URL = "https://booking-worker-py-be.squary50.workers.dev";
const ADMIN_TELEGRAM_ID = 668191091;

/* ============================
   🌐 Мультиязычность
============================ */
const LANG = {
  ru: {
    welcome: name => `👋 Привет, ${name || "Гость"}!`,
    date: "Дата",
    time: "Время",
    name: "Имя",
    phone: "Телефон",
    submit: "Записаться",
    required: "⚠️ Все поля обязательны",
    noSlots: "Нет доступных слотов",
    loadingSlotsError: "Ошибка загрузки слотов",
    noRecords: "ℹ️ У вас нет записей",
    delete: "❌ Удалить",
    deleting: "⏳ Удаление...",
    deleted: "✅ Запись удалена!",
    sending: "⏳ Отправка...",
    success: "✅ Вы успешно записаны!",
    unknownUser: "⚠️ Не удалось определить пользователя",
    checkingUser: "⏳ Проверка пользователя...",
    userFound: "✅ Пользователь найден!",
    userCreated: "✅ Пользователь создан!",
    userCreateError: "⚠️ Ошибка создания",
    apiError: "❌ Ошибка соединения с API",
  },

  lv: {
    welcome: name => `👋 Sveiki, ${name || "viesi"}!`,
    date: "Datums",
    time: "Laiks",
    name: "Vārds",
    phone: "Telefons",
    submit: "Pieteikties",
    required: "⚠️ Visi lauki ir obligāti",
    noSlots: "Nav pieejamu laiku",
    loadingSlotsError: "Kļūda ielādējot laikus",
    noRecords: "ℹ️ Jums nav pierakstu",
    delete: "❌ Dzēst",
    deleting: "⏳ Dzēšana...",
    deleted: "✅ Pieraksts dzēsts!",
    sending: "⏳ Nosūtīšana...",
    success: "✅ Pieraksts veiksmīgs!",
    unknownUser: "⚠️ Neizdevās noteikt lietotāju",
    checkingUser: "⏳ Pārbauda lietotāju...",
    userFound: "✅ Lietotājs atrasts!",
    userCreated: "✅ Lietotājs izveidots!",
    userCreateError: "⚠️ Kļūda izveidojot lietotāju",
    apiError: "❌ API savienojuma kļūda",
  },

  en: {
    welcome: name => `👋 Hello, ${name || "Guest"}!`,
    date: "Date",
    time: "Time",
    name: "Name",
    phone: "Phone",
    submit: "Submit",
    required: "⚠️ All fields are required",
    noSlots: "No available slots",
    loadingSlotsError: "Error loading slots",
    noRecords: "ℹ️ You have no bookings",
    delete: "❌ Delete",
    deleting: "⏳ Deleting...",
    deleted: "✅ Booking deleted!",
    sending: "⏳ Sending...",
    success: "✅ You are booked!",
    unknownUser: "⚠️ Unable to identify user",
    checkingUser: "⏳ Checking user...",
    userFound: "✅ User found!",
    userCreated: "✅ User created!",
    userCreateError: "⚠️ Error creating user",
    apiError: "❌ API connection error",
  }
};

let currentLang = localStorage.getItem("lang") || "ru";

function applyLang() {
  document.getElementById("welcomeText").textContent =
    LANG[currentLang].welcome(nameInput.value);

  document.querySelector("label[for='date']").textContent = LANG[currentLang].date;
  document.querySelector("label[for='timeSelect']").textContent = LANG[currentLang].time;
  document.querySelector("label[for='nameInput']").textContent = LANG[currentLang].name;
  document.querySelector("label[for='phoneInput']").textContent = LANG[currentLang].phone;

  submitBtn.textContent = LANG[currentLang].submit;
}

/* ============================
   Основной код
============================ */
window.addEventListener("DOMContentLoaded", async () => {
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("timeSelect");
  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");
  const status = document.getElementById("status");
  const records = document.getElementById("records");
  const refreshBtn = document.getElementById("refreshBtn");
  const submitBtn = document.getElementById("submitBtn");

  /* === ЯЗЫК === */
  const langSelect = document.getElementById("langSelect");
  langSelect.value = currentLang;

  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    localStorage.setItem("lang", currentLang);
    applyLang();
  });

  /* === ПАРСИНГ ПАРАМЕТРОВ === */
  const urlParams = new URLSearchParams(window.location.search);
  const name = decodeURIComponent(urlParams.get("name") || "");
  const telegramIdRaw = urlParams.get("user_id");
  const telegramId = telegramIdRaw && /^\d+$/.test(telegramIdRaw) ? parseInt(telegramIdRaw, 10) : null;

  nameInput.value = name;

  applyLang();

  let userId = null;

  /* === ПРОВЕРКА ИЛИ СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ === */
  async function ensureUserExists(telegramId, name, phone) {
    if (!telegramId) {
      status.textContent = LANG[currentLang].unknownUser;
      return null;
    }

    status.textContent = LANG[currentLang].checkingUser;

    try {
      const res = await fetch(`${API_URL}/api/users?telegram_id=${telegramId}`);
      const users = await res.json();

      if (Array.isArray(users) && users.length > 0) {
        const user = users[0];
        status.textContent = LANG[currentLang].userFound;

        nameInput.value = user.name;
        phoneInput.value = user.phone;

        if (user.role === "admin") {
          document.getElementById("adminPanel").style.display = "block";
        }

        return user.id;
      }

      const createRes = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: telegramId,
          name: name || "Без имени",
          phone: phone || "00000000",
          role: "user"
        })
      });

      const result = await createRes.json();

      if (createRes.ok && result.id) {
        status.textContent = LANG[currentLang].userCreated;
        return result.id;
      }

      status.textContent = LANG[currentLang].userCreateError;
      return null;

    } catch {
      status.textContent = LANG[currentLang].apiError;
      return null;
    }
  }

  /* === ЗАГРУЗКА ДАТ === */
  async function fetchAvailableDates() {
    try {
      const res = await fetch(`${API_URL}/api/available-dates`);
      const data = await res.json();
      return data.dates || [];
    } catch {
      return [];
    }
  }

  /* === ЗАГРУЗКА ЗАПИСЕЙ === */
  async function loadBookings(telegramId) {
    records.innerHTML = "";

    try {
      const res = await fetch(`${API_URL}/api/bookings/by-user/${telegramId}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        records.textContent = LANG[currentLang].apiError;
        return;
      }

      if (data.length === 0) {
        records.textContent = LANG[currentLang].noRecords;
        return;
      }

      records.innerHTML = data
        .map(r => `
          📅 ${r.date} — ${r.time}
          <button data-id="${r.id}" class="deleteBtn">${LANG[currentLang].delete}</button>
        `)
        .join("<br>");

      document.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.onclick = async () => {
          btn.disabled = true;
          btn.textContent = LANG[currentLang].deleting;

          try {
            const res = await fetch(`${API_URL}/api/bookings/${btn.dataset.id}`, {
              method: "DELETE"
            });

            if (res.ok) {
              status.textContent = LANG[currentLang].deleted;
              loadBookings(telegramId);
            }
          } catch {
            status.textContent = LANG[currentLang].apiError;
          }
        };
      });

    } catch {
      records.textContent = LANG[currentLang].apiError;
    }
  }

  /* === ЗАГРУЗКА СВОБОДНЫХ СЛОТОВ === */
  async function loadAvailableTimes(date) {
    timeSelect.innerHTML = "";

    try {
      const res = await fetch(`${API_URL}/api/bookings/by-user/${ADMIN_TELEGRAM_ID}`);
      const allSlots = await res.json();

      const filtered = allSlots.filter(slot => slot.date === date);

      if (filtered.length === 0) {
        const option = document.createElement("option");
        option.textContent = LANG[currentLang].noSlots;
        option.disabled = true;
        timeSelect.appendChild(option);
        return;
      }

      [...new Set(filtered.map(s => s.time))].forEach(time => {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
      });

    } catch {
      const option = document.createElement("option");
      option.textContent = LANG[currentLang].loadingSlotsError;
      option.disabled = true;
      timeSelect.appendChild(option);
    }
  }

  /* === ОТПРАВКА ЗАПИСИ === */
  submitBtn.onclick = async () => {
    const payload = {
      user_id: userId,
      date: dateInput.value,
      time: timeSelect.value
    };

    if (!payload.user_id || !payload.date || !payload.time) {
      status.textContent = LANG[currentLang].required;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = LANG[currentLang].sending;

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.status === 201 || result.id) {
        status.textContent = LANG[currentLang].success;
        loadBookings(telegramId);
      } else {
        status.textContent = result.error || LANG[currentLang].apiError;
      }

    } catch {
      status.textContent = LANG[currentLang].apiError;
    }

    submitBtn.disabled = false;
    submitBtn.textContent = LANG[currentLang].submit;
  };

  /* === ИНИЦИАЛИЗАЦИЯ === */
  const availableDates = await fetchAvailableDates();

  flatpickr("#date", {
    dateFormat: "Y-m-d",
    enable: availableDates,
    defaultDate: new Date()
  });

  if (telegramId) {
    userId = await ensureUserExists(telegramId, nameInput.value, phoneInput.value);
    if (userId) {
      loadBookings(telegramId);
    }
  } else {
    status.textContent = LANG[currentLang].unknownUser;
  }
});
