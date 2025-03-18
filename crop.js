const imageInput = document.getElementById('imageInput');
const image = document.getElementById('image');
const aspectRatioSelect = document.getElementById('aspectRatio');
const croppedPreview = document.getElementById('croppedPreview');
const croppedDimensions = document.getElementById('croppedDimensions');
const downloadButton = document.getElementById('downloadButton');
const warning = document.getElementById('warning');
let cropper;
let debounceTimeout;

// Handle image input and initialize Cropper.js
imageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    // Warn user if file size exceeds 2 MB
    if (file.size > 2 * 1024 * 1024) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      image.src = e.target.result;
      image.style.display = 'block';
      if (cropper) {
        cropper.destroy();
      }
      cropper = new Cropper(image, {
        aspectRatio: NaN, // Default to freeform
        viewMode: 1,
        scalable: true,
        crop(event) {
          // Lazy load live preview with debounce for large images
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            const canvas = cropper.getCroppedCanvas();

            if (canvas) {
              if (aspectRatioSelect.value === 'circle') {
                // Create a circular mask on the canvas
                const ctx = canvas.getContext('2d');
                const circleCanvas = document.createElement('canvas');
                circleCanvas.width = canvas.width;
                circleCanvas.height = canvas.height;

                const circleCtx = circleCanvas.getContext('2d');
                circleCtx.beginPath();
                circleCtx.arc(
                  canvas.width / 2,
                  canvas.height / 2,
                  Math.min(canvas.width, canvas.height) / 2,
                  0,
                  2 * Math.PI
                );
                circleCtx.clip();
                circleCtx.drawImage(canvas, 0, 0);

                croppedPreview.src = circleCanvas.toDataURL('image/png');
              } else {
                croppedPreview.src = canvas.toDataURL('image/png');
              }

              // Display cropped dimensions
              croppedDimensions.textContent = `Dimensions: ${Math.round(event.detail.width)} x ${Math.round(event.detail.height)} px`;
            }
          }, file.size > 2 * 1024 * 1024 ? 300 : 50); // Adjust delay based on file size
        },
      });
    };
    reader.readAsDataURL(file);
  }
});

// Change aspect ratio dynamically
aspectRatioSelect.addEventListener('change', (event) => {
  const ratio = event.target.value;
  if (cropper) {
    if (ratio === 'circle') {
      cropper.setAspectRatio(1); // Ensure the crop box is square
    } else {
      cropper.setAspectRatio(parseFloat(ratio));
    }
  }
});
// Select the dark mode toggle button
const darkModeToggle = document.getElementById('darkModeToggle');

// Toggle dark mode on button click
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Download cropped image
downloadButton.addEventListener('click', () => {
  const canvas = cropper.getCroppedCanvas();
  if (canvas) {
    let finalCanvas = canvas;

    if (aspectRatioSelect.value === 'circle') {
      // Apply circular masking before download
      const circleCanvas = document.createElement('canvas');
      circleCanvas.width = canvas.width;
      circleCanvas.height = canvas.height;

      const circleCtx = circleCanvas.getContext('2d');
      circleCtx.beginPath();
      circleCtx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2,
        0,
        2 * Math.PI
      );
      circleCtx.clip();
      circleCtx.drawImage(canvas, 0, 0);

      finalCanvas = circleCanvas;
    }

    const croppedImage = finalCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = 'cropped-image.png';
    link.click();
  }
});