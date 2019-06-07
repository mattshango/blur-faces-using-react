import React, { Component } from 'react';
import { createCanvas, loadImage } from 'canvas';


export default class BlurFaces extends Component {
    componentDidUpdate(prevProps) {
      const { image, threshold, data, smooth } = this.props;
      // If no data
      if(data.length < 1) return;

      // Output Canvas and Context
      const outputCanvas = this.refs.canvas;
      const outputCtx = outputCanvas.getContext('2d')
      
      // Hidden Canvas and Context
      const hiddenCanvas = createCanvas(image.width, image.height)
      const hiddenCtx = hiddenCanvas.getContext('2d')

      // If data, threshold and smooth is the same then clear and return (user has not clicked blur)
      if(JSON.stringify(prevProps.data) === JSON.stringify(data) && prevProps.threshold === threshold && prevProps.smooth === smooth) {
        outputCtx.clearRect(0,0, image.width, image.height);
        return;
      }

      // Load Image
      loadImage(image.uri).then((newImage) => {
        if(smooth){
          // New canvases for applying blurring and feathering (canvases for inverted mask of blurred images)
          const imaskCanvas = createCanvas(image.width, image.height);
          const imaskCtx = imaskCanvas.getContext('2d');
          const imaskCanvas2 = createCanvas(image.width, image.height);
          const imaskCtx2 = imaskCanvas2.getContext('2d');

          // Set global composite operation to destination in
          imaskCtx.globalCompositeOperation = "destination-in";
          
          // Draw blurred faces to inverted mask canvas (x,y,w,h are modified due to blurring and feathering)
          this.getFaces(data).forEach((face, i) => {
            // Determine the blur amount by width of face
            let blurAmount = threshold
            if(face.w >= 300) blurAmount = threshold*2.5 
            else if(face.w <= 30) blurAmount = threshold*0.25
        
            hiddenCtx.filter = `blur(${blurAmount}px)`; // Add blur filter
            hiddenCtx.drawImage(newImage, 0, 0, image.width, image.height); // Draw original image to hidden canvas
            imaskCtx.putImageData(hiddenCtx.getImageData(face.x-10, face.y-10, face.w+20, face.h+20), face.x-10, face.y-10) // Add blurred faces to blank canvas 
          })

          // Draw blurred faces onto 2nd inverted mask canvas 
          imaskCtx2.drawImage(imaskCanvas, 0, 0);
          imaskCtx2.shadowColor = "black"; // Required for feathering
          imaskCtx2.shadowBlur = 30;
          imaskCtx2.globalCompositeOperation = "destination-in";

          // Feathering
          imaskCtx2.shadowBlur = 20; 
          imaskCtx2.drawImage(imaskCanvas,0,0);
          imaskCtx2.shadowBlur = 10; 
          imaskCtx2.drawImage(imaskCanvas,0,0);  

          // Clear visible canvas then draw orignal image to it and then add the blurred images
          outputCtx.clearRect(0,0, image.width, image.height);
          outputCtx.drawImage(newImage, 0, 0);
          outputCtx.drawImage(imaskCanvas2, 0, 0);
        } else {
          // For pixelation
          hiddenCanvas.style.cssText = 'image-rendering: optimizeSpeed;' + // FireFox < 6.0
          'image-rendering: -moz-crisp-edges;' + // FireFox
          'image-rendering: -o-crisp-edges;' +  // Opera
          'image-rendering: -webkit-crisp-edges;' + // Chrome
          'image-rendering: crisp-edges;' + // Chrome
          'image-rendering: -webkit-optimize-contrast;' + // Safari
          'image-rendering: pixelated; ' + // Future browsers
          '-ms-interpolation-mode: nearest-neighbor;'; // IE

          // Use nearest-neighbor scaling when images are resized instead of the resizing algorithm to create blur
          hiddenCtx.webkitImageSmoothingEnabled = false;
          hiddenCtx.mozImageSmoothingEnabled = false;
          hiddenCtx.msImageSmoothingEnabled = false;
          hiddenCtx.imageSmoothingEnabled = false;
        
          // We'll be pixelating the image by threshold
          let percent = 0;
          // Set threshold to 9.8 if it's 10 so the blurred faces aren't rendered white
          threshold === 10 ? 
            percent = 1 - (9.8 / 10): 
            percent = 1 - (threshold / 10); 
          
          // Calculate the scaled dimensions
          const scaledWidth = image.width * percent;
          const scaledHeight = image.height * percent;

          // Render image smaller
          hiddenCtx.drawImage(newImage, 0, 0, scaledWidth, scaledHeight);

          // Stretch the smaller image onto larger context
          hiddenCtx.drawImage(hiddenCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, image.width, image.height);

          // Clear visible canvas and draw original image to it
          outputCtx.clearRect(0,0, image.width, image.height);
          outputCtx.drawImage(newImage, 0, 0);

          // Draw pixelated faces to canvas
          this.getFaces(data).forEach(face => outputCtx.putImageData(hiddenCtx.getImageData(face.x, face.y, face.w, face.h), face.x, face.y))
        }
      }).catch(err => {
        console.log(err)
      })
    }

    getFaces(data) {
      return data.map(face => ({
        x: face.upperLeft.x,
        y: face.upperLeft.y,
        w: face.lowerRight.x - face.upperLeft.x,
        h: face.lowerRight.y - face.upperLeft.y
      }))
    }

    render() {
      const { width, height } = this.props.image;
      return (
        <div>
          <p><strong>Output</strong></p>  
          <canvas 
            ref="canvas" 
            width={width} 
            height={height} 
            style={{maxWidth: "100%", maxHeight: "auto"}} 
          />
        </div>    
      )
    }
}

BlurFaces.defaultProps = {
  image: {
    uri: "",
    width: 0,
    height: 0
  },
  threshold: 0,
  data: [],
  smooth: true
}
