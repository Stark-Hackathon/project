"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface LocationData {
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  formattedAddress?: string;
  administrativeArea?: string;
}

interface LocationPickerProps {
  location: LocationData;
  onChange: (location: LocationData) => void;
}

export function LocationPicker({ location, onChange }: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your current browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onChange({
          ...location,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          locationAccuracy: Math.round(position.coords.accuracy),
          formattedAddress: location.formattedAddress || "GPS Coordinates captured on-site",
        });
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Location permission denied. Please allow location access or type the address below.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Location information is currently unavailable.");
            break;
          case error.TIMEOUT:
            setGpsError("Location request timed out. Please try again or type the address.");
            break;
          default:
            setGpsError("An unknown error occurred while retrieving GPS coordinates.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          Where is the incident located?
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Accurate location enables authorities to dispatch repair teams directly to the spot.
        </p>
      </div>

      {gpsError && <Alert variant="warning">{gpsError}</Alert>}

      {/* GPS button */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white block">
            Automatic GPS Detection
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
            Capture exact on-site coordinates directly from your device
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          isLoading={isLocating}
          onClick={handleGetCurrentLocation}
          className="shrink-0 cursor-pointer"
        >
          📍 {isLocating ? "Locating..." : "Use Current GPS"}
        </Button>
      </div>

      {/* Coordinate status display */}
      {location.latitude && location.longitude ? (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Coordinates Locked
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-700 dark:text-slate-300">
            <div>Lat: {location.latitude}</div>
            <div>Lng: {location.longitude}</div>
            {location.locationAccuracy && (
              <div>Accuracy: ±{location.locationAccuracy}m</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
          No GPS coordinates captured yet. Click &quot;Use Current GPS&quot; above or provide details below.
        </div>
      )}

      {/* Address & Administrative Area inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Street Address / Nearest Landmark"
          placeholder="e.g. Bole Road near Mega Building, In front of Bank"
          value={location.formattedAddress || ""}
          onChange={(e) =>
            onChange({ ...location, formattedAddress: e.target.value })
          }
          helperText="Helpful landmarks or street names"
        />

        <Input
          label="Administrative Area / Sub-City / Woreda"
          placeholder="e.g. Bole Sub-City, Woreda 03"
          value={location.administrativeArea || ""}
          onChange={(e) =>
            onChange({ ...location, administrativeArea: e.target.value })
          }
          helperText="City, Sub-City, or District"
        />
      </div>

      {/* Privacy notice per Spec Section 18 */}
      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        🛡️ <strong>Location Privacy:</strong> Exact coordinates are used exclusively by municipal dispatch teams. Public views show approximate neighborhood locations to protect resident privacy.
      </div>
    </div>
  );
}
