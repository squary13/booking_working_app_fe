const API_URL = "https://booking-worker-py-be.squary50.workers.dev";

window.addEventListener("DOMContentLoaded", async () => {
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("timeSelect");
  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");80 
  const status = document.getElementById("status");
  const records = document.getElementById("records");

  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get("name") || "";
  const userIdRaw = urlParams.get("user_id");
  const userId = userIdRaw && !isNaN(parseInt(userIdRaw, 10)) ? parseInt(userIdRaw, 10) : null;

  nameInput.value = name;
  document.getElementById("welcomeText").textContent = `👋 Привет, ${name || "Гость"}!`;

  async function ensureUserExists(userId, name, phone) {
  status.textContent = "⏳ Проверка пользователя...";
  try {
    const res = await fetch(`${API_URL}/api/users/${userId}`);
    const user = await res.json();
    if (!user || user.error) {
      const createRes = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: userId,
          name: name || "Без имени",
          phone: phone || "00000000",
          role: "user"
        })
      });
      const result = await createRes.json();
      if (createRes.status === 201 || createRes.status === 200) {
        status.textContent = "✅ Пользователь создан!";
        nameInput.value = result.name;
        phoneInput.value = result.phone;
        return result.id;
      } else {
        status.textContent = `⚠️ Ошибка создания: ${result.error || "Неизвестно"}`;
        return null;
      }
    } else {
      status.textContent = "✅ Пользователь найден!";
      nameInput.value = user.name;
      phoneInput.value = user.phone;
      return user.id;
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

  async function loadBookings(userId) {
    records.innerHTML = "";
    try {
      const res = await fetch(`${API_URL}/api/bookings/by-user/${userId}`);
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

  document.getElementById("submitBtn").onclick = async () => {
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

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.status === 201 || result.ok) {
        status.textContent = "✅ Вы успешно записаны!";
        loadBookings(userId);
      } else {
        status.textContent = `⚠️ ${result.error || "Ошибка записи"}`;
      }
    } catch {
      status.textContent = "❌ Ошибка отправки";
    }
  };

  const availableDates = await fetchAvailableDates();

  flatpickr("#date", {
    dateFormat: "Y-m-d",
    enable: availableDates,
    defaultDate: new Date()
  });

  // Заполняем фиксированные слоты
  const defaultTimes = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];
  defaultTimes.forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = t;
    timeSelect.appendChild(option);
  });

  if (userId) {
    await ensureUserExists(userId, nameInput.value, phoneInput.value);
    loadBookings(userId);
  } else {
    status.textContent = "⚠️ Не удалось определить пользователя";
  }

  if (!nameInput.value) nameInput.focus();
  else if (!phoneInput.value) phoneInput.focus();
});