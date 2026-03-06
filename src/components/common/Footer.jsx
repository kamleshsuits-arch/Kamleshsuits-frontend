import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import logo from "../../assets/K_suit.png";

const Footer = () => {
  return (
    <footer className="hidden md:block bg-stone-100 pt-16 pb-8 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 md:h-16 w-auto">
                <img
                  src={logo}
                  alt="Kamlesh Suits"
                  className="h-full w-auto object-contain"
                />
              </div>
            </Link>
            <p className="text-sm text-secondary font-light leading-relaxed hidden md:block">
              Redefining elegance with our premium collection of ladies suits and ethnic wear. Thoughtfully crafted for the modern woman who values grace, comfort, and timeless style.
            </p>
          </div>

          {/* Quick Links */}
          <div className="hidden md:block">
            <h4 className="font-serif text-primary text-lg mb-6">Shop</h4>
            <ul className="space-y-3 text-sm text-secondary font-light">
              <li><Link to="/" className="hover:text-accent transition">All Products</Link></li>
              <li><Link to="/wishlist" className="hover:text-accent transition">My Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-accent transition">Shopping Bag</Link></li>
              <li><Link to="/" className="hover:text-accent transition">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="hidden md:block">
            <h4 className="font-serif text-primary text-lg mb-6">Support</h4>
            <ul className="space-y-3 text-sm text-secondary font-light">
              <li><a href="#" className="hover:text-accent transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-accent transition">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-accent transition">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-accent transition">FAQs</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="hidden md:block">
            <h4 className="font-serif text-primary text-lg mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-secondary font-light">
              <li className="flex items-start gap-3">
                <HiOutlineLocationMarker className="text-xl text-accent shrink-0" />
                <a 
                  href="https://maps.app.goo.gl/zf13nEAMTGPoXtyc8" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-accent transition"
                >
                  Kamlesh suits, Khandewla, Pataudi Gurugram Haryana pin 122504
                </a>
              </li>
              <li className="flex items-center gap-3">
                <HiOutlinePhone className="text-xl text-accent shrink-0" />
                <a href="tel:+919992892775" className="hover:text-accent transition">+91 99928 92775</a>
              </li>
              <li className="flex items-center gap-3">
                <HiOutlineMail className="text-xl text-accent shrink-0" />
                <a href="mailto:kamleshsuits@gmail.com" className="hover:text-accent transition">kamleshsuits@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-stone-400 font-light">
            © {new Date().getFullYear()} Kamlesh Suits. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/terms" className="text-xs text-stone-400 hover:text-primary transition">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
