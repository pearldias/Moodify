import React from 'react';
import { Instagram, Facebook, Youtube, Github, Mail, Phone, MapPin, Heart, Music } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/moodify', label: 'Instagram' },
    { icon: Facebook, href: 'https://facebook.com/moodify', label: 'Facebook' },
    { icon: Youtube, href: 'https://youtube.com/moodify', label: 'YouTube' },
    { icon: Github, href: 'https://github.com/pearldias/Moodify', label: 'GitHub' },
  ];

  const contactDetails = [
    { icon: MapPin, text: '123 Melody Lane, Music City, 403709' },
    { icon: Phone, text: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: Mail, text: 'contact@moodify.com', href: 'mailto:contact@moodify.com' },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-gray-300 font-sans relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-4 py-4 relative z-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-7">
          
          {/* Brand Section */}
<div className="space-y-4 flex flex-col items-center sm:items-start">
  <div className="flex items-center justify-center sm:justify-start space-x-2">
    <h3 className="text-2xl font-bold text-white">Moodify</h3>
  </div>
  <p className="text-sm text-gray-400 max-w-sm text-center sm:text-left">
    "Where your emotions meet their perfect melody."<br/>Playlists curated for every mood and moment.
  </p>
  <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs text-gray-500">
    <span>Made with</span>
    <Heart className="w-4 h-4 text-red-400 fill-current" />
    <span>for music lovers</span>
  </div>
</div>

          {/* Contact Us */}
          <div className="order-2 md:order-none space-y-4 text-sm sm:text-base text-center md:text-left">
            <h4 className="text-center md:text-left sm:text-lg font-semibold text-white py-2">Contact Us</h4>
            <ul className="space-y-2 inline-block text-left">
              {contactDetails.map((detail, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <detail.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  {detail.href ? (
                    <a href={detail.href} className="text-xs sm:text-sm text-gray-400 hover:text-purple-400 transition-colors">
                      {detail.text}
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-400">{detail.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
<div className="order-3 md:order-none flex flex-col items-center md:items-end space-y-6 text-center md:text-right">
  <h4 className="text-xl font-semibold text-white">Follow Us</h4>
  <div className="flex justify-center md:justify-end gap-3 md:mt-4 mt-2">
    {socialLinks.map((link, index) => (
      <a
        key={index}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.label}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-purple-400 transition-all duration-300 transform hover:scale-110"
      >
        <link.icon className="w-4 h-4" />
      </a>
    ))}
  </div>
  <p className="text-xs text-gray-500">
    Join our community and stay updated with the latest playlists.
  </p>
</div>
        </div>

<div className="mt-2 pt-1 border-t border-gray-800 flex flex-col sm:flex-row justify-center md:justify-between items-center text-xs text-gray-500 space-y-2 sm:space-y-0">
  <p className="text-center md:text-left">&copy; {year} Moodify. All Rights Reserved.</p>
  <p className="text-center md:text-left">Crafting musical experiences since 2025</p>
  <div className="flex justify-center md:justify-end gap-3 sm:gap-4">
    <a href="#privacy" className="hover:text-purple-400">Privacy Policy</a>
    <a href="#terms" className="hover:text-purple-400">Terms</a>
    <a href="#cookies" className="hover:text-purple-400">Cookies</a>
  </div>
</div>


      </div>
    </footer>
  );
};

export default Footer;
