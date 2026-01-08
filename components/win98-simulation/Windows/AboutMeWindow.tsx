"use client";

import React from 'react';
import '../styles/win98.css';

interface AboutMeWindowProps {
    onClose: () => void;
    isActive: boolean;
}

export const AboutMeWindow: React.FC<AboutMeWindowProps> = ({ onClose, isActive }) => {
    return (
        <div className="h-full flex flex-col bg-white text-black overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-auto p-6 font-sans">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="border-b-2 border-gray-200 pb-6">
                        <h1 className="text-3xl font-bold mb-2 font-serif">Ashar Rai Mujeeb</h1>
                        <p className="text-xl text-gray-600 font-serif">Product Manager</p>
                        <p className="text-sm text-gray-500 mt-2">
                            A fintech PM who ❤️ to build good tech
                        </p>
                    </header>

                    {/* About Section */}
                    <section>
                        <h2 className="text-lg font-bold mb-3 uppercase tracking-wider text-blue-800 border-b border-gray-300 pb-1">About</h2>
                        <p className="leading-relaxed text-gray-800">
                            Successfully transitioned from a legal background, now thriving as an Associate Product Manager.
                            Proven ability to launch new features, drive user growth, and enhance user experience through
                            data-driven decision-making and cross-functional collaboration.
                        </p>
                    </section>

                    {/* Experience Section */}
                    <section>
                        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-blue-800 border-b border-gray-300 pb-1">Experience</h2>

                        <div className="mb-6">
                            <div className="flex justify-between items-baseline mb-2">
                                <h3 className="font-bold text-lg">Fabits</h3>
                                <div className="text-sm text-gray-500 font-medium">Nov 2023 – Present</div>
                            </div>
                            <div className="text-gray-700 italic mb-3">Product Manager | Bengaluru</div>

                            <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-gray-800">
                                <li>
                                    <span className="font-semibold">Mutual Funds Baskets & Admin:</span> Launched curated mutual fund baskets with admin dashboard, enabling 2x AUM growth.
                                </li>
                                <li>
                                    <span className="font-semibold">Mutual Funds Direct Search:</span> Built direct mutual fund search/discovery, improving engagement by 60%.
                                </li>
                                <li>
                                    <span className="font-semibold">Brand Revamp:</span> Led comprehensive brand refresh and UI redesign, improving NPS from 4 to 7.
                                </li>
                                <li>
                                    <span className="font-semibold">KYC & Internal Auth:</span> Designed seamless KYC onboarding, reducing drop-off rates.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Projects Section */}
                    <section>
                        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-blue-800 border-b border-gray-300 pb-1">Projects</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-gray-300 p-3 bg-gray-50">
                                <h3 className="font-bold text-blue-700">Rabbithole</h3>
                                <p className="text-sm text-gray-600 mt-1">Infinite personalized AI Wikipedia with search and discovery.</p>
                            </div>
                            <div className="border border-gray-300 p-3 bg-gray-50">
                                <h3 className="font-bold text-blue-700">Foodbuddy</h3>
                                <p className="text-sm text-gray-600 mt-1">Personalized AI nutrition with accountability partner and social features.</p>
                            </div>
                            <div className="border border-gray-300 p-3 bg-gray-50">
                                <h3 className="font-bold text-blue-700">StartKit (Kit)</h3>
                                <p className="text-sm text-gray-600 mt-1">This very Operating System! A retro-futuristic AI superapp platform.</p>
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section className="bg-blue-50 p-4 border border-blue-200">
                        <h2 className="text-lg font-bold mb-3 uppercase tracking-wider text-blue-800">Get In Touch</h2>
                        <div className="space-y-1 text-sm">
                            <div><span className="font-semibold w-20 inline-block">Email:</span> <a href="mailto:asharrm18@gmail.com" className="text-blue-600 hover:underline">asharrm18@gmail.com</a></div>
                            <div><span className="font-semibold w-20 inline-block">LinkedIn:</span> <a href="https://www.linkedin.com/in/0xtr0jan/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">linkedin.com/in/0xtr0jan</a></div>
                            <div><span className="font-semibold w-20 inline-block">Website:</span> <a href="https://iarm.me" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">iarm.me</a></div>
                        </div>
                    </section>

                    <div className="text-center pt-8 pb-4">
                        <button
                            className="px-4 py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-gray-800 border-b-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white focus:outline-dotted outline-1"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="win98-statusbar bg-[#c0c0c0]">
                <div className="flex-1">
                    Ready
                </div>
            </div>
        </div>
    );
};
