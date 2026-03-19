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
      console.log("Upload middleware triggered");
      try {
        const session = await requireAuth(req);
        console.log("Session in middleware:", session?.user?.email || "No session");
        // Temporarily allowing upload without session for a single deploy to debug
        return { userId: session?.user?.id || "anonymous" };
      } catch (err) {
        console.error("Middleware error:", err);
        return { userId: "anonymous" };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("onUploadComplete START:", { userId: metadata.userId, fileUrl: file.url });

      try {
        const res = await db.insert(media).values({
          url: file.url,
          name: file.name,
          type: file.type || "image/png",
          key: file.key,
          size: file.size,
        });
        console.log("DB Insert success:", res);
      } catch (err) {
        console.error("DB Insert FAILED:", err);
      }

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
