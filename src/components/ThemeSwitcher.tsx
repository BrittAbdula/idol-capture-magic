
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Heart, 
  Gamepad, 
  Sun, 
  ChevronsUpDown,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { 
      id: 'default', 
      name: '默认偶像风格', 
      icon: <Sun className="h-5 w-5" />,
      description: '金色主题，偶像聚光灯风格'
    },
    { 
      id: 'neonpop', 
      name: '霓虹炫彩风', 
      icon: <Sparkles className="h-5 w-5" />,
      description: '未来感、赛博朋克、夜店氛围'
    },
    { 
      id: 'millennial', 
      name: '甜酷千禧粉', 
      icon: <Heart className="h-5 w-5" />,
      description: '甜美、韩系、INS 风'
    },
    { 
      id: 'retro', 
      name: '复古赛博风', 
      icon: <Gamepad className="h-5 w-5" />,
      description: 'Y2K、90s 复古、电玩氛围'
    },
    { 
      id: 'minimal', 
      name: '日杂风 & 极简奶油风', 
      icon: <Sun className="h-5 w-5" />,
      description: '高级感、文艺、极简'
    }
  ];

  const currentTheme = themeOptions.find(t => t.id === theme) || themeOptions[0];

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId as any);
    toast.success(`主题已更改为 ${themeOptions.find(t => t.id === themeId)?.name}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-full"
        >
          <span className="sr-only">切换主题</span>
          {currentTheme.icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>外观主题</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => handleThemeChange(option.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                {option.icon}
                <span className="ml-2">{option.name}</span>
              </div>
              {theme === option.id && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
