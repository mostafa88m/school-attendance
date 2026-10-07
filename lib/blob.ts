
import { issueSignedToken, presignUrl } from "@vercel/blob";

export async function signedPhotoUrl(pathname: string | null) {
  if (!pathname) return null;
  try {
    const token = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil: Date.now() + 60 * 60 * 1000,
    });
    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation: "get",
      validUntil: Date.now() + 15 * 60 * 1000,
    });
    return presignedUrl;
  } catch {
    return null;
  }
}
