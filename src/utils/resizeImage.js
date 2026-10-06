export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This file could not be read as an image.'))
    }

    image.src = url
  })

export const validateImageFile = (file) => {
  if (!file) {
    return 'No file selected.'
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a PNG, JPG, WEBP or GIF image.'
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image is too large. Maximum size is 5 MB.'
  }

  return null
}

export const resizeImageToSquare = async (file, size = 256) => {
  const image = await loadImage(file)

  const side = Math.min(image.naturalWidth, image.naturalHeight)
  const sourceX = (image.naturalWidth - side) / 2
  const sourceY = (image.naturalHeight - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size)

  const webp = canvas.toDataURL('image/webp', 0.85)

  if (webp.startsWith('data:image/webp')) {
    return webp
  }

  return canvas.toDataURL('image/jpeg', 0.85)
}
