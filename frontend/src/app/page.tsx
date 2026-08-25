"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Mengecek token auth dari localStorage
    // Gunakan setTimeout kecil untuk menghindari error hydration mismatch pada Next.js
    const timer = setTimeout(() => {
      const token = localStorage.getItem("token"); // Sesuaikan key jika kamu menggunakan penamaan lain
      
      if (token) {
        router.replace("/dashboard"); // Gunakan replace agar tidak masuk history back
      } else {
        router.replace("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
      {/* Loading Spinner CSS murni */}
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium animate-pulse">Memuat sistem...</p>
    </div>
  );
}
