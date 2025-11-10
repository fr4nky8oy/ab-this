import { useRef } from 'react'
import './FileUpload.css'

function FileUpload({ label, file, onFileSelect, color }) {
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isAudioFile(droppedFile)) {
      onFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && isAudioFile(selectedFile)) {
      onFileSelect(selectedFile)
    }
  }

  const isAudioFile = (file) => {
    return file.type.startsWith('audio/') ||
           file.name.match(/\.(mp3|wav|flac|m4a|aac|ogg)$/i)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={`file-upload file-upload-${color}`}>
      <h3>{label}</h3>
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {file ? (
          <div className="file-info">
            <div className="file-icon">🎵</div>
            <div className="file-details">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
          </div>
        ) : (
          <div className="drop-prompt">
            <div className="upload-icon">📁</div>
            <p>Drop audio file here</p>
            <p className="hint">or click to browse</p>
            <p className="formats">MP3, WAV, FLAC, M4A</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
