"use client"
import Image from "next/image";
import { useState } from "react";
import { IoMdSend } from "react-icons/io";

export default function Home() {

  const [userLink, setUserLink] = useState("");

  const handleSend = () => {
    if (!userLink.trim()) return;
    
    const baseUrl = window.location.href;
    const finalUrl = `${baseUrl}${userLink}`;
    
    window.open(finalUrl, "_blank");
  };

  
  const handleKeyDown = (e:any) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-800">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center flex-1">
        <h1 className="text-3xl font-semibold mb-8 text-center text-gray-200">
          Welcome to ChatW
        </h1>

        {/* Chat Input Field */}
        <div className="w-full relative">
          <input
            value={userLink}
            onKeyDown={handleKeyDown}
            onChange={(e) => setUserLink(e.target.value)}
            type="text"
            placeholder="Enter your link here..."
            className="w-full p-4 pr-12 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button
            type="button"
            onClick={handleSend}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
          >
            <IoMdSend size={30} />
          </button>
        </div>
      </div>

      <footer className="text-sm text-gray-500 mt-10">
        © 2025 ChatW. All rights reserved.
      </footer>
    </main>

  );
}
