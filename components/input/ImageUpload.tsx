"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface ImageUploadProps {
    onUpload: (file: File) => void
    label?: string
}

export function ImageUpload({ onUpload, label }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            onUpload(file)
        }
    }

    const clear = () => {
        setPreview(null)
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-white/80">{label}</label>}

            <div
                className={cn(
                    "border-2 border-dashed border-white/20 rounded-xl p-8 transition-colors text-center cursor-pointer hover:bg-white/5",
                    preview ? "border-solid border-white/10 p-2" : ""
                )}
                onClick={() => !preview && inputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {preview ? (
                    <div className="relative">
                        <img src={preview} alt="Preview" className="w-full h-auto rounded-lg max-h-[300px] object-cover" />
                        <Button
                            size="sm"
                            variant="danger"
                            className="absolute top-2 right-2 rounded-full p-1 h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                clear();
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/50">
                        <Upload className="h-8 w-8" />
                        <p className="text-sm">Click or drag image to upload</p>
                    </div>
                )}
            </div>
        </div>
    )
}
