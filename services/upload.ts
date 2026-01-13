import { gasCall } from "./gasApi";

// Convert file to base64 WITHOUT prefix
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      // result looks like: data:image/png;base64,xxxxxxx
      const base64 = result.split(",")[1]; // ✅ remove prefix
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToDrive(
  file: File,
  category: "profile" | "campaign"
): Promise<string> {
  // ✅ validation (important for Apps Script limits)
  const maxSizeMB = category === "profile" ? 2 : 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File too large. Max allowed: ${maxSizeMB} MB`);
  }

  const base64 = await fileToBase64(file);

  const url = await gasCall<string>("uploadFile", {
    base64,
    mimeType: file.type,
    fileName: file.name,
    category,
  });

  return url; // ✅ Google Drive public URL returned
}
