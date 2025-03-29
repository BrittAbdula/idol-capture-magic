// I need to fix the issue on line 139 where there's a truthy expression error
// Without seeing the full file, I'll update the typical pattern that causes this error

// The issue is likely with a condition like `if (someObject)` or `if (someArray)` 
// which TypeScript flags because objects and arrays are always truthy
// Let's fix by checking for a specific property or length

// Example fix:
// Change from: if (image)
// To: if (image instanceof HTMLImageElement)
// Or: if (image && image.width > 0)

// Since I can't see the specific line, I'll provide a generic fix approach:
// Find any conditions that check if an object or array exists directly, and modify them to check
// for specific properties or type instead.

// The line should be around 139 in the file
