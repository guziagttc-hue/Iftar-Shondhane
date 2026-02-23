import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Phone, Plus, X, Filter, Calendar, Info, Utensils, BookOpen, Map as MapIcon, List, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Event {
  id: number;
  name: string;
  type: string;
  district: string;
  upazila: string;
  village: string;
  address: string;
  date_range: string;
  start_time: string;
  iftar_time: string;
  contact: string;
  description: string;
  image_url: string;
  lat?: number;
  lng?: number;
}

const DISTRICTS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ", "বগুড়া", "কুমিল্লা"];
const EVENT_TYPES = [
  { id: "public_iftar", label: "গণ-ইফতার", icon: Utensils, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "religious_gathering", label: "ওয়াজ/দ্বীনি মজলিস", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" }
];

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Search filters
  const [filters, setFilters] = useState({
    district: "",
    upazila: "",
    village: "",
    type: ""
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "public_iftar",
    district: "",
    upazila: "",
    village: "",
    address: "",
    date_range: "",
    start_time: "",
    iftar_time: "",
    contact: "",
    description: "",
    image_url: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (error) => {
        console.error("Error getting location", error);
        alert("লোকেশন পাওয়া যায়নি। অনুগ্রহ করে ম্যানুয়ালি দিন।");
      });
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormData({
          name: "", type: "public_iftar", district: "", upazila: "", village: "",
          address: "", date_range: "", start_time: "", iftar_time: "",
          contact: "", description: "", image_url: "", lat: undefined, lng: undefined
        });
        fetchEvents();
      }
    } catch (error) {
      console.error("Failed to add event", error);
    }
  };

  // Map Component to handle view changes
  function MapView({ events }: { events: Event[] }) {
    const map = useMap();
    useEffect(() => {
      if (events.length > 0 && events[0].lat && events[0].lng) {
        map.setView([events[0].lat, events[0].lng], 13);
      }
    }, [events, map]);

    return (
      <>
        {events.filter(e => e.lat && e.lng).map(event => (
          <Marker key={event.id} position={[event.lat!, event.lng!]}>
            <Popup>
              <div className="p-1">
                <h5 className="font-bold text-emerald-800">{event.name}</h5>
                <p className="text-xs text-slate-600 mb-2">{event.address}</p>
                <div className="flex gap-2">
                  <a 
                    href={`tel:${event.contact}`}
                    className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-md"
                  >
                    কল দিন
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Utensils size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-900">ইফতার সন্ধানে</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-600/70">Iftar Shondhane</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
            নতুন ইভেন্ট
          </button>
        </div>
      </header>

      {/* Hero & Search */}
      <section className="bg-emerald-900 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            আপনার এলাকায় ইফতার ও দ্বীনি মজলিসের খোঁজ নিন
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-emerald-100/80 mb-8 max-w-2xl mx-auto"
          >
            রমজানে ইফতার মাহফিল বা ইফতারি বিতরণের তথ্য এক জায়গায়। জেলা, ইউনিয়ন এবং গ্রাম ভিত্তিক সার্চ করুন।
          </motion.p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-3 border-b md:border-b-0 md:border-r border-slate-100">
              <MapPin size={20} className="text-slate-400 mr-2" />
              <select 
                value={filters.district}
                onChange={(e) => setFilters({...filters, district: e.target.value})}
                className="w-full py-3 bg-transparent text-slate-700 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">জেলা নির্বাচন করুন</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex-1 flex items-center px-3 border-b md:border-b-0 md:border-r border-slate-100">
              <Filter size={20} className="text-slate-400 mr-2" />
              <input 
                type="text"
                placeholder="উপজেলা/ইউনিয়ন"
                value={filters.upazila}
                onChange={(e) => setFilters({...filters, upazila: e.target.value})}
                className="w-full py-3 bg-transparent text-slate-700 focus:outline-none"
              />
            </div>
            <div className="flex-1 flex items-center px-3">
              <Search size={20} className="text-slate-400 mr-2" />
              <input 
                type="text"
                placeholder="গ্রাম/মহল্লা"
                value={filters.village}
                onChange={(e) => setFilters({...filters, village: e.target.value})}
                className="w-full py-3 bg-transparent text-slate-700 focus:outline-none"
              />
            </div>
            <button 
              onClick={fetchEvents}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              খুঁজুন
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-emerald-600" />
            সাম্প্রতিক ইভেন্টসমূহ
          </h3>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-slate-200 p-1 rounded-xl flex">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <List size={16} />
                লিস্ট
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <MapIcon size={16} />
                ম্যাপ
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilters({...filters, type: ""})}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filters.type === "" ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                সব
              </button>
              {EVENT_TYPES.map(type => (
                <button 
                  key={type.id}
                  onClick={() => setFilters({...filters, type: type.id})}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filters.type === type.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => {
                const typeInfo = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[0];
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={event.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeInfo.bg} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <div className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                          <Info size={20} />
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-bold mb-2 text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {event.name}
                      </h4>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <MapPin size={16} className="text-emerald-500" />
                          <span>{event.district} {event.upazila ? `> ${event.upazila}` : ''} {event.village ? `> ${event.village}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock size={16} className="text-emerald-500" />
                          <span>{event.start_time || 'আসরের পর'} থেকে ইফতার পর্যন্ত</span>
                        </div>
                        {event.contact && (
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Phone size={16} className="text-emerald-500" />
                            <span>{event.contact}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <a 
                          href={event.lat && event.lng ? `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.name} ${event.address} ${event.village}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-center text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <MapPin size={16} />
                          লোকেশন দেখুন
                        </a>
                        {event.contact && (
                          <a 
                            href={`tel:${event.contact}`}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl text-center text-sm font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <Phone size={16} />
                            কল দিন
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">কোনো ইভেন্ট পাওয়া যায়নি</h4>
              <p className="text-slate-500">আপনার এলাকায় কোনো ইভেন্ট থাকলে যুক্ত করুন।</p>
            </div>
          )
        ) : (
          <div className="h-[600px] w-full bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative">
            <MapContainer center={[23.685, 90.3563]} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapView events={events} />
            </MapContainer>
          </div>
        )}
      </main>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">নতুন ইভেন্ট যুক্ত করুন</h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-emerald-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">ইভেন্টের নাম *</label>
                    <input 
                      required
                      type="text"
                      placeholder="উদা: বিসমিল্লাহ জামে মসজিদ ইফতার মাহফিল"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">ধরন *</label>
                    <select 
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">জেলা *</label>
                    <select 
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.district}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                    >
                      <option value="">নির্বাচন করুন</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">উপজেলা/ইউনিয়ন *</label>
                    <input 
                      required
                      type="text"
                      placeholder="উদা: সোনাতলা"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.upazila}
                      onChange={(e) => setFormData({...formData, upazila: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">গ্রাম/মহল্লা *</label>
                    <input 
                      required
                      type="text"
                      placeholder="উদা: উত্তর পাড়া"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.village}
                      onChange={(e) => setFormData({...formData, village: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">বিস্তারিত ঠিকানা *</label>
                  <input 
                    required
                    type="text"
                    placeholder="রাস্তা নম্বর, ল্যান্ডমার্ক ইত্যাদি"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">শুরুর সময়</label>
                    <input 
                      type="text"
                      placeholder="উদা: আসরের পর"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">যোগাযোগ নম্বর</label>
                    <input 
                      type="text"
                      placeholder="উদা: 017XXXXXXXX"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <Navigation size={14} />
                      ম্যাপ লোকেশন (ঐচ্ছিক)
                    </label>
                    <button 
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-md font-bold flex items-center gap-1"
                    >
                      <MapPin size={10} />
                      বর্তমান লোকেশন নিন
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number"
                      step="any"
                      placeholder="অক্ষাংশ (Lat)"
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none"
                      value={formData.lat || ''}
                      onChange={(e) => setFormData({...formData, lat: parseFloat(e.target.value)})}
                    />
                    <input 
                      type="number"
                      step="any"
                      placeholder="দ্রাঘিমাংশ (Lng)"
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none"
                      value={formData.lng || ''}
                      onChange={(e) => setFormData({...formData, lng: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">বিশেষত্ব/বিবরণ</label>
                  <textarea 
                    rows={3}
                    placeholder="ইভেন্ট সম্পর্কে কিছু লিখুন..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
                >
                  ইভেন্টটি যুক্ত করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-4 mt-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Utensils size={18} />
            </div>
            <span className="font-bold text-slate-800">ইফতার সন্ধানে</span>
          </div>
          <p className="text-slate-500 text-sm">© ২০২৬ ইফতার সন্ধানে। আপনার এলাকার ইফতার মাহফিল খুঁজে নিন।</p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">ফেসবুক</a>
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">যোগাযোগ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
