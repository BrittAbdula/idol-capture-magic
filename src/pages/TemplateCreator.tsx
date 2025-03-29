
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Image as ImageIcon, 
  Layout, 
  PanelLeft, 
  Move, 
  SquareStack, 
  Palette, 
  Download, 
  Plus, 
  Trash, 
  ArrowRight, 
  PenTool, 
  Sliders, 
  Settings, 
  Save
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Template } from '../contexts/PhotoStripContext';
import PhotoStrip from '../components/PhotoStrip';

interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

const TemplateCreator: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('layout');
  const [samplePhotos, setSamplePhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState("Normal");
  
  // Template data
  const [templateName, setTemplateName] = useState('my-custom-template');
  const [templateCategory, setTemplateCategory] = useState('custom');
  const [photoAspectRatio, setPhotoAspectRatio] = useState('4:3');
  const [photoCount, setPhotoCount] = useState(4);
  const [countdown, setCountdown] = useState(3);
  const [enableSound, setEnableSound] = useState(false);
  const [lightColor, setLightColor] = useState('#FFD700');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 });
  
  // Photo positions
  const [photoPositions, setPhotoPositions] = useState<PhotoPosition[]>([
    { id: '1', x: 100, y: 100, width: 250, height: 200 },
    { id: '2', x: 400, y: 100, width: 250, height: 200 },
    { id: '3', x: 100, y: 350, width: 250, height: 200 },
    { id: '4', x: 400, y: 350, width: 250, height: 200 }
  ]);
  
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  
  // Decoration elements
  const [decorations, setDecorations] = useState<any[]>([]);
  
  // Generate sample images for preview
  useEffect(() => {
    const generateSampleImages = () => {
      // In a real app, you'd use actual placeholder images - using color blocks for simplicity
      const colors = ['#FFC0CB', '#87CEEB', '#98FB98', '#FFA07A', '#DDA0DD', '#B0E0E6'];
      const newSamplePhotos = Array(photoCount).fill(0).map((_, i) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Sample Photo ${i + 1}`, canvas.width / 2, canvas.height / 2);
        }
        return canvas.toDataURL();
      });
      
      setSamplePhotos(newSamplePhotos);
    };
    
    generateSampleImages();
  }, [photoCount]);
  
  // Update photo positions when photo count changes
  useEffect(() => {
    adjustPhotoPositions();
  }, [photoCount]);
  
  const adjustPhotoPositions = () => {
    // Simple algorithm to lay out photos in a grid
    const containerWidth = canvasSize.width;
    const containerHeight = canvasSize.height;
    
    const cols = photoCount <= 2 ? 1 : 2;
    const rows = Math.ceil(photoCount / cols);
    
    const photoWidth = (containerWidth * 0.8) / cols;
    const photoHeight = (containerHeight * 0.8) / rows;
    const spacing = 20;
    
    const newPositions: PhotoPosition[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const x = (col * (photoWidth + spacing)) + (containerWidth * 0.1);
      const y = (row * (photoHeight + spacing)) + (containerHeight * 0.1);
      
      newPositions.push({
        id: (i + 1).toString(),
        x,
        y,
        width: photoWidth,
        height: photoHeight
      });
    }
    
    setPhotoPositions(newPositions);
  };
  
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return; // Only left mouse button
    
    setIsDragging(true);
    setDraggedItem(id);
    setSelectedPosition(id);
    
    // Prevent default behavior
    e.preventDefault();
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedItem || !canvasRef.current) return;
    
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - canvasBounds.left;
    const offsetY = e.clientY - canvasBounds.top;
    
    setPhotoPositions(positions => 
      positions.map(pos => 
        pos.id === draggedItem
          ? { ...pos, x: offsetX - pos.width / 2, y: offsetY - pos.height / 2 }
          : pos
      )
    );
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };
  
  const handleResizePosition = (id: string, size: { width: number, height: number }) => {
    setPhotoPositions(positions => 
      positions.map(pos => 
        pos.id === id
          ? { ...pos, ...size }
          : pos
      )
    );
  };
  
  const saveTemplate = () => {
    // Create template object
    const template: Template = {
      templateId: templateName,
      category: templateCategory,
      aspectRatio: photoAspectRatio,
      resolution: {
        width: 960,
        height: 720
      },
      countdown,
      photoNum: photoCount,
      filter: currentFilter,
      lightColor,
      idolOverlay: decorations.length > 0 ? {
        url: "/placeholder.svg", // Would be real URL in production
        position: {
          x: 50,
          y: 100
        },
        scale: 1.2
      } : undefined,
      sound: enableSound
    };
    
    // In a real app, you would send this to your backend
    // For now, we'll just pretend it worked
    console.log('Saving template:', template);
    
    toast.success('Template saved successfully!');
    
    // Navigate to the photo booth with this template
    navigate(`/photo-booth?template=${templateName}`);
  };
  
  const exportTemplateJSON = () => {
    const templateData = {
      templateId: templateName,
      category: templateCategory,
      aspectRatio: photoAspectRatio,
      photoNum: photoCount,
      countdown,
      photoPositions: photoPositions.map(({id, ...rest}) => rest),
      decorations,
      enableSound,
      lightColor,
      filter: currentFilter
    };
    
    const dataStr = JSON.stringify(templateData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${templateName}.json`);
    linkElement.click();
    
    toast.success('Template exported to JSON file');
  };
  
  const renderPreviewCanvas = () => {
    return (
      <div 
        ref={canvasRef}
        className="relative bg-white border rounded-lg shadow-sm overflow-hidden"
        style={{ 
          width: `${canvasSize.width}px`, 
          height: `${canvasSize.height}px`,
          maxWidth: '100%',
          maxHeight: '70vh',
          margin: '0 auto'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {photoPositions.slice(0, photoCount).map((position, index) => (
          <div
            key={position.id}
            className={`absolute cursor-move bg-gray-100 border-2 ${selectedPosition === position.id ? 'border-primary' : 'border-gray-300'}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
              zIndex: selectedPosition === position.id ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, position.id)}
            onClick={() => setSelectedPosition(position.id)}
          >
            {samplePhotos[index] ? (
              <img 
                src={samplePhotos[index]} 
                alt={`Position ${index + 1}`} 
                className={`w-full h-full object-cover ${currentFilter !== 'Normal' ? getFilterClass(currentFilter) : ''}`}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <ImageIcon className="text-gray-400" />
              </div>
            )}
            
            {selectedPosition === position.id && (
              <div className="absolute -bottom-8 left-0 flex items-center space-x-2 bg-white p-1 rounded border shadow-sm">
                <input 
                  type="number" 
                  value={Math.round(position.width)} 
                  onChange={(e) => handleResizePosition(position.id, { width: parseInt(e.target.value), height: position.height })}
                  className="w-14 text-xs p-1 border rounded"
                  min={50}
                />
                <span className="text-xs">×</span>
                <input 
                  type="number" 
                  value={Math.round(position.height)} 
                  onChange={(e) => handleResizePosition(position.id, { width: position.width, height: parseInt(e.target.value) })}
                  className="w-14 text-xs p-1 border rounded"
                  min={50}
                />
              </div>
            )}
          </div>
        ))}
        
        {decorations.map((decoration, index) => (
          <div 
            key={`decoration-${index}`}
            className="absolute border-2 border-dashed border-gray-300"
            style={{
              left: `${decoration.position.x}px`,
              top: `${decoration.position.y}px`,
              width: `${decoration.width || 100}px`,
              height: `${decoration.height || 100}px`
            }}
          >
            <div className="flex items-center justify-center w-full h-full">
              <PenTool className="text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const getFilterClass = (filter: string) => {
    switch (filter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness-90 contrast-110';
      case 'B&W': return 'grayscale';
      case 'Dramatic': return 'contrast-125 brightness-90';
      default: return '';
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-montserrat">Create Your Custom Template</h1>
            <p className="text-gray-600 mt-2">
              Design your own photo template by arranging photo frames and customizing options
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Editor Tools */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="layout" className="py-2 px-1">
                        <Layout className="h-4 w-4 mr-1" />
                        <span className="sr-only sm:not-sr-only sm:text-xs">Layout</span>
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="py-2 px-1">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        <span className="sr-only sm:not-sr-only sm:text-xs">Photos</span>
                      </TabsTrigger>
                      <TabsTrigger value="decorations" className="py-2 px-1">
                        <PenTool className="h-4 w-4 mr-1" />
                        <span className="sr-only sm:not-sr-only sm:text-xs">Decor</span>
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="py-2 px-1">
                        <Settings className="h-4 w-4 mr-1" />
                        <span className="sr-only sm:not-sr-only sm:text-xs">Settings</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="layout" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input 
                          value={templateName} 
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="my-custom-template"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input 
                          value={templateCategory} 
                          onChange={(e) => setTemplateCategory(e.target.value)}
                          placeholder="custom"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Photo Count</Label>
                        <Select 
                          value={photoCount.toString()} 
                          onValueChange={(value) => setPhotoCount(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select photo count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Photo</SelectItem>
                            <SelectItem value="2">2 Photos</SelectItem>
                            <SelectItem value="3">3 Photos</SelectItem>
                            <SelectItem value="4">4 Photos</SelectItem>
                            <SelectItem value="6">6 Photos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Aspect Ratio</Label>
                        <Select 
                          value={photoAspectRatio} 
                          onValueChange={setPhotoAspectRatio}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                            <SelectItem value="3:2">3:2 (Classic)</SelectItem>
                            <SelectItem value="4:5">4:5 (Portrait)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Canvas Size</Label>
                        <div className="flex space-x-2">
                          <Input 
                            type="number"
                            value={canvasSize.width}
                            onChange={(e) => setCanvasSize({...canvasSize, width: parseInt(e.target.value)})}
                            className="w-24"
                          />
                          <span className="flex items-center">×</span>
                          <Input 
                            type="number"
                            value={canvasSize.height}
                            onChange={(e) => setCanvasSize({...canvasSize, height: parseInt(e.target.value)})}
                            className="w-24"
                          />
                        </div>
                      </div>
                      
                      <Button onClick={adjustPhotoPositions} className="w-full">
                        Auto-arrange Photos
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="photos" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default Filter</Label>
                        <Select 
                          value={currentFilter} 
                          onValueChange={setCurrentFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Warm">Warm</SelectItem>
                            <SelectItem value="Cool">Cool</SelectItem>
                            <SelectItem value="Vintage">Vintage</SelectItem>
                            <SelectItem value="B&W">Black & White</SelectItem>
                            <SelectItem value="Dramatic">Dramatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedPosition && (
                        <div className="bg-gray-50 p-3 rounded-md border">
                          <h3 className="font-medium text-sm mb-2">Photo Frame #{selectedPosition} Settings</h3>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">X Position</Label>
                                <Input 
                                  type="number"
                                  value={Math.round(photoPositions.find(p => p.id === selectedPosition)?.x || 0)}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setPhotoPositions(positions => 
                                      positions.map(pos => 
                                        pos.id === selectedPosition
                                          ? { ...pos, x: value }
                                          : pos
                                      )
                                    );
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Y Position</Label>
                                <Input 
                                  type="number"
                                  value={Math.round(photoPositions.find(p => p.id === selectedPosition)?.y || 0)}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setPhotoPositions(positions => 
                                      positions.map(pos => 
                                        pos.id === selectedPosition
                                          ? { ...pos, y: value }
                                          : pos
                                      )
                                    );
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Width</Label>
                                <Input 
                                  type="number"
                                  value={Math.round(photoPositions.find(p => p.id === selectedPosition)?.width || 0)}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setPhotoPositions(positions => 
                                      positions.map(pos => 
                                        pos.id === selectedPosition
                                          ? { ...pos, width: value }
                                          : pos
                                      )
                                    );
                                  }}
                                  className="h-8 text-sm"
                                  min={50}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Height</Label>
                                <Input 
                                  type="number"
                                  value={Math.round(photoPositions.find(p => p.id === selectedPosition)?.height || 0)}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setPhotoPositions(positions => 
                                      positions.map(pos => 
                                        pos.id === selectedPosition
                                          ? { ...pos, height: value }
                                          : pos
                                      )
                                    );
                                  }}
                                  className="h-8 text-sm"
                                  min={50}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 italic mt-2">
                        Tip: Click a photo frame to select it, then drag to reposition or use the controls to resize.
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="decorations" className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full text-sm"
                        onClick={() => {
                          setDecorations([
                            ...decorations,
                            {
                              type: 'sticker',
                              url: '/placeholder.svg',
                              position: { x: 200, y: 200 },
                              width: 100,
                              height: 100,
                              scale: 1.0
                            }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Decoration
                      </Button>
                      
                      {decorations.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {decorations.map((decoration, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="text-sm">{decoration.type} #{index + 1}</div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setDecorations(decorations.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-500 py-4">
                          No decorations added yet
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="settings" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Countdown Time</Label>
                        <Select 
                          value={countdown.toString()} 
                          onValueChange={(value) => setCountdown(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select countdown time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Second</SelectItem>
                            <SelectItem value="3">3 Seconds</SelectItem>
                            <SelectItem value="5">5 Seconds</SelectItem>
                            <SelectItem value="10">10 Seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-effect">Camera Sound</Label>
                        <Switch
                          id="sound-effect"
                          checked={enableSound}
                          onCheckedChange={setEnableSound}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Flash Light Color</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={lightColor}
                            onChange={(e) => setLightColor(e.target.value)}
                            className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer"
                          />
                          <Input
                            value={lightColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                                setLightColor(color);
                              }
                            }}
                            placeholder="#RRGGBB"
                            className="w-24"
                          />
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <Button 
                          onClick={exportTemplateJSON}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Template JSON
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Editor Canvas */}
            <div className="lg:col-span-6">
              <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    Drag frames to position them. Click a frame to select and adjust its properties.
                    <span className="px-2 py-1 ml-2 bg-gray-200 rounded text-xs">Template: {templateName}</span>
                  </p>
                </div>
                
                <div className="flex-grow overflow-auto">
                  {renderPreviewCanvas()}
                </div>
              </div>
            </div>
            
            {/* Right Sidebar - Preview */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Preview</h3>
                  
                  <div className="bg-white rounded-lg p-4 border mb-4">
                    <PhotoStrip 
                      images={samplePhotos.slice(0, photoCount)} 
                      filter={currentFilter}
                      showControls={false}
                    />
                  </div>
                  
                  <Button 
                    onClick={saveTemplate} 
                    className="w-full gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save & Test Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TemplateCreator;
