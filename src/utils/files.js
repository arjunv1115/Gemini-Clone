export const MAX_IMAGES = 4;
export const MAX_IMAGE_MB = 8;

/** Read an image File into { name, mimeType, data (base64), preview (data URL) }. */
export function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Only image files are supported."));
    if (file.size > MAX_IMAGE_MB * 1024 * 1024)
      return reject(new Error(`Images must be under ${MAX_IMAGE_MB} MB.`));
    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result;
      resolve({ name: file.name, mimeType: file.type, data: preview.split(",")[1], preview });
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

export const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2) + Date.now();

export function groupByDate(chats) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const day = 86400000;
  const groups = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  chats.forEach((c) => {
    const diff = today - startOfDay(new Date(c.updatedAt));
    if (diff <= 0) groups.Today.push(c);
    else if (diff <= day) groups.Yesterday.push(c);
    else if (diff <= 7 * day) groups["Previous 7 days"].push(c);
    else groups.Older.push(c);
  });
  return Object.entries(groups).filter(([, list]) => list.length);
}
