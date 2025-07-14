"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (imageElement && scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else if (imageElement) {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative pt-20 md:pt-32 lg:pt-36 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-7xl lg:text-[90px] leading-tight font-extrabold pb-6 bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 bg-clip-text text-transparent gradient-title">
          Walmart Inventory <br /> Management System
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Streamline your supply chain with our intelligent inventory management platform. 
          Connect vendors, optimize routes, and manage warehouse operations with real-time insights.
        </p>

        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
          <Link href="/login">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              Get Started
            </button>
          </Link>
          <Link href="/register">
            <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105">
              Sign Up
            </button>
          </Link>
        </div>

        <div className="hero-image-wrapper">
          <div
            ref={imageRef}
            className="hero-image transition-all duration-700 ease-in-out transform hover:scale-105 mx-auto"
          >
            <div className="relative mx-auto w-full max-w-6xl">
              <div className="bg-white rounded-xl shadow-2xl border-4 border-gray-100 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     {/* Dashboard Preview */}
                   <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 feature-card">
                     <div className="flex items-center mb-4">
                       <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                       <h3 className="font-semibold text-blue-800">Vendor Dashboard</h3>
                     </div>
                     <div className="space-y-2">
                       <div className="h-2 bg-blue-200 rounded"></div>
                       <div className="h-2 bg-blue-200 rounded w-3/4"></div>
                       <div className="h-2 bg-blue-200 rounded w-1/2"></div>
                     </div>
                   </div>

                   {/* Inventory Management */}
                   <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 feature-card">
                     <div className="flex items-center mb-4">
                       <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                       <h3 className="font-semibold text-green-800">Inventory Control</h3>
                     </div>
                     <div className="space-y-2">
                       <div className="h-2 bg-green-200 rounded"></div>
                       <div className="h-2 bg-green-200 rounded w-5/6"></div>
                       <div className="h-2 bg-green-200 rounded w-2/3"></div>
                     </div>
                   </div>

                   {/* Route Optimization */}
                   <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 feature-card">
                     <div className="flex items-center mb-4">
                       <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                       <h3 className="font-semibold text-orange-800">Route Optimization</h3>
                     </div>
                     <div className="space-y-2">
                       <div className="h-2 bg-orange-200 rounded"></div>
                       <div className="h-2 bg-orange-200 rounded w-4/5"></div>
                       <div className="h-2 bg-orange-200 rounded w-3/4"></div>
                     </div>
                   </div>
                </div>

                {/* Feature Highlights */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Real-time Tracking</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Smart Analytics</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Route Optimization</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Live Chat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            System Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 footer-stats-card">
              <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-gray-300">Active Vendors</div>
              <div className="text-sm text-gray-400 mt-2">Connected suppliers</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 footer-stats-card">
              <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-gray-300">Warehouses</div>
              <div className="text-sm text-gray-400 mt-2">Distribution centers</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 footer-stats-card">
              <div className="text-4xl font-bold text-orange-400 mb-2">10,000+</div>
              <div className="text-gray-300">Items Managed</div>
              <div className="text-sm text-gray-400 mt-2">SKUs tracked</div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="border-t border-gray-700 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Platform</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/login" className="hover:text-white transition-colors footer-link">Login</a></li>
                <li><a href="/register" className="hover:text-white transition-colors footer-link">Register</a></li>
                <li><a href="/marketplace" className="hover:text-white transition-colors footer-link">Marketplace</a></li>
                <li><a href="/transit" className="hover:text-white transition-colors footer-link">Transit</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-400">Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li><span className="hover:text-white transition-colors">Inventory Management</span></li>
                <li><span className="hover:text-white transition-colors">Route Optimization</span></li>
                <li><span className="hover:text-white transition-colors">Real-time Tracking</span></li>
                <li><span className="hover:text-white transition-colors">Analytics Dashboard</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-orange-400">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/messages" className="hover:text-white transition-colors footer-link">Live Chat</a></li>
                <li><span className="hover:text-white transition-colors">Documentation</span></li>
                <li><span className="hover:text-white transition-colors">Help Center</span></li>
                <li><span className="hover:text-white transition-colors">Contact Us</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-400">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><span className="hover:text-white transition-colors">About Walmart</span></li>
                <li><span className="hover:text-white transition-colors">Privacy Policy</span></li>
                <li><span className="hover:text-white transition-colors">Terms of Service</span></li>
                <li><span className="hover:text-white transition-colors">Careers</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 mt-8 text-center">
          <p className="text-gray-400">
            © 2024 Walmart Inventory Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Footer />
    </div>
  );
} 