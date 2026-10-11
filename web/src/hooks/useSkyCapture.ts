/**
 * Custom hook encapsulating camera capture, file selection, drag-and-drop, and orientation management.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { CameraError } from '../utils/errors'

export type SkyOrientation = 'zenith' | 'horizon' | 'auto'

export interface UseSkyCaptureReturn {
  selectedFile: File | null
  previewUrl: string | null
  isDragging: boolean
  orientationMode: SkyOrientation
  rotationAngle: number
  fileInputRef: React.RefObject<HTMLInputElement>
  cameraError: string | null
  setOrientationMode: (mode: SkyOrientation) => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: () => void
  handleDrop: (e: React.DragEvent) => void
  rotateImage: () => void
  startCamera: () => Promise<void>
  resetCapture: () => void
}

export function useSkyCapture(): UseSkyCaptureReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [orientationMode, setOrientationMode] = useState<SkyOrientation>('horizon')
  const [rotationAngle, setRotationAngle] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPG, PNG, WebP).')
      return
    }
    setCameraError(null)
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setRotationAngle(0)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const rotateImage = () => {
    setRotationAngle((prev) => (prev + 90) % 360)
  }

  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new CameraError('Camera access is not supported on this device/browser', 'not_supported')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false,
      })
      // Stop stream tracks immediately since we invoke system camera intent via file input
      stream.getTracks().forEach((track) => track.stop())
      fileInputRef.current?.click()
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. You can still browse and upload a sky photo.')
      } else {
        // Fallback to file picker
        fileInputRef.current?.click()
      }
    }
  }

  const resetCapture = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setRotationAngle(0)
    setCameraError(null)
  }

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return {
    selectedFile,
    previewUrl,
    isDragging,
    orientationMode,
    rotationAngle,
    fileInputRef,
    cameraError,
    setOrientationMode,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    rotateImage,
    startCamera,
    resetCapture,
  }
}
