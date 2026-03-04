import { describe, it, expect, vi } from "vitest";
import { createFileHandler, getFilesHandler } from "./files";
import { MutationCtx, QueryCtx } from "./_generated/server";

describe("File Management Handlers", () => {
  it("creates a new file and returns its ID", async () => {
    const mockCtx = {
      db: {
        insert: vi.fn().mockResolvedValue("file-1"),
      },
    } as unknown as MutationCtx;

    const result = await createFileHandler(mockCtx, {
      name: "Test Workflow",
      type: "workflow",
      description: "A test workflow file",
    });

    expect(result).toBe("file-1");
    expect(mockCtx.db.insert).toHaveBeenCalledWith("files", {
      name: "Test Workflow",
      type: "workflow",
      description: "A test workflow file",
    });
  });

  it("fetches all files", async () => {
    const mockFiles = [
      { _id: "file-1", name: "File 1", type: "workflow" },
      { _id: "file-2", name: "File 2", type: "workflow" },
    ];
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockFiles),
        }),
      },
    } as unknown as QueryCtx;

    const result = await getFilesHandler(mockCtx, {});

    expect(result).toEqual(mockFiles);
    expect(mockCtx.db.query).toHaveBeenCalledWith("files");
  });
});
