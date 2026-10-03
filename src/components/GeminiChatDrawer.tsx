import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Loader2,
  MapPin,
  Navigation,
  ExternalLink,
  Star,
  Award,
} from 'lucide-react';
import { ChatMessage, UserLocation, ReportItem, GooglePlaceResult } from '../types';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  reports: ReportItem[];
  onSelectPlace?: (place: GooglePlaceResult) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-init',
    sender: 'assistant',
    text: `Hello! I'm **Ask AI**, powered by **Google Gemma 4**.\n\nI can help you with:\n- **Restaurant & Cafe Recommendations**: Cross-referenced with reviews across **Google Maps, Yelp, and Rednote (小红书)**.\n- **Signature dishes & viral must-tries**: Sourdough bakeries, sanuki udon, ceremonial matcha, dim sum, and hidden gems.\n- **Hyper-local situation updates**: Live ground logs, sports court wait times, and emergency hazard reports.\n\nAsk me for restaurant recommendations or places to explore nearby!`,
    timestamp: new Date().toISOString(),
  },
];

const PROMPT_SUGGESTIONS = [
  '🍜 Recommend the best dinner spots near SFSU',
  '🥐 Where can I find top bakeries & croissants?',
  '📕 What is trending on Rednote (小红书) in SF right now?',
  '🍗 Best crispy wings or Chinese food nearby',
  '☕ Quiet study cafes with wifi and matcha',
  '🌊 Any active road closures or weather advisories?',
];

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  userLocation,
  reports,
  onSelectPlace,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const activeEmergencySummary = reports
        .filter((r) => r.type === 'emergency' && r.status === 'active')
        .map((r) => `${r.title} at ${r.locationName}`)
        .join('; ');

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
          userLocation,
          activeContext: activeEmergencySummary,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I received no response.',
        timestamp: new Date().toISOString(),
        recommendedPlaces: data.recommendedPlaces || [],
      };
      setMessages([...newMessages, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an error connecting to the LocalPulse intelligence server. Please try asking again.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">Ask AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                Gemma 4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Grounded in Google Maps, Yelp & Rednote
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    isUser
                      ? 'bg-rose-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-lg'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1.5 ${
                      isUser ? 'text-rose-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Recommended Places Cards */}
              {!isUser && m.recommendedPlaces && m.recommendedPlaces.length > 0 && (
                <div className="pl-9 w-full space-y-2.5 my-1">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recommended Places ({m.recommendedPlaces.length})</span>
                  </div>

                  <div className="space-y-2">
                    {m.recommendedPlaces.map((place) => (
                      <div
                        key={place.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-700/80 shadow-md space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-sm text-white">
                              {place.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                              <span className="truncate">{place.address}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
                            {place.category}
                          </span>
                        </div>

                        {/* Multi-Platform Badges */}
                        {place.reviewsAggregation && (
                          <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                            <span className="bg-blue-950 text-blue-200 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                              🗺️ {place.reviewsAggregation.googleReviews.rating} ★
                            </span>
                            <span className="bg-red-950 text-red-200 border border-red-800 px-1.5 py-0.5 rounded font-bold">
                              🔴 {place.reviewsAggregation.yelpReviews.rating} ★
                            </span>
                            <span className="bg-rose-950 text-rose-200 border border-rose-800 px-1.5 py-0.5 rounded font-bold">
                              📕 {place.reviewsAggregation.rednoteReviews.rating} ★
                            </span>
                          </div>
                        )}

                        {place.reviewsAggregation?.mustTryOrHighlights && (
                          <div className="text-[11px] text-amber-200/90 bg-amber-950/30 p-2 rounded-xl border border-amber-900/40">
                            <strong>Must-Try: </strong>
                            {place.reviewsAggregation.mustTryOrHighlights.slice(0, 2).join(' • ')}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              if (onSelectPlace) {
                                onSelectPlace(place);
                                onClose();
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1 border border-slate-700"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            <span>View on Map</span>
                          </button>

                          <a
                            href={
                              place.directionsUrl ||
                              `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Directions</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Grounded review search across Google Maps, Yelp & Rednote...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto flex gap-1.5 no-scrollbar">
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            className="flex-shrink-0 text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 transition-colors shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI to recommend restaurants, cafes, or spots..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-xl disabled:opacity-40 transition-colors flex-shrink-0 shadow-lg"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
