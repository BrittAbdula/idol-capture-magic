import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Grid3X3, Image, LayoutGrid, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, getGoogleAuthUrl } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { ImageFrame } from "@/components/media/ImageFrame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

type BinderItem = Awaited<ReturnType<typeof api.binderItems>>["items"][number];

export default function MyBinder() {
  const auth = useAuth();
  const [sort, setSort] = useState("date");
  const [dense, setDense] = useState(false);
  const [publicBinder, setPublicBinder] = useState(false);
  const [selected, setSelected] = useState<BinderItem | null>(null);
  const binder = useQuery({
    queryKey: ["binder", "items"],
    queryFn: api.binderItems,
    enabled: auth.isAuthenticated
  });
  const items = useMemo(() => {
    const next = [...(binder.data?.items ?? [])];
    if (sort === "caption") {
      next.sort((a, b) => (a.customCaption ?? "").localeCompare(b.customCaption ?? ""));
    }
    return next;
  }, [binder.data?.items, sort]);

  async function deleteItem(item: BinderItem) {
    await api.deleteBinderItem(item.id);
    toast.success("Removed from Binder.");
    setSelected(null);
    await binder.refetch();
  }

  return (
    <AppPageShell
      title="My Binder"
      description="Saved photocards and generations are collected here."
      image="/illustrations/empty-binder.png"
    >
      {!auth.isAuthenticated && (
        <div className="border border-idol-gold p-5">
          <h2 className="text-2xl font-semibold">Sign in to save cards</h2>
          <p className="mt-2 text-sm text-gray-600">
            Guest generations can be shared, but Binder storage requires a session.
          </p>
          <a
            href={getGoogleAuthUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="idol-button-square mt-4 inline-flex"
          >
            Sign in with Google
          </a>
        </div>
      )}

      <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-3">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">By date</SelectItem>
              <SelectItem value="caption">By caption</SelectItem>
              <SelectItem value="member">By member</SelectItem>
            </SelectContent>
          </Select>
          <button className="border border-black/10 px-4 py-2 text-sm text-idol-gold">
            All formats
          </button>
          <button className="border border-black/10 px-4 py-2 text-sm">All members</button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => toast.info("Print PDF is coming in Pro.")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => setDense((value) => !value)}>
            {dense ? <Grid3X3 className="mr-2 h-4 w-4" /> : <LayoutGrid className="mr-2 h-4 w-4" />}
            Grid
          </Button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border border-black/10 p-4">
        <div>
          <p className="font-semibold">Make this binder public</p>
          <p className="text-sm text-gray-600">Public handle links resolve at /binder/:handle.</p>
        </div>
        <Switch checked={publicBinder} onCheckedChange={setPublicBinder} />
      </div>

      <div
        className={`mt-8 grid gap-3 ${dense ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-4"}`}
      >
        {binder.isLoading && (
          <div className="col-span-full">
            <LoadingSkeleton rows={4} />
          </div>
        )}
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="border border-black/10 text-left"
            >
              {item.outputUrl ? (
                <ImageFrame
                  src={item.outputUrl}
                  alt=""
                  ratio="portrait"
                  interactive
                  className="rounded-none border-0 shadow-none"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-gray-100">
                  <Image className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <p className="truncate p-3 text-sm font-semibold">
                {item.customCaption ?? "Untitled card"}
              </p>
            </button>
          ))
        ) : !binder.isLoading ? (
          <Link to="/selca" className="col-span-full border border-black/10 p-8 text-center">
            <ImageFrame
              src="/illustrations/empty-binder.png"
              alt=""
              ratio="square"
              className="mx-auto h-40 w-40 shadow-none"
            />
            <p className="mt-4 font-semibold">Create your first Binder item</p>
          </Link>
        ) : null}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.customCaption ?? "Binder item"}</DialogTitle>
            <DialogDescription>
              Re-share, regenerate, edit caption, or remove this saved item.
            </DialogDescription>
          </DialogHeader>
          {selected?.outputUrl && (
            <img src={selected.outputUrl} alt="" className="max-h-[70vh] w-full object-contain" />
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => toast.info("Caption editing is coming next.")}>
              Edit caption
            </Button>
            <Button variant="outline" asChild>
              <Link to="/selca">Re-generate</Link>
            </Button>
            {selected && (
              <Button variant="destructive" onClick={() => deleteItem(selected)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
