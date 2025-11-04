import { MapPin, Calendar, Clock } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Destination } from '@/app/lib/types';

interface DestinationCardProps {
  destination: Destination;
  onClick: () => void;
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function DestinationCard({ destination, onClick }: DestinationCardProps) {
  const formatDays = () => {
    return destination.frequency.days.map(d => DAYS[d]).join('・');
  };

  return (
    <Card
      onClick={onClick}
      className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer border-2 hover:border-indigo-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 mb-1 truncate">{destination.name}</h3>
          <p className="text-sm text-gray-600 mb-3 truncate">{destination.address}</p>
          
          <div className="flex flex-wrap gap-2">
            {destination.frequency.days.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {formatDays()}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {destination.frequency.time}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
