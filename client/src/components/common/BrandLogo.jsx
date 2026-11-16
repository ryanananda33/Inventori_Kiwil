// components/common/BrandLogo.jsx
import logoKiwil from '../../assets/logo_kiwil.png'; // Impor gambar logo asli kamu

export default function BrandLogo() {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-b border-gray-100">
      {/* Logo diperbesar dan diletakkan di tengah */}
      <img 
        src={logoKiwil} 
        alt="Logo Warkop Kiwil" 
        className="h-30 w-30 object-contain rounded-xl mb-3 shadow-sm" 
      />
      
      {/* Teks Inventory System di bawah logo/nama */}
      <p className="text-xs text-gray-400 mt-0.5">
        Inventory System
      </p>
    </div>
  );
}