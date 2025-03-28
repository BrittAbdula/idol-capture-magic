
# IdolBooth - User Flows

## Main User Journeys

### 1. Photo Strip Creation Flow

```
Landing Page → Photo Booth → Photo Result → Download/Share
```

#### Detailed Steps:

1. **User lands on the home page**
   - Views information about the application
   - Clicks "Create Photo Strip" or similar CTA

2. **User enters the photo booth**
   - Chooses capture method (webcam or upload)
   - For webcam:
     - Grants camera permissions
     - Takes up to 4 photos with countdown timer
   - For upload:
     - Selects image from device
     - Image is processed into photo strip format

3. **User views the photo result**
   - Sees preview of the generated photo strip
   - Customizes background color
   - Adds optional caption text
   - Toggles date display

4. **User exports their creation**
   - Downloads the photo strip as an image
   - Prints the photo strip
   - Shares via native sharing mechanism (if available)
   - Returns to photo booth to create another strip (optional)

### 2. Webcam Photo Capture Flow

```
Photo Booth → Grant Camera Permission → Preview → Capture Photos (×4) → Auto-advance to Results
```

### 3. Photo Upload Flow

```
Photo Booth → Select Photo → Upload → Auto-advance to Results
```

## Error Handling Flows

### Camera Permission Denied

```
Request Permission → Denied → Show Explanation → Offer Alternative (Upload)
```

### Upload Failure

```
Attempt Upload → Error → Show Error Message → Allow Retry
```

### Processing Failure

```
Process Photos → Error → Show Error Toast → Return to Previous State
```

## Edge Cases

- **No camera available**: User is automatically directed to upload option
- **Browser incompatibility**: User is shown a message with supported browsers
- **Connection issues**: Local processing ensures functionality continues
