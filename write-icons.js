const fs = require('fs');
const icons = [
  'Activity','AlertCircle','AlertTriangle','ArrowDownLeft','ArrowDownRight',
  'ArrowLeft','ArrowLeftRight','ArrowRight','ArrowRightLeft','ArrowUpRight',
  'BadgeCheck','Banknote','BarChart3','Bell','BellDot','BookOpen',
  'Boxes','Briefcase','Building2','Calendar','Calculator','Check',
  'CheckCircle','CheckCircle2','ChevronDown','ChevronLeft','ChevronRight',
  'ChevronUp','ChevronsLeft','ChevronsRight','ChevronsUpDown','Circle',
  'ClipboardList','Cloud','Clock','Columns','Command','Copy',
  'CornerDownLeft','CreditCard','Database','DollarSign','Download',
  'Edit2','Eye','EyeOff','ExternalLink','FileCheck2','FileClock',
  'FileJson','FileSpreadsheet','FileText','FileType','Filter',
  'Fingerprint','FolderKanban','Gauge','GitBranch','GitCompare',
  'GitMerge','Globe','Gift','Hash','HeartHandshake','HelpCircle',
  'History','Inbox','Info','Keyboard','Key','Landmark','LayoutDashboard',
  'LayoutGrid','Lightbulb','Link2','List','Loader2','Lock','LogOut',
  'Mail','MapPin','Menu','MessageSquare','Minus','Monitor','Moon',
  'MoreVertical','Package','Palette','PanelLeftClose','PanelLeftOpen',
  'Pencil','Percent','Phone','Pin','PinOff','Plus','Printer','Receipt',
  'RefreshCw','RotateCcw','Save','Scale','Search','Send','Server',
  'ServerCrash','Settings','Shield','ShieldAlert','ShieldCheck',
  'SlidersHorizontal','Sparkles','Star','Sun','Tag','Target','Ticket',
  'TrendingDown','TrendingUp','Trash2','Truck','Unlock','Upload',
  'User','UserCheck','UserCircle','UserPlus','Users','Users2','Webhook',
  'Wifi','WifiOff','Wallet','X','XCircle','Zap'
];
let content = `declare module 'lucide-react' {
  import { SVGProps } from 'react';

  export interface LucideIconProps extends SVGProps<SVGSVGElement> {
    size?: number;
  }

  export const Icon: any;
  export default Icon;

`;
for (const icon of icons) {
  content += `  export const ${icon}: any;\n`;
}
content += `}\n`;
fs.writeFileSync('packages/ui/src/types/lucide-react.d.ts', content);
console.log('Written', icons.length, 'icons');
