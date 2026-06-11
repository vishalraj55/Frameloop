"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ImagePlus, ChevronLeft } from "lucide-react";

type Step = "select" | "edit" | "details";

type FilterType =
  | "normal"
  | "grayscale"
  | "sepia"
  | "bright"
  | "contrast"
  | "cool"
  | "warm";

const filters: Record<FilterType, string> = {
  normal: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(80%)",
  bright: "brightness(1.2)",
  contrast: "contrast(1.4)",
  cool: "hue-rotate(180deg)",
  warm: "hue-rotate(-20deg) saturate(1.3)",
};

interface CropState {
  scale: number;
  x: number;
  y: number;
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const frameRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("normal");
  const [crop, setCrop] = useState<CropState>({ scale: 1, x: 0, y: 0 });

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const cropAtDragStart = useRef<CropState>({ scale: 1, x: 0, y: 0 });

  // pinch state
  const lastPinchDist = useRef<number | null>(null);
  const scaleAtPinchStart = useRef(1);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setCrop({ scale: 1, x: 0, y: 0 });
    setStep("edit");
  }

  function handleBack() {
    if (step === "edit") {
      setFile(null);
      setPreview(null);
      setSelectedFilter("normal");
      setCrop({ scale: 1, x: 0, y: 0 });
      setStep("select");
    } else if (step === "details") {
      setStep("edit");
    }
  }

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragStart.current = { x: e.clientX, y: e.clientY };
      cropAtDragStart.current = crop;
    },
    [crop],
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setCrop((prev) => ({
      ...prev,
      x: cropAtDragStart.current.x + dx,
      y: cropAtDragStart.current.y + dy,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        dragStart.current = {
          x: e.touches[0]!.clientX,
          y: e.touches[0]!.clientY,
        };
        cropAtDragStart.current = crop;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
        scaleAtPinchStart.current = crop.scale;
        dragStart.current = null;
      }
    },
    [crop],
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0]!.clientX - dragStart.current.x;
      const dy = e.touches[0]!.clientY - dragStart.current.y;
      setCrop((prev) => ({
        ...prev,
        x: cropAtDragStart.current.x + dx,
        y: cropAtDragStart.current.y + dy,
      }));
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastPinchDist.current;
      const newScale = Math.min(
        4,
        Math.max(1, scaleAtPinchStart.current * ratio),
      );
      setCrop((prev) => ({ ...prev, scale: newScale }));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    dragStart.current = null;
    lastPinchDist.current = null;
  }, []);

  async function applyFilterToImage(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!preview) return reject();
      const img = new window.Image();
      img.src = preview;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject();
        const frameSize =
          frameRef.current?.getBoundingClientRect().width ?? window.innerWidth;
        const scaleX = img.width / frameSize;
        const scaleY = img.height / frameSize;

        const srcX = (-crop.x * scaleX) / crop.scale;
        const srcY = (-crop.y * scaleY) / crop.scale;
        const srcW = img.width / crop.scale;
        const srcH = img.height / crop.scale;

        ctx.filter = filters[selectedFilter];
        ctx.drawImage(
          img,
          srcX,
          srcY,
          srcW,
          srcH,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject();
            resolve(blob);
          },
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = reject;
    });
  }

  async function handlePost() {
    if (!file || !user?.uid) return;

    setPosting(true);
    setProgress(0);
    try {
      const filteredBlob = await applyFilterToImage();
      const finalFile = new File([filteredBlob], "post.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("image", finalFile);
      formData.append("caption", caption);
      formData.append("authorId", user.uid);

      const token = await user.getIdToken();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve();
          } else reject(new Error(`${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", "/api/posts");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      setTimeout(() => {
        setFile(null);
        setPreview(null);
        router.push("/feed");
      }, 400);
    } catch (err) {
      console.error("Upload failed:", err);
      setPosting(false);
      setProgress(0);
    }
  }

  if (step === "select") {
    return (
      <main className="bg-black min-h-screen text-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900">
          <span className="text-[15px] font-semibold">New Post</span>
        </div>
        <div className="px-4 py-8">
          <label className="flex flex-col items-center justify-center border border-neutral-800 rounded-2xl h-80 cursor-pointer hover:bg-neutral-900 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                <ImagePlus size={26} className="text-neutral-300" />
              </div>
              <span className="text-[15px] font-semibold">Select a photo</span>
              <span className="text-sm text-neutral-500">
                Tap to browse your gallery
              </span>
            </div>
          </label>
        </div>
      </main>
    );
  }

  if (step === "edit") {
    return (
      <main className="bg-black min-h-screen text-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900">
          <button onClick={handleBack}>
            <ChevronLeft size={24} />
          </button>
          <span className="text-[15px] font-semibold">Edit</span>
          <button
            onClick={() => setStep("details")}
            className="text-[15px] font-semibold text-[#0095f6]"
          >
            Next
          </button>
        </div>

        {/* 1:1 crop frame */}
        <div
          ref={frameRef}
          className="relative w-full overflow-hidden select-none"
          style={{ aspectRatio: "1/1", cursor: "grab", touchAction: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.scale})`,
                transformOrigin: "center",
                filter: filters[selectedFilter],
                transition: "none",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/40 text-[11px] pointer-events-none">
            Pinch to zoom · Drag to reposition
          </p>
        </div>

        {/* Filters */}
        <div className="px-4 pt-4 pb-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">
            Filter
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(Object.keys(filters) as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedFilter === f
                      ? "border-white scale-105"
                      : "border-transparent opacity-60"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview!}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: filters[f] }}
                  />
                </div>
                <span className="text-[11px] capitalize text-neutral-400">
                  {f}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (posting) {
    return (
      <main className="bg-black min-h-screen text-white flex flex-col items-center justify-center gap-6 px-8">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview!}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: filters[selectedFilter] }}
          />
        </div>
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-neutral-400 mb-2">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black min-h-screen text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900">
        <button onClick={handleBack}>
          <ChevronLeft size={24} />
        </button>
        <span className="text-[15px] font-semibold">New Post</span>
        <button
          onClick={() => void handlePost()}
          disabled={!user}
          className="text-[15px] font-semibold text-[#0095f6] disabled:opacity-40"
        >
          Share
        </button>
      </div>

      <div className="flex items-start gap-3 px-4 py-4 border-b border-neutral-900">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview!}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: filters[selectedFilter],
              transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.scale})`,
              transformOrigin: "center",
            }}
          />
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-600 resize-none outline-none pt-1"
          rows={4}
          maxLength={2200}
          autoFocus
        />
      </div>
      <div className="px-4 py-3 flex justify-end">
        <span className="text-xs text-neutral-600">{caption.length}/2200</span>
      </div>
    </main>
  );
}
