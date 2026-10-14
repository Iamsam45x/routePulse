
import { MapContainer, TileLayer } from "react-leaflet";
import { networkMapConfig } from "../../config/networkMap";

export default function CampusMap() {
  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-border sm:h-80 lg:h-[420px]">
      <MapContainer
        center={networkMapConfig.center}
        zoom={networkMapConfig.zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
}
