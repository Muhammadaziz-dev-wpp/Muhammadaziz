(() => {
  const databaseName = "trest12-local-admin";
  const databaseVersion = 1;
  const storeName = "records";
  const keys = {
    projects: "projects",
    visitors: "visitors",
    admin: "admin",
  };

  const initialProjects = [
    {
      id: "project-1",
      title: "Loyiha nomi: ?",
      description: "Ma’lumot: ?",
      location: "Manzil: ?",
      cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=85",
      ],
    },
    {
      id: "project-2",
      title: "Loyiha nomi: ?",
      description: "Ma’lumot: ?",
      location: "Manzil: ?",
      cover: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1000&q=85",
      ],
    },
    {
      id: "project-3",
      title: "Loyiha nomi: ?",
      description: "Ma’lumot: ?",
      location: "Manzil: ?",
      cover: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
      ],
    },
    {
      id: "project-4",
      title: "Loyiha nomi: ?",
      description: "Ma’lumot: ?",
      location: "Manzil: ?",
      cover: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
      ],
    },
    {
      id: "project-5",
      title: "Loyiha nomi: ?",
      description: "Ma’lumot: ?",
      location: "Manzil: ?",
      cover: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
      ],
    },
  ];

  let databasePromise;

  const openDatabase = () => {
    if (!("indexedDB" in window)) {
      return Promise.reject(new Error("Brauzeringizda mahalliy saqlash mavjud emas."));
    }

    if (!databasePromise) {
      databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, databaseVersion);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(storeName)) {
            request.result.createObjectStore(storeName, { keyPath: "key" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Saqlash omborini ochib bo‘lmadi."));
        request.onblocked = () => reject(new Error("Saqlash ombori boshqa oynada band."));
      });
    }

    return databasePromise;
  };

  const read = async (key) => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : undefined);
      request.onerror = () => reject(request.error || new Error("Ma’lumotni o‘qib bo‘lmadi."));
    });
  };

  const write = async (key, value) => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put({ key, value });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Ma’lumotni saqlab bo‘lmadi."));
      transaction.onabort = () => reject(transaction.error || new Error("Saqlash bekor qilindi."));
    });
  };

  const remove = async (key) => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Ma’lumotni o‘chirib bo‘lmadi."));
    });
  };

  const hashPassword = async (password, salt) => {
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const digest = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: 120000,
    }, passwordKey, 256);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  window.Trest12Data = Object.freeze({
    keys,
    initialProjects: () => initialProjects.map((project) => ({ ...project, gallery: [...project.gallery] })),
    getProjects: async () => {
      const projects = await read(keys.projects);
      return projects || initialProjects.map((project) => ({ ...project, gallery: [...project.gallery] }));
    },
    saveProjects: (projects) => write(keys.projects, projects),
    getVisitors: async () => (await read(keys.visitors)) || [],
    saveVisitors: (visitors) => write(keys.visitors, visitors),
    isVisitorPromptDismissed: async () =>
      sessionStorage.getItem("trest12-visitor-prompt-dismissed") === "true",
    dismissVisitorPrompt: async () => {
      sessionStorage.setItem("trest12-visitor-prompt-dismissed", "true");
    },
    submitVisitor: async (visitor) => {
      const database = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.get(keys.visitors);
        request.onsuccess = () => {
          const visitors = request.result ? request.result.value : [];
          visitors.push(visitor);
          store.put({ key: keys.visitors, value: visitors });
        };
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error("Ma’lumotni saqlab bo‘lmadi."));
        transaction.onabort = () => reject(transaction.error || new Error("Saqlash bekor qilindi."));
      });
    },
    getAdmin: () => read(keys.admin),
    createAdmin: async (username, password) => {
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      await write(keys.admin, {
        username: username.trim(),
        salt,
        passwordHash: await hashPassword(password, salt),
      });
    },
    verifyAdmin: async (username, password) => {
      const admin = await read(keys.admin);
      if (!admin || admin.username !== username.trim()) return false;
      return (await hashPassword(password, admin.salt)) === admin.passwordHash;
    },
    remove,
  });
})();
