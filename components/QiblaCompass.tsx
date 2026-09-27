import React, { useState, useEffect, useRef } from 'react';

interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

const CITIES: City[] = [
  { name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262 },
  { name: 'المدينة المنورة', country: 'السعودية', lat: 24.4672, lng: 39.6111 },
  { name: 'الرياض', country: 'السعودية', lat: 24.7136, lng: 46.6753 },
  { name: 'جدة', country: 'السعودية', lat: 21.5433, lng: 39.1728 },
  { name: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357 },
  { name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lng: 29.9187 },
  { name: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lng: 35.2137 },
  { name: 'دمشق', country: 'سوريا', lat: 33.5138, lng: 36.2765 },
  { name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018 },
  { name: 'عمان', country: 'الأردن', lat: 31.9522, lng: 35.2332 },
  { name: 'بغداد', country: 'العراق', lat: 33.3152, lng: 44.3661 },
  { name: 'الكويت', country: 'الكويت', lat: 29.3759, lng: 47.9774 },
  { name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.5860 },
  { name: 'الدوحة', country: 'قطر', lat: 25.2854, lng: 51.5310 },
  { name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lng: 54.3773 },
  { name: 'دبي', country: 'الإمارات', lat: 25.2048, lng: 55.2708 },
  { name: 'مسقط', country: 'عمان', lat: 23.5880, lng: 58.3829 },
  { name: 'صنعاء', country: 'اليمن', lat: 15.3694, lng: 44.1910 },
  { name: 'طرابلس', country: 'ليبيا', lat: 32.8872, lng: 13.1913 },
  { name: 'تونس', country: 'تونس', lat: 36.8065, lng: 10.1815 },
  { name: 'الجزائر', country: 'الجزائر', lat: 36.7538, lng: 3.0588 },
  { name: 'الرباط', country: 'المغرب', lat: 34.0209, lng: -6.8416 },
  { name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lng: -7.5898 },
  { name: 'الخرطوم', country: 'السودان', lat: 15.5007, lng: 32.5599 },
  { name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lng: 28.9784 },
  { name: 'جاكرتا', country: 'إندونيسيا', lat: -6.2088, lng: 106.8456 },
  { name: 'كوالالمبور', country: 'ماليزيا', lat: 3.1390, lng: 101.6869 },
  { name: 'إسلام آباد', country: 'باكستان', lat: 33.6844, lng: 73.0479 },
  { name: 'لندن', country: 'بريطانيا', lat: 51.5074, lng: -0.1278 },
  { name: 'باريس', country: 'فرنسا', lat: 48.8566, lng: 2.3522 },
  { name: 'برلين', country: 'ألمانيا', lat: 52.5200, lng: 13.4050 },
  { name: 'نيويورك', country: 'أمريكا', lat: 40.7128, lng: -74.0060 }
];

// Great-circle Qibla calculation
function calculateQibla(latitude: number, longitude: number): number {
  const phi1 = (latitude * Math.PI) / 180;
  const phi2 = (21.422487 * Math.PI) / 180;
  const deltaLambda = ((39.826206 - longitude) * Math.PI) / 180;
  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
  const qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return (qibla + 360) % 360;
}

// Distance to Kaaba in kilometers
function calculateDistance(lat: number, lon: number): number {
  const R = 6371;
  const dLat = ((21.422487 - lat) * Math.PI) / 180;
  const dLon = ((39.826206 - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) * Math.cos((21.422487 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const QiblaCompass: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[4]); // القاهرة افتراضياً
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('القاهرة، مصر');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [heading, setHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [manualRotation, setManualRotation] = useState<number>(0);

  const currentLat = userCoords ? userCoords.lat : selectedCity.lat;
  const currentLng = userCoords ? userCoords.lng : selectedCity.lng;

  const qiblaAngle = Math.round(calculateQibla(currentLat, currentLng));
  const distanceKm = calculateDistance(currentLat, currentLng);

  // Compass rotation angle
  const activeHeading = hasCompassSensor ? heading : manualRotation;
  const compassRoseRotation = -activeHeading;
  // Difference between current heading and Qibla angle
  const angleDiff = Math.abs((activeHeading - qiblaAngle + 360) % 360);
  const isAligned = angleDiff <= 4 || angleDiff >= 356;

  // Haptic feedback when aligned
  const wasAlignedRef = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      if ('vibrate' in navigator) {
        try { navigator.vibrate([50, 50, 100]); } catch (e) {}
      }
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  // Request device orientation
  useEffect(() => {
    // Check if DeviceOrientationEvent permission is required (iOS 13+)
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any)?.requestPermission === 'function'
    ) {
      setNeedsPermission(true);
    } else {
      setupOrientationListener();
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  const handleOrientation = (e: DeviceOrientationEvent) => {
    let compass = 0;
    if ((e as any).webkitCompassHeading !== undefined) {
      // iOS
      compass = (e as any).webkitCompassHeading;
      setHasCompassSensor(true);
    } else if (e.alpha !== null) {
      // Android / standards
      compass = (360 - e.alpha) % 360;
      setHasCompassSensor(true);
    }

    if (compass !== undefined && !isNaN(compass)) {
      setHeading(Math.round(compass));
    }
  };

  const setupOrientationListener = () => {
    if (typeof window === 'undefined') return;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  const handleRequestPermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setNeedsPermission(false);
          setupOrientationListener();
        }
      }
    } catch (e) {
      console.warn("Compass permission error:", e);
    }
  };

  // Get GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationName('موقعي الحالي عبر GPS');
      },
      (err) => {
        setIsLocating(false);
        setLocationError('تعذر الحصول على الموقع الدقيق، يمكنك اختيار مدينتك من القائمة.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#051d14] text-white overflow-y-auto page-fade-in pb-24" dir="rtl">
      {/* Top Header */}
      <div className="p-4 pb-2 border-b border-[#0f2d22] bg-[#07251a]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            <h1 className="text-xl font-bold text-[#dfb26d]">بوصلة القبلة المشرفة</h1>
            <p className="text-[10px] text-[#00b87c] font-bold">تحديد اتجاه الكعبة المشرفة بدقة</p>
          </div>
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00b87c]/20 hover:bg-[#00b87c] text-[#00b87c] hover:text-white border border-[#00b87c]/30 text-xs font-bold transition-all disabled:opacity-50"
            title="تحديد الموقع الجغرافي الدقيق"
          >
            <svg className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{isLocating ? 'جاري التحديد...' : 'موقعي (GPS)'}</span>
          </button>
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-400 whitespace-nowrap">المدينة:</label>
          <select
            value={userCoords ? 'custom' : `${selectedCity.name}, ${selectedCity.country}`}
            onChange={(e) => {
              const found = CITIES.find(c => `${c.name}, ${c.country}` === e.target.value);
              if (found) {
                setSelectedCity(found);
                setUserCoords(null);
                setLocationName(`${found.name}، ${found.country}`);
              }
            }}
            className="flex-1 bg-[#0a2a1f] border border-[#0f2d22] rounded-xl py-1.5 px-3 text-xs text-white outline-none focus:ring-1 focus:ring-[#00b87c]"
          >
            {userCoords && <option value="custom">موقعي الحالي عبر GPS</option>}
            {CITIES.map((c, i) => (
              <option key={i} value={`${c.name}, ${c.country}`}>
                {c.name} ({c.country})
              </option>
            ))}
          </select>
        </div>

        {locationError && (
          <p className="text-[10px] text-amber-400 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            {locationError}
          </p>
        )}
      </div>

      {/* Main Compass Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Status Notification Badge */}
        <div className="mb-4">
          {isAligned ? (
            <div className="inline-flex items-center gap-2 bg-[#00b87c] text-white px-4 py-1.5 rounded-full text-xs font-extrabold shadow-lg shadow-[#00b87c]/30 animate-pulse">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span>أنت الآن باتجاه الكعبة المشرفة مباشرة!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#0a2a1f] text-slate-300 px-4 py-1.5 rounded-full text-xs font-bold border border-[#0f2d22]">
              <span className="text-[#dfb26d] font-bold">زاوية القبلة: {qiblaAngle}°</span>
              <span className="text-slate-500">•</span>
              <span>المسافة: {distanceKm.toLocaleString('ar-EG')} كم</span>
            </div>
          )}
        </div>

        {/* Compass Visual Dial */}
        <div className="relative w-72 h-72 my-2 select-none flex items-center justify-center">
          {/* Glowing Aura Ring when aligned */}
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
            isAligned ? 'bg-[#00b87c]/20 ring-4 ring-[#00b87c] shadow-2xl shadow-[#00b87c]/50' : 'bg-transparent'
          }`} />

          {/* Compass Outer Rim */}
          <div 
            className="relative w-64 h-64 rounded-full border-4 border-[#dfb26d]/60 bg-gradient-to-b from-[#0a2a1f] to-[#03140e] shadow-2xl flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${compassRoseRotation}deg)` }}
          >
            {/* Degree Ticks */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-full flex justify-center pt-2"
                style={{ transform: `rotate(${i * 30}deg)` }}
              >
                <div className={`w-0.5 ${i % 3 === 0 ? 'h-3 bg-[#dfb26d]' : 'h-1.5 bg-slate-600'}`} />
              </div>
            ))}

            {/* Cardinal Letters in Arabic */}
            <span className="absolute top-4 text-xs font-extrabold text-[#dfb26d]">شمال</span>
            <span className="absolute bottom-4 text-xs font-extrabold text-slate-400">جنوب</span>
            <span className="absolute right-4 text-xs font-extrabold text-slate-400">شرق</span>
            <span className="absolute left-4 text-xs font-extrabold text-slate-400">غرب</span>

            {/* Inner Golden Ring */}
            <div className="w-44 h-44 rounded-full border border-dashed border-[#dfb26d]/30 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-white/5 bg-[#051d14]/60 flex items-center justify-center">
                {/* 8-point Islamic star in center */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#dfb26d]/10 star-8 border border-[#dfb26d]/40" />
                  <span className="relative text-[10px] font-bold text-[#dfb26d]">الكعبة</span>
                </div>
              </div>
            </div>

            {/* Kaaba Marker Pin located at exact Qibla Angle relative to the rose */}
            <div
              className="absolute w-full h-full pointer-events-none flex justify-center items-start pt-1"
              style={{ transform: `rotate(${qiblaAngle}deg)` }}
            >
              <div className="flex flex-col items-center -mt-3 animate-bounce">
                {/* Kaaba Icon */}
                <div className="w-8 h-8 rounded-lg bg-black border-2 border-[#dfb26d] flex items-center justify-center shadow-lg shadow-[#dfb26d]/30">
                  <div className="w-5 h-5 bg-[#1a1a1a] rounded flex flex-col justify-between p-0.5">
                    <div className="w-full h-1 bg-[#dfb26d] rounded-sm" />
                    <div className="w-1.5 h-1.5 bg-[#dfb26d] self-center rounded-full" />
                  </div>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-[#dfb26d]" />
              </div>
            </div>

            {/* North Indicator Pointer */}
            <div className="absolute top-1 flex flex-col items-center">
              <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-red-500" />
            </div>
          </div>

          {/* Center Needle (Fixed Device Direction - Top of phone) */}
          <div className="absolute pointer-events-none flex flex-col items-center justify-center">
            {/* Direction pointer toward top */}
            <div className="w-1 h-20 bg-gradient-to-t from-transparent via-[#00b87c] to-[#00b87c] rounded-full shadow-lg shadow-[#00b87c]/50" />
            <div className="w-4 h-4 rounded-full bg-[#dfb26d] border-2 border-[#051d14] -mt-2 shadow" />
          </div>
        </div>

        {/* Readout Numbers */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-4">
          <div className="bg-[#0a2a1f] p-3 rounded-2xl border border-[#0f2d22] text-center">
            <span className="text-[10px] text-slate-500 block font-bold">اتجاهك الحالي</span>
            <span className="text-base font-extrabold text-white">{activeHeading}°</span>
          </div>
          <div className="bg-[#0a2a1f] p-3 rounded-2xl border border-[#0f2d22] text-center">
            <span className="text-[10px] text-[#00b87c] block font-bold">اتجاه القبلة</span>
            <span className="text-base font-extrabold text-[#dfb26d]">{qiblaAngle}°</span>
          </div>
          <div className="bg-[#0a2a1f] p-3 rounded-2xl border border-[#0f2d22] text-center">
            <span className="text-[10px] text-slate-500 block font-bold">المسافة للكعبة</span>
            <span className="text-base font-extrabold text-white">{distanceKm} كم</span>
          </div>
        </div>

        {/* Sensor Permission / Calibration for iOS & Desktop */}
        {needsPermission && (
          <div className="mt-4 p-3 bg-[#0a2a1f] rounded-2xl border border-[#dfb26d]/40 max-w-xs">
            <p className="text-xs text-slate-300 mb-2">يتطلب آيفون إذناً للوصول إلى حساس البوصلة:</p>
            <button
              onClick={handleRequestPermission}
              className="w-full bg-[#dfb26d] text-[#051d14] font-bold text-xs py-2 rounded-xl"
            >
              تفعيل بوصلة الهاتف
            </button>
          </div>
        )}

        {/* Manual Dial for Desktops / No sensor */}
        {!hasCompassSensor && !needsPermission && (
          <div className="mt-4 p-3 bg-[#0a2a1f]/80 rounded-2xl border border-white/5 max-w-xs w-full">
            <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
              <span>تدوير البوصلة يدوياً:</span>
              <span className="text-[#00b87c] font-bold">{manualRotation}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualRotation}
              onChange={(e) => setManualRotation(parseInt(e.target.value))}
              className="w-full accent-[#00b87c] cursor-pointer"
            />
            <p className="text-[9px] text-slate-500 mt-1">
              على الهواتف الذكية تدور البوصلة تلقائياً بحسب اتجاه جهازك.
            </p>
          </div>
        )}

        {/* Location Info Banner */}
        <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#00b87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          <span>الموقع الحالي: {locationName}</span>
        </div>
      </div>
    </div>
  );
};
