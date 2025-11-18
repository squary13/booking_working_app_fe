const API_URL = "https://booking-worker-py-be.squary50.workers.dev";

window.addEventListener("DOMContentLoaded", async () => {
  const userTable = document.getElementById("userTable");
  const status = document.getElementById("status");
  const generateBtn = document.getElementById("generateSlots");

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
          <td>${u.telegram_id}</td>
          <td>${u.name}</td>
          <td>${u.phone}</td>
          <td>${u.role}</td>
          <td>${u.created_at}</td>
        `;
        userTable.appendChild(row);
      });

      status.textContent = `✅ Загружено ${users.length} пользователей`;
    } catch (err) {
      status.textContent = "❌ Ошибка соединения с API";
    }
  }

  generateBtn.onclick = async () => {
    status.textContent = "⏳ Генерация слотов...";
    try {
      const res = await fetch(`${API_URL}/api/generate-slots`, {
        method: "POST"
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

  loadUsers();
});