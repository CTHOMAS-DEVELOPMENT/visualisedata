import { openDB } from "idb";

// Open (and create if doesn't exist) the database
const dbPromise = openDB("api-responses", 1, {
    upgrade(db) {
      db.createObjectStore("responses");
    },
});

export const saveData = async (url, visualizationName, data) => {
  const db = await dbPromise;
  const tx = db.transaction("responses", "readwrite");
  const store = tx.objectStore("responses");

  // Replace the existing response for this URL or add a new entry
  await store.put(
    { url, name: visualizationName, response: data },
    url
  );

  await tx.done;
};

  


export const getData = async (url) => {
    const db = await dbPromise;
    const tx = db.transaction("responses", "readonly");
    const store = tx.objectStore("responses");
    return await store.get(url);
}

export const saveToDb = async (url, data) => {
    const db = await openDB("api-responses", 1, {
        upgrade(db) {
            db.createObjectStore("responses", { keyPath: "url" });
        },
    });

    const tx = db.transaction("responses", "readwrite");
    const store = tx.objectStore("responses");
    const item = { url, data, timestamp: new Date() };

    // Check if the url already exists in the store
    const existingItem = await store.get(url);
    if (existingItem) {
        // If the url exists, update the data and timestamp
        await store.put(item);
    } else {
        // If the url does not exist, add the new item
        await store.add(item);
    }

    await tx.done;
};

export const clearDb = async () => {
    try {
      const db = await openDB("api-responses", 1);
      const tx = db.transaction("responses", "readwrite");
      const store = tx.objectStore("responses");
      store.clear();
      await tx.done;
    } catch (error) {
      console.error("Failed to clear database:", error);
    }
  };

