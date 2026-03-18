import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db";
import { media } from "@/db/schema";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
  })
    .middleware(async ({ req }) => {
    const session = await requireAuth(req);
    if (!session?.user) {
      throw new UploadThingError("Unauthorized");
    }
    return { userId: session.user.id };
  })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db.insert(media).values({
          url: file.url,
          name: file.name,
          type: file.type || "image/png",
          key: file.key,
          size: file.size,
        });
      } catch (err) {
        console.error("[uploadthing] DB insert failed:", err);
      }

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
