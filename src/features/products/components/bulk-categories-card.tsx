"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";

import {
  productKeys,
  useCategories,
  useCreateCategory,
  useCreateSubcategory,
} from "../api/products.queries";
import { CATEGORIES_TO_CREATE } from "../constants/category-cleanup";
import { slugify } from "../schemas/product-form";

/**
 * Part of the temporary `/catalogues/cleanup` page. Creates categories and
 * subcategories in one go: `Parent` on its own line for a top-level category,
 * `Parent > Child` for a subcategory. A missing parent is created first.
 * Anything that already exists (same name or slug, ignoring case) is skipped.
 * Prefilled with the targets the cleanup list needs that do not exist yet.
 */

interface Row {
  parent: string;
  child?: string;
}

const key = (name: string) => slugify(name);

function parse(text: string): Row[] {
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const line of text.split("\n")) {
    const [parent, child] = line.split(">").map((s) => s.trim());
    if (!parent) continue;
    const id = child ? `${key(parent)}/${key(child)}` : key(parent);
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push(child ? { parent, child } : { parent });
  }
  return rows;
}

export function BulkCategoriesCard() {
  const { data: tree = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const createSub = useCreateSubcategory();
  const queryClient = useQueryClient();
  const [text, setText] = useState(CATEGORIES_TO_CREATE.join("\n"));
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState<Record<string, string>>({});

  /** Top-level slug or name → { id, child slugs and names }. */
  const existing = useMemo(() => {
    const map = new Map<string, { id: string; children: Set<string> }>();
    for (const c of tree) {
      const children = new Set<string>();
      for (const s of c.children ?? []) {
        if (typeof s === "string") continue;
        children.add(s.slug);
        children.add(key(s.name));
      }
      const entry = { id: c.id, children };
      map.set(c.slug, entry);
      map.set(key(c.name), entry);
    }
    return map;
  }, [tree]);

  const rows = useMemo(() => parse(text), [text]);

  const exists = (r: Row) => {
    const parent = existing.get(key(r.parent));
    if (!r.child) return !!parent;
    return !!parent?.children.has(key(r.child));
  };

  // A child line implies its parent, so list parents that need creating too.
  const parentsToCreate = [
    ...new Set(
      rows.filter((r) => !existing.has(key(r.parent))).map((r) => r.parent),
    ),
  ];
  const childrenToCreate = rows.filter((r) => r.child && !exists(r));
  const toCreateCount = parentsToCreate.length + childrenToCreate.length;

  // Sequential on purpose: the backend caps in-flight requests per IP, and
  // children need their parent's id.
  const handleCreate = async () => {
    setRunning(true);
    setFailed({});
    const errors: Record<string, string> = {};
    const parentIds = new Map<string, string>();
    let created = 0;

    for (const name of parentsToCreate) {
      try {
        const res = await createCategory.mutateAsync({
          name,
          slug: slugify(name),
          isActive: true,
        });
        if (!res?.id)
          throw new Error(
            "Created, but no id came back. Press the button again.",
          );
        parentIds.set(key(name), res.id);
        created++;
      } catch (err) {
        errors[name] = getErrorMessage(err, "Could not create");
      }
    }

    for (const r of childrenToCreate) {
      const label = `${r.parent} › ${r.child}`;
      const parentId =
        existing.get(key(r.parent))?.id ?? parentIds.get(key(r.parent));
      if (!parentId) {
        errors[label] = `${r.parent} was not created`;
        continue;
      }
      try {
        await createSub.mutateAsync({
          categoryId: parentId,
          data: { name: r.child!, slug: slugify(r.child!), isActive: true },
        });
        created++;
      } catch (err) {
        errors[label] = getErrorMessage(err, "Could not create");
      }
    }

    // The subcategory hook does not refresh the tree the move targets read.
    await queryClient.invalidateQueries({ queryKey: productKeys.categories });
    setFailed(errors);
    setRunning(false);
    const failCount = Object.keys(errors).length;
    if (failCount) toast.error(`Created ${created}, ${failCount} failed`);
    else
      toast.success(`Created ${created} categor${created === 1 ? "y" : "ies"}`);
  };

  const allExist = rows.length > 0 && toCreateCount === 0;

  return (
    <Card className={allExist ? "border-success/40 bg-success/5" : undefined}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Add categories in bulk
          {allExist && <Badge variant="success">All exist</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          One per line. Write <code>Parent</code> for a top-level category or{" "}
          <code>Parent &gt; Child</code> for a subcategory. A missing parent is
          created first. Anything that already exists is skipped, so pressing
          the button twice does no harm. Add images and descriptions afterwards
          in Brands & Categories.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          className="font-mono text-xs"
          disabled={running}
        />
        {isLoading ? (
          <p className="text-muted-foreground">Loading categories…</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {parentsToCreate.map((p) => (
              <Badge
                key={`p-${p}`}
                variant={failed[p] ? "destructive" : "outline"}
                title={failed[p] ?? "New top-level category"}
              >
                {p} (new parent)
              </Badge>
            ))}
            {rows.map((r) => {
              const label = r.child ? `${r.parent} › ${r.child}` : r.parent;
              if (!r.child && parentsToCreate.includes(r.parent)) return null;
              const done = exists(r);
              return (
                <Badge
                  key={label}
                  variant={
                    failed[label]
                      ? "destructive"
                      : done
                        ? "secondary"
                        : "outline"
                  }
                  title={
                    failed[label] ??
                    (done ? "Already exists" : "Will be created")
                  }
                >
                  {label}
                  {done && " ✓"}
                </Badge>
              );
            })}
          </div>
        )}
        {Object.entries(failed).map(([label, msg]) => (
          <p key={label} className="text-destructive text-xs">
            {label}: {msg}
          </p>
        ))}
        <Button
          onClick={handleCreate}
          disabled={isLoading || running || toCreateCount === 0}
        >
          {running
            ? "Creating…"
            : `Create ${toCreateCount} categor${toCreateCount === 1 ? "y" : "ies"}`}
        </Button>
      </CardContent>
    </Card>
  );
}
