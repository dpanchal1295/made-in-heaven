import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Lightbulb } from 'lucide-react';
import { Room } from '@/types/firestore';

interface RoomsGridProps {
  rooms: Room[];
  ideaCounts: Record<string, number>;
  messageCounts?: Record<string, number>;
}

const ROOM_DESCRIPTIONS: Record<string, string> = {
  venue: 'Explore properties, guest capacity, courtyards & ceremony settings.',
  food: 'Curate regional delicacies, catering menus, live counters & tastings.',
  outfits: 'Coordinate family color palettes, bridal couture & function attire.',
  decor: 'Floral themes, mandap styling, lanterns & ambient festive lighting.',
  budget: 'Review expense allocations, high-priority bookings & payment milestones.',
  general: 'Open discussion space for miscellaneous planning notes and ideas.',
};

export const RoomsGrid: React.FC<RoomsGridProps> = ({ rooms, ideaCounts }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-micro text-[10px] text-[#94512F] uppercase tracking-[0.2em] font-semibold block">
            COLLABORATIVE HUBS
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#2A2521]">
            Family Rooms
          </h2>
        </div>
        <span className="text-xs text-[#6B645E]">
          {rooms.length} active rooms
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const roomIdLower = room.id.toLowerCase();
          const count = ideaCounts[roomIdLower] || 0;
          const desc = ROOM_DESCRIPTIONS[roomIdLower] || 'Discuss details and share creative suggestions.';

          return (
            <Link
              key={room.id}
              href={`/family/rooms/${room.id}`}
              className="group block p-5 bg-white border border-[#E4DED6] hover:border-[#2A2521] transition-all hover:shadow-[0_2px_8px_rgba(42,37,33,0.04)] focus-visible:outline-2 focus-visible:outline-[#A8603E]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-lg font-medium text-[#2A2521] group-hover:text-[#94512F] transition-colors">
                  {room.name}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F1EDE8] border border-[#E4DED6] text-[#2A2521] font-mono text-xs">
                  <Lightbulb className="w-3 h-3 text-[#94512F]" strokeWidth={1.5} />
                  <span>{count} {count === 1 ? 'idea' : 'ideas'}</span>
                </span>
              </div>

              <p className="text-xs text-[#6B645E] leading-relaxed line-clamp-2 mb-4">
                {desc}
              </p>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E4DED6]/60">
                <span className="font-micro text-[10px] uppercase text-[#6B645E] tracking-wider group-hover:text-[#2A2521]">
                  Join discussion
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B645E] group-hover:translate-x-1 group-hover:text-[#2A2521] transition-all" strokeWidth={1.5} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

