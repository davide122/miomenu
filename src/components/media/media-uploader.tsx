"use client"

import Image from "next/image"
import { useId, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/cn"

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "error"; message: string }

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

export function MediaUploader({
  label,
  description,
  accept,
  mode = "auto",
  maxVideoSeconds,
  previewFit = "cover",
  nameUrl,
  nameType,
  defaultUrl,
  defaultType,
  businessId,
  onChange
}: {
  label: string
  description?: string
  accept: string
  mode?: "auto" | "image" | "video"
  maxVideoSeconds?: number
  previewFit?: "cover" | "contain"
  nameUrl: string
  nameType?: string
  defaultUrl?: string | null
  defaultType?: "IMAGE" | "VIDEO"
  businessId?: string
  onChange?: (value: { url: string; type: "IMAGE" | "VIDEO" } | null) => void
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [valueUrl, setValueUrl] = useState<string>(defaultUrl ?? "")
  const [valueType, setValueType] = useState<"IMAGE" | "VIDEO">(
    defaultType ?? "IMAGE"
  )
  const [dragOver, setDragOver] = useState(false)
  const [state, setState] = useState<UploadState>({ status: "idle" })

  const hasValue = valueUrl.trim().length > 0
  const previewKind = useMemo(() => {
    if (!hasValue) return null
    if (mode === "video") return "video"
    if (mode === "image") return "image"
    if (valueType === "VIDEO" || isVideoUrl(valueUrl)) return "video"
    return "image"
  }, [hasValue, mode, valueType, valueUrl])

  async function readVideoDurationSeconds(file: File) {
    const objectUrl = URL.createObjectURL(file)
    try {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.src = objectUrl
      video.muted = true
      video.playsInline = true

      const duration = await new Promise<number>((resolve, reject) => {
        video.onloadedmetadata = () => resolve(video.duration)
        video.onerror = () => reject(new Error("Impossibile leggere il video."))
      })

      if (!Number.isFinite(duration)) {
        throw new Error("Durata video non valida.")
      }

      return duration
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  async function upload(file: File) {
    setState({ status: "uploading" })

    const isVideo = file.type.startsWith("video/")
    let durationSeconds: number | undefined
    if (isVideo && typeof maxVideoSeconds === "number") {
      try {
        durationSeconds = await readVideoDurationSeconds(file)
      } catch (e) {
        setState({
          status: "error",
          message: (e as Error).message || "Impossibile leggere il video."
        })
        return
      }

      if (durationSeconds > maxVideoSeconds) {
        setState({
          status: "error",
          message: `Video troppo lungo. Massimo ${maxVideoSeconds} secondi.`
        })
        return
      }
    }

    async function uploadDirect() {
      const fd = new FormData()
      fd.set("file", file)
      if (businessId) fd.set("businessId", businessId)
      if (typeof durationSeconds === "number") {
        fd.set("durationSeconds", String(durationSeconds))
      }

      const res = await fetch("/api/uploads/direct", {
        method: "POST",
        body: fd
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setState({
          status: "error",
          message:
            data?.error ??
            "Non riesco a caricare questo file. Riprova o scegli un file diverso."
        })
        return
      }

      const data = (await res.json()) as {
        publicUrl: string
        mediaType: "IMAGE" | "VIDEO"
      }

      setValueUrl(data.publicUrl)
      setValueType(data.mediaType)
      onChange?.({ url: data.publicUrl, type: data.mediaType })
      setState({ status: "idle" })
    }

    const presign = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        durationSeconds,
        businessId
      })
    })

    if (!presign.ok) {
      await uploadDirect()
      return
    }

    const data = (await presign.json()) as {
      uploadUrl: string
      publicUrl: string
      mediaType: "IMAGE" | "VIDEO"
    }

    try {
      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file
      })
      if (!put.ok) {
        await uploadDirect()
        return
      }
    } catch {
      await uploadDirect()
      return
    }

    setValueUrl(data.publicUrl)
    setValueType(data.mediaType)
    onChange?.({ url: data.publicUrl, type: data.mediaType })
    setState({ status: "idle" })
  }

  function onPickClick() {
    if (state.status === "uploading") return
    inputRef.current?.click()
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    const file = files[0]
    await upload(file)
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
          {description ? (
            <p className="mt-1 text-xs text-muted">{description}</p>
          ) : null}
        </div>
        {hasValue ? (
          <button
            type="button"
            onClick={() => {
              if (state.status === "uploading") return
              setValueUrl("")
              setValueType("IMAGE")
              onChange?.(null)
              setState({ status: "idle" })
            }}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted"
          >
            Rimuovi
          </button>
        ) : null}
      </div>

      <input type="hidden" name={nameUrl} value={valueUrl} />
      {nameType ? <input type="hidden" name={nameType} value={valueType} /> : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border bg-surface shadow-soft",
          dragOver ? "border-[color:var(--accent)]/35" : undefined
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setDragOver(false)
          await onFiles(e.dataTransfer.files)
        }}
      >
        {previewKind ? (
          <div className="grid gap-3 p-4">
            {previewKind === "image" ? (
              <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-border bg-surface-muted">
                <Image
                  src={valueUrl}
                  alt="Anteprima"
                  fill
                  className={cn(
                    previewFit === "contain" ? "object-contain p-3" : "object-cover"
                  )}
                  sizes="(max-width: 640px) 100vw, 640px"
                  unoptimized
                />
              </div>
            ) : (
              <video
                src={valueUrl}
                className={cn(
                  "h-44 w-full rounded-2xl border border-border bg-surface-muted",
                  previewFit === "contain" ? "object-contain" : "object-cover"
                )}
                muted
                controls
                playsInline
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-muted">{valueUrl}</p>
              <button
                type="button"
                onClick={onPickClick}
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted"
              >
                Sostituisci
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 p-4">
            <div className="rounded-3xl border border-border bg-surface-muted p-6">
              <p className="text-sm font-semibold">Trascina qui un file</p>
              <p className="mt-1 text-sm text-muted">
                oppure selezionalo dal computer.
              </p>
              <button
                type="button"
                onClick={onPickClick}
                disabled={state.status === "uploading"}
                className="mt-4 h-11 rounded-xl border border-border bg-surface px-4 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted disabled:opacity-50"
              >
                {state.status === "uploading" ? "Caricamento..." : "Scegli file"}
              </button>
            </div>

            {state.status === "error" ? (
              <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
                {state.message}
              </div>
            ) : null}
          </div>
        )}

        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (e) => {
            await onFiles(e.target.files)
            e.currentTarget.value = ""
          }}
        />
      </div>
    </div>
  )
}
