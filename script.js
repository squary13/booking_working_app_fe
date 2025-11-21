const API_URL = "https://booking-worker-py-be.squary50.workers.dev";

window.addEventListener("DOMContentLoaded", async () => {
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("timeSelect");
  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");
  const status = document.getElementById("status");
  const records = document.getElementById("records");
  const refreshBtn = document.getElementById("refreshBtn");
  const submitBtn = document.getElementById("submitBtn");

  const urlParams = new URLSearchParams(window.location.search);
  const name = decodeURIComponent(urlParams.get("name") || "");
  const telegramIdRaw = urlParams.get("user_id");
  const telegramId = telegramIdRaw && /^\d+$/.test(telegramIdRaw) ? parseInt(telegramIdRaw, 10) : null;

  nameInput.value = name;
  document.getElementById("welcomeText").textContent = `👋 Привет, ${name || "Гость"}!`;

  let userId = null;

  async function ensureUserExists(telegramId, name, phone) {
    if (!telegramId) {
      status.textContent = "⚠️ Не передан Telegram ID";
      return null;
    }

    status.textContent = "⏳ Проверка пользователя...";
    try {
      const res = await fetch(`${API_URL}/api/users?telegram_id=${telegramId}`);
      const users = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        const user = users[0];
        status.textContent = "✅ Пользователь найден!";
        nameInput.value = user.name;
        phoneInput.value = user.phone;
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
        status.textContent = "✅ Пользователь создан!";
        nameInput.value = result.name;
        phoneInput.value = result.phone;
        return result.id;
      } else {
        status.textContent = `⚠️ Ошибка создания: ${result.error || "Неизвестно"}`;
        return null;
      }
    } catch (err) {
      status.textContent = "❌ Ошибка проверки пользователя";
      return null;
    }
  }

  async function fetchAvailableDates() {
    try {
      const res = await fetch(`${API_URL}/api/available-dates`);
      const data = await res.json();
      return data.dates || [];
    } catch {
      return [];
    }
  }

  async function loadBookings(telegramId) {
    records.innerHTML = "";
    if (!telegramId) {
      records.textContent = "⚠️ Неизвестный Telegram ID";
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/bookings/by-user/${telegramId}`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        records.textContent = `⚠️ ${data.error || "Ошибка загрузки"}`;
        return;
      }
      records.innerHTML = data.length
        ? data.map(r => `📅 ${r.date} в ${r.time}`).join("<br>")
        : "ℹ️ У вас нет записей";
    } catch {
      records.textContent = "❌ Ошибка соединения с API";
    }
  }

  async function loadAvailableTimes(date) {
  timeSelect.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/api/bookings/by-user/1000`);
    const allSlots = await res.json();

    // Показываем только слоты на выбранную дату, которые всё ещё принадлежат админу
    const filtered = allSlots.filter(slot => slot.date === date && slot.user_id === 6);

    if (filtered.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Нет доступных слотов";
      option.disabled = true;
      timeSelect.appendChild(option);
      return;
    }

    filtered.forEach(slot => {
      const option = document.createElement("option");
      option.value = slot.time;
      option.textContent = slot.time;
      timeSelect.appendChild(option);
    });
  } catch {
    const option = document.createElement("option");
    option.textContent = "Ошибка загрузки слотов";
    option.disabled = true;
    timeSelect.appendChild(option);
  }
}


  submitBtn.onclick = async () => {
    const payload = {
      user_id: userId,
      date: dateInput.value,
      time: timeSelect.value
    };

    if (!payload.user_id || !payload.date || !payload.time) {
      status.textContent = "⚠️ Все поля обязательны";
      if (!payload.date) dateInput.focus();
      else if (!payload.time) timeSelect.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Отправка...";

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.status === 201 || result.ok || result.id) {
        status.textContent = "✅ Вы успешно записаны!";
        dateInput.value = "";
        timeSelect.value = "";
        loadBookings(telegramId);
        loadAvailableTimes(payload.date); // обновить слоты
      } else {
        status.textContent = `⚠️ ${result.error || "Ошибка записи"}`;
      }
    } catch {
      status.textContent = "❌ Ошибка отправки";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Записаться";
    }
  };

  refreshBtn.onclick = () => {
    loadBookings(telegramId);
    if (dateInput.value) loadAvailableTimes(dateInput.value);
  };

  dateInput.addEventListener("change", () => {
    if (dateInput.value) loadAvailableTimes(dateInput.value);
  });

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
      if (dateInput.value) loadAvailableTimes(dateInput.value);
    }
  } else {
    status.textContent = "⚠️ Не удалось определить пользователя";
  }

  if (!nameInput.value) nameInput.focus();
  else if (!phoneInput.value) phoneInput.focus();
});
