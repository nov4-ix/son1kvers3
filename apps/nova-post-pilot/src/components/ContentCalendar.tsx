import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ScheduledPost {
    content: string;
    scheduledTime: string;
}

interface BestSlot {
    day: string;
    time: string;
}

export function ContentCalendar() {
    const { t } = useTranslation();
    const [posts] = useState<ScheduledPost[]>([]);

    // Generate calendar days (current month)
    const days: Date[] = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Start from Sunday before first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    // Fill calendar (5 weeks)
    for (let i = 0; i < 35; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
    }

    // Mock best posting times
    const bestSlots: BestSlot[] = [
        { day: 'Monday', time: '10:00 AM' },
        { day: 'Wednesday', time: '2:00 PM' },
        { day: 'Friday', time: '6:00 PM' }
    ];
    // ...

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-secondary" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{t('calendar.title')}</h3>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                        + {t('calendar.newPost')}
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs text-white/40 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
                {days.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    const dayPosts = posts.filter(p => new Date(p.scheduledTime).toDateString() === date.toDateString());
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const bestSlot = bestSlots.find(s => s.day === dayName);

                    return (
                        <div
                            key={i}
                            className={`min-h-[100px] bg-black/20 rounded-lg p-2 border ${isToday ? 'border-primary/50 bg-primary/5' : 'border-white/5'
                                } hover:border-white/20 transition-colors relative group`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-mono ${isToday ? 'text-primary' : 'text-white/60'}`}>
                                    {date.getDate()}
                                </span>
                                {bestSlot && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" title={`Best time: ${bestSlot.time}`}>
                                        <Clock className="w-3 h-3 text-yellow-400" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                {dayPosts.map((post, idx) => (
                                    <div key={idx} className="text-[10px] bg-white/10 p-1 rounded truncate text-white/80 border-l-2 border-secondary">
                                        {post.content}
                                    </div>
                                ))}

                                {bestSlot && dayPosts.length === 0 && (
                                    <div className="text-[10px] border border-dashed border-white/10 text-white/30 p-1 rounded text-center mt-2 group-hover:border-primary/30 group-hover:text-primary/50 cursor-pointer transition-colors">
                                        <Plus className="w-3 h-3 mx-auto mb-0.5" />
                                        {bestSlot.time}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
