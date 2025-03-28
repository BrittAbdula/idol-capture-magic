
# Photo Strip Specifications

## Canvas Dimensions & Properties

The photo strip dimensions are calculated dynamically based on:
- The aspect ratio of the uploaded/captured photos
- The number of photos in the strip
- The desired margins and padding

### Optimal Settings by Aspect Ratio

| Aspect Ratio | Strip Width | Side Margin | Top Margin | Padding Between Photos |
|--------------|-------------|-------------|------------|------------------------|
| 1:1 (Square) | 400px       | 40px        | 40px       | 20px                   |
| 4:3          | 450px       | 35px        | 35px       | 20px                   |
| 3:2          | 480px       | 35px        | 35px       | 20px                   |
| 16:9         | 520px       | 30px        | 30px       | 20px                   |
| 9:16         | 380px       | 25px        | 25px       | 20px                   |

### Adjustments

- Padding is reduced to 15px when there are more than 3 photos
- Padding is increased to 30px when there are 2 or fewer photos
- Photo dimensions are scaled proportionally to fit within the strip width
- A white border of 5px is added around each photo

## Text Rendering

### Caption Text
- Position: Bottom of the strip
- Font: Sans-serif, bold
- Size: 24-28px (scaled based on strip size)
- Color: White on dark backgrounds, black on light backgrounds

### Date Display
- Position: Below caption
- Font: Monospace
- Size: 16-20px (scaled based on strip size)
- Color: Semi-transparent white/black depending on background

### Branding
- Text: "IdolBooth"
- Position: Bottom of strip
- Font: Sans-serif, bold
- Size: 22-26px (scaled based on strip size)
- Color: White on dark backgrounds, black on light backgrounds

## Photo Processing

- Photos maintain their original aspect ratio
- No filters are applied in the final rendering
- White borders surround each photo for a classic photo booth look
- Photos are centered horizontally within the strip
