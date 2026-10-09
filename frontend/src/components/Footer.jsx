import React from 'react';
import { ShieldCheck, HelpCircle, Gift, Award, Briefcase } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#001D44] text-white text-xs mt-12">
      {/* Top Value Propositions */}
      <div className="border-b border-blue-900/60 py-6 bg-[#0A3B74]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF7A00]" />
            <span className="font-semibold text-gray-200">100% Authentic Products</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-[#FF7A00]" />
            <span className="font-semibold text-gray-200">7 Days Easy Return Policy</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-[#FF7A00]" />
            <span className="font-semibold text-gray-200">Free Delivery Above ₹500</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF7A00]" />
            <span className="font-semibold text-gray-200">24x7 Customer Support</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-gray-700">
        <div>
          <h4 className="text-gray-400 uppercase font-semibold text-[11px] mb-3">About</h4>
          <ul className="space-y-1.5 text-gray-300">
            <li><a href="#" className="hover:underline">Contact Us</a></li>
            <li><a href="#" className="hover:underline">About Us</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
            <li><a href="#" className="hover:underline">ShopKart Stories</a></li>
            <li><a href="#" className="hover:underline">Corporate Information</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-400 uppercase font-semibold text-[11px] mb-3">Help</h4>
          <ul className="space-y-1.5 text-gray-300">
            <li><a href="#" className="hover:underline">Payments</a></li>
            <li><a href="#" className="hover:underline">Shipping</a></li>
            <li><a href="#" className="hover:underline">Cancellation & Returns</a></li>
            <li><a href="#" className="hover:underline">FAQ</a></li>
            <li><a href="#" className="hover:underline">Report Infringement</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-400 uppercase font-semibold text-[11px] mb-3">Consumer Policy</h4>
          <ul className="space-y-1.5 text-gray-300">
            <li><a href="#" className="hover:underline">Cancellation & Returns</a></li>
            <li><a href="#" className="hover:underline">Terms Of Use</a></li>
            <li><a href="#" className="hover:underline">Security</a></li>
            <li><a href="#" className="hover:underline">Privacy</a></li>
            <li><a href="#" className="hover:underline">Sitemap</a></li>
          </ul>
        </div>

        <div className="border-l border-gray-700 pl-4">
          <h4 className="text-gray-400 uppercase font-semibold text-[11px] mb-3">Mail Us:</h4>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            ShopKart Internet Private Limited,<br />
            Buildings Alyssa, Begonia & Clove Embassy Tech Village,<br />
            Outer Ring Road, Devarabeesanahalli Village,<br />
            Bengaluru, 560103, Karnataka, India
          </p>
        </div>

        <div className="border-l border-gray-700 pl-4">
          <h4 className="text-gray-400 uppercase font-semibold text-[11px] mb-3">Registered Office Address:</h4>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            ShopKart Internet Private Limited,<br />
            CIN: U51109KA2012PTC066107<br />
            Telephone: 044-45614700 / 044-67415800
          </p>
        </div>
      </div>

      {/* Bottom Copyright & Security */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-[#FF7A00] font-semibold">
            <Briefcase className="w-3.5 h-3.5" /> Become a Seller
          </span>
          <span className="flex items-center gap-1.5 text-[#FF7A00] font-semibold">
            <Gift className="w-3.5 h-3.5" /> Gift Cards
          </span>
          <span className="flex items-center gap-1.5 text-[#FF7A00] font-semibold">
            <HelpCircle className="w-3.5 h-3.5" /> Help Center
          </span>
        </div>
        <div>
          <span>© 2026 ShopKart.com. All rights reserved. Built with Java Spring Boot & React.</span>
        </div>
      </div>
    </footer>
  );
}
