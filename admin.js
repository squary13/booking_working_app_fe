const API_URL = "https://booking-worker-py-be.squary50.workers.dev";

window.addEventListener("DOMContentLoaded", async () => {
  const userTable = document.getElementById("userTable");
  const status = document.getElementById("status");
  const generateBtn = document.getElementById("generateSlots");
  const deleteAllBtn = document.getElementById("deleteAllBtn");
  const refreshAdminRecordsBtn = document.getElementById("refreshAdminRecordsBtn");
  const adminRecords = document.getElementById("adminRecords");

  /* ============================
     Загрузка пользователей
  ============================ */
  async function loadUsers() {
    status.textContent = "⏳ Загружаем пользователей...";

    try {
      const res = await fetch(`${API_URL}/api/users`);
      const users = await res.json();

      if (!Array.isArray(users)) {
        status.textContent = `⚠️ ${users.error || "Ошибка загрузки"}`;
        return;
      }

      userTable.innerHTML = `
        <tr>
          <th>ID</th>
          <th>Telegram</th>
          <th>Имя</th>
          <th>Телефон</th>
          <th>Роль</th>
          <th>Создан</th>
        </tr>
      `;

      users.forEach(u => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${u.id}</td>
          <td>${u.telegram_id || "-"}</td>
          <td>${u.name}</td>
          <td>${u.phone || "-"}</td>
          <td>${u.role || "-"}</td>
          <td>${u.created_at}</td>
        `;
        userTable.appendChild(row);
      });

      status.textContent = `✅ Загружено ${users.length} пользователей`;
    } catch (err) {
      status.textContent = "❌ Ошибка соединения с API";
    }
  }

  /* ============================
     Генерация слотов
  ============================ */
  generateBtn.onclick = async () => {
    const dateInput = document.getElementById("slotDate");
    const selectedDate = dateInput.value;

    if (!selectedDate) {
      status.textContent = "⚠️ Выберите дату для генерации слотов";
      return;
    }

    status.textContent = "⏳ Генерация слотов...";

    try {
      const res = await fetch(`${API_URL}/api/generate-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate })
      });

      const result = await res.json();

      if (result.ok) {
        status.textContent = `✅ Сгенерировано ${result.generated} слотов`;
      } else {
        status.textContent = `⚠️ ${result.error || "Ошибка генерации"}`;
      }
    } catch {
      status.textContent = "❌ Ошибка генерации";
    }
  };

  /* ============================
     Удаление всех записей
  ============================ */
  deleteAllBtn.onclick = async () => {
    if (!confirm("Вы уверены, что хотите удалить ВСЕ записи?")) return;

    deleteAllBtn.disabled = true;
    deleteAllBtn.textContent = "⏳ Удаление...";

    try {
      const res = await fetch(`${API_URL}/api/bookings/delete-all`, {
        method: "DELETE"
      });

      const result = await res.json();

      if (res.ok) {
        status.textContent = "🗑 Все записи удалены!";
        adminRecords.textContent = "Нет записей";
      } else {
        status.textContent = `⚠️ Ошибка: ${result.error || "Неизвестно"}`;
      }
    } catch {
      status.textContent = "❌ Ошибка соединения";
    }

    deleteAllBtn.disabled = false;
    deleteAllBtn.textContent = "🗑 Удалить все записи";
  };

  /* ============================
     Загрузка записей на сегодня
  ============================ */
  refreshAdminRecordsBtn.onclick = async () => {
    adminRecords.textContent = "⏳ Загружаем...";

    try {
      const res = await fetch(`${API_URL}/api/bookings/today`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        adminRecords.textContent = `⚠️ ${data.error || "Ошибка загрузки"}`;
        return;
      }

      adminRecords.innerHTML = data.length
        ? data.map(r => `📅 ${r.date} — ${r.time} — ${r.name}`).join("<br>")
        : "ℹ️ Нет записей на сегодня";

    } catch {
      adminRecords.textContent = "❌ Ошибка соединения";
    }
  };

  /* ============================
     Инициализация
  ============================ */
  loadUsers();
});
